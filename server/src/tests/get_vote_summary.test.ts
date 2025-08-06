
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { getVoteSummary } from '../handlers/get_vote_summary';

describe('getVoteSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return vote summary for poll with no votes', async () => {
    // Create poll
    const poll = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        is_active: true,
        total_votes: 0,
        popularity_score: '0'
      })
      .returning()
      .execute();

    // Create options
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: poll[0].id,
          option_text: 'Option A',
          vote_count: 0
        },
        {
          poll_id: poll[0].id,
          option_text: 'Option B',
          vote_count: 0
        }
      ])
      .execute();

    const result = await getVoteSummary(poll[0].id);

    expect(result.poll_id).toEqual(poll[0].id);
    expect(result.total_votes).toEqual(0);
    expect(result.options).toHaveLength(2);
    expect(result.options[0].option_text).toEqual('Option A');
    expect(result.options[0].vote_count).toEqual(0);
    expect(result.options[0].percentage).toEqual(0);
    expect(result.options[1].option_text).toEqual('Option B');
    expect(result.options[1].vote_count).toEqual(0);
    expect(result.options[1].percentage).toEqual(0);
  });

  it('should return vote summary with correct percentages', async () => {
    // Create poll
    const poll = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        is_active: true,
        total_votes: 100,
        popularity_score: '50.5'
      })
      .returning()
      .execute();

    // Create options with votes
    const options = await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: poll[0].id,
          option_text: 'Option A',
          vote_count: 60
        },
        {
          poll_id: poll[0].id,
          option_text: 'Option B',
          vote_count: 40
        }
      ])
      .returning()
      .execute();

    const result = await getVoteSummary(poll[0].id);

    expect(result.poll_id).toEqual(poll[0].id);
    expect(result.total_votes).toEqual(100);
    expect(result.options).toHaveLength(2);
    
    // Check first option
    expect(result.options[0].option_text).toEqual('Option A');
    expect(result.options[0].vote_count).toEqual(60);
    expect(result.options[0].percentage).toEqual(60);
    
    // Check second option
    expect(result.options[1].option_text).toEqual('Option B');
    expect(result.options[1].vote_count).toEqual(40);
    expect(result.options[1].percentage).toEqual(40);
  });

  it('should handle decimal percentages correctly', async () => {
    // Create poll with vote count that results in decimal percentages
    const poll = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        is_active: true,
        total_votes: 3,
        popularity_score: '1.5'
      })
      .returning()
      .execute();

    // Create options - should result in 33.33% and 66.67%
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: poll[0].id,
          option_text: 'Option A',
          vote_count: 1
        },
        {
          poll_id: poll[0].id,
          option_text: 'Option B',
          vote_count: 2
        }
      ])
      .execute();

    const result = await getVoteSummary(poll[0].id);

    expect(result.total_votes).toEqual(3);
    expect(result.options[0].percentage).toEqual(33.33);
    expect(result.options[1].percentage).toEqual(66.67);
  });

  it('should return empty options array for non-existent poll', async () => {
    const result = await getVoteSummary(999);

    expect(result.poll_id).toEqual(999);
    expect(result.total_votes).toEqual(0);
    expect(result.options).toHaveLength(0);
  });

  it('should return options ordered by id', async () => {
    // Create poll
    const poll = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        is_active: true,
        total_votes: 30,
        popularity_score: '15'
      })
      .returning()
      .execute();

    // Create options in specific order
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: poll[0].id,
          option_text: 'Third Option',
          vote_count: 5
        },
        {
          poll_id: poll[0].id,
          option_text: 'First Option',
          vote_count: 10
        },
        {
          poll_id: poll[0].id,
          option_text: 'Second Option',
          vote_count: 15
        }
      ])
      .execute();

    const result = await getVoteSummary(poll[0].id);

    expect(result.options).toHaveLength(3);
    // Should be ordered by ID, not by vote count or text
    expect(result.options[0].option_text).toEqual('Third Option');
    expect(result.options[1].option_text).toEqual('First Option');
    expect(result.options[2].option_text).toEqual('Second Option');
  });
});
