
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { getPolls } from '../handlers/get_polls';

describe('getPolls', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no polls exist', async () => {
    const result = await getPolls();
    expect(result).toEqual([]);
  });

  it('should return active polls with their options', async () => {
    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        cover_photo_url: null,
        is_active: true,
        total_votes: 10,
        popularity_score: '5.5'
      })
      .returning()
      .execute();

    const poll = pollResult[0];

    // Create poll options
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: poll.id,
          option_text: 'Option 1',
          thumbnail_url: null,
          vote_count: 6
        },
        {
          poll_id: poll.id,
          option_text: 'Option 2',
          thumbnail_url: null,
          vote_count: 4
        }
      ])
      .execute();

    const result = await getPolls();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(poll.id);
    expect(result[0].title).toEqual('Test Poll');
    expect(result[0].description).toEqual('A test poll');
    expect(result[0].is_active).toBe(true);
    expect(result[0].total_votes).toEqual(10);
    expect(result[0].popularity_score).toEqual(5.5);
    expect(typeof result[0].popularity_score).toBe('number');
    expect(result[0].options).toHaveLength(2);
    expect(result[0].options[0].option_text).toEqual('Option 1');
    expect(result[0].options[1].option_text).toEqual('Option 2');
  });

  it('should exclude inactive polls', async () => {
    // Create active poll
    const activePoll = await db.insert(pollsTable)
      .values({
        title: 'Active Poll',
        description: null,
        cover_photo_url: null,
        is_active: true,
        total_votes: 5,
        popularity_score: '3.0'
      })
      .returning()
      .execute();

    // Create inactive poll
    await db.insert(pollsTable)
      .values({
        title: 'Inactive Poll',
        description: null,
        cover_photo_url: null,
        is_active: false,
        total_votes: 0,
        popularity_score: '0.0'
      })
      .returning()
      .execute();

    const result = await getPolls();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Active Poll');
    expect(result[0].is_active).toBe(true);
  });

  it('should order polls by popularity_score DESC, then created_at DESC', async () => {
    // Create polls with different popularity scores and creation times
    const poll1 = await db.insert(pollsTable)
      .values({
        title: 'Low Popularity Poll',
        description: null,
        cover_photo_url: null,
        is_active: true,
        total_votes: 2,
        popularity_score: '1.0'
      })
      .returning()
      .execute();

    const poll2 = await db.insert(pollsTable)
      .values({
        title: 'High Popularity Poll',
        description: null,
        cover_photo_url: null,
        is_active: true,
        total_votes: 20,
        popularity_score: '10.0'
      })
      .returning()
      .execute();

    const poll3 = await db.insert(pollsTable)
      .values({
        title: 'Medium Popularity Poll',
        description: null,
        cover_photo_url: null,
        is_active: true,
        total_votes: 10,
        popularity_score: '5.0'
      })
      .returning()
      .execute();

    const result = await getPolls();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('High Popularity Poll');
    expect(result[0].popularity_score).toEqual(10.0);
    expect(result[1].title).toEqual('Medium Popularity Poll');
    expect(result[1].popularity_score).toEqual(5.0);
    expect(result[2].title).toEqual('Low Popularity Poll');
    expect(result[2].popularity_score).toEqual(1.0);
  });

  it('should handle polls with no options', async () => {
    // Create poll without options
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Poll Without Options',
        description: null,
        cover_photo_url: null,
        is_active: true,
        total_votes: 0,
        popularity_score: '0.0'
      })
      .returning()
      .execute();

    const result = await getPolls();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Poll Without Options');
    expect(result[0].options).toEqual([]);
  });
});
