
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { getAdminPolls } from '../handlers/get_admin_polls';

describe('getAdminPolls', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no polls exist', async () => {
    const result = await getAdminPolls();
    expect(result).toEqual([]);
  });

  it('should return all polls including inactive ones', async () => {
    // Create active and inactive polls
    const activePoll = await db.insert(pollsTable)
      .values({
        title: 'Active Poll',
        description: 'An active poll',
        is_active: true,
        total_votes: 10,
        popularity_score: '15.50'
      })
      .returning()
      .execute();

    const inactivePoll = await db.insert(pollsTable)
      .values({
        title: 'Inactive Poll',
        description: 'An inactive poll',
        is_active: false,
        total_votes: 5,
        popularity_score: '8.25'
      })
      .returning()
      .execute();

    const result = await getAdminPolls();

    expect(result).toHaveLength(2);

    // Check that both active and inactive polls are returned
    const activePollResult = result.find(p => p.title === 'Active Poll');
    const inactivePollResult = result.find(p => p.title === 'Inactive Poll');

    expect(activePollResult).toBeDefined();
    expect(activePollResult?.is_active).toBe(true);
    expect(activePollResult?.popularity_score).toBe(15.50);
    expect(typeof activePollResult?.popularity_score).toBe('number');

    expect(inactivePollResult).toBeDefined();
    expect(inactivePollResult?.is_active).toBe(false);
    expect(inactivePollResult?.popularity_score).toBe(8.25);
    expect(typeof inactivePollResult?.popularity_score).toBe('number');
  });

  it('should include poll options for each poll', async () => {
    // Create a poll
    const poll = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A poll with options',
        total_votes: 20,
        popularity_score: '25.75'
      })
      .returning()
      .execute();

    // Create options for the poll
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: poll[0].id,
          option_text: 'Option 1',
          thumbnail_url: 'https://example.com/thumb1.jpg',
          vote_count: 12
        },
        {
          poll_id: poll[0].id,
          option_text: 'Option 2',
          thumbnail_url: null,
          vote_count: 8
        }
      ])
      .execute();

    const result = await getAdminPolls();

    expect(result).toHaveLength(1);
    expect(result[0].options).toHaveLength(2);

    const option1 = result[0].options.find(o => o.option_text === 'Option 1');
    const option2 = result[0].options.find(o => o.option_text === 'Option 2');

    expect(option1).toBeDefined();
    expect(option1?.thumbnail_url).toBe('https://example.com/thumb1.jpg');
    expect(option1?.vote_count).toBe(12);
    expect(option1?.poll_id).toBe(poll[0].id);

    expect(option2).toBeDefined();
    expect(option2?.thumbnail_url).toBeNull();
    expect(option2?.vote_count).toBe(8);
    expect(option2?.poll_id).toBe(poll[0].id);
  });

  it('should handle polls with no options', async () => {
    // Create a poll without options
    await db.insert(pollsTable)
      .values({
        title: 'Poll Without Options',
        description: 'This poll has no options yet',
        total_votes: 0,
        popularity_score: '0.00'
      })
      .execute();

    const result = await getAdminPolls();

    expect(result).toHaveLength(1);
    expect(result[0].options).toEqual([]);
    expect(result[0].title).toBe('Poll Without Options');
    expect(result[0].popularity_score).toBe(0);
  });

  it('should return polls with correct field types', async () => {
    await db.insert(pollsTable)
      .values({
        title: 'Type Check Poll',
        description: 'Checking field types',
        cover_photo_url: 'https://example.com/cover.jpg',
        is_active: true,
        total_votes: 42,
        popularity_score: '99.99'
      })
      .execute();

    const result = await getAdminPolls();

    expect(result).toHaveLength(1);
    const poll = result[0];

    expect(typeof poll.id).toBe('number');
    expect(typeof poll.title).toBe('string');
    expect(typeof poll.description).toBe('string');
    expect(typeof poll.cover_photo_url).toBe('string');
    expect(poll.created_at).toBeInstanceOf(Date);
    expect(poll.updated_at).toBeInstanceOf(Date);
    expect(typeof poll.is_active).toBe('boolean');
    expect(typeof poll.total_votes).toBe('number');
    expect(typeof poll.popularity_score).toBe('number'); // Converted from numeric
    expect(poll.popularity_score).toBe(99.99);
  });
});
