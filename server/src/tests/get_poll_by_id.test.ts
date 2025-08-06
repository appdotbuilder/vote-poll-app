
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { getPollById } from '../handlers/get_poll_by_id';

describe('getPollById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when poll does not exist', async () => {
    const result = await getPollById(999);
    expect(result).toBeNull();
  });

  it('should return poll with empty options array when no options exist', async () => {
    // Create a poll without options
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll',
        cover_photo_url: 'https://example.com/cover.jpg',
        is_active: true,
        total_votes: 0,
        popularity_score: '15.75'
      })
      .returning()
      .execute();

    const poll = pollResult[0];
    const result = await getPollById(poll.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(poll.id);
    expect(result!.title).toEqual('Test Poll');
    expect(result!.description).toEqual('A test poll');
    expect(result!.cover_photo_url).toEqual('https://example.com/cover.jpg');
    expect(result!.is_active).toBe(true);
    expect(result!.total_votes).toEqual(0);
    expect(result!.popularity_score).toEqual(15.75);
    expect(typeof result!.popularity_score).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.options).toEqual([]);
  });

  it('should return poll with its options', async () => {
    // Create a poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Favorite Color',
        description: 'What is your favorite color?',
        cover_photo_url: null,
        is_active: true,
        total_votes: 10,
        popularity_score: '25.50'
      })
      .returning()
      .execute();

    const poll = pollResult[0];

    // Create poll options
    const optionsResult = await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: poll.id,
          option_text: 'Red',
          thumbnail_url: 'https://example.com/red.jpg',
          vote_count: 5
        },
        {
          poll_id: poll.id,
          option_text: 'Blue',
          thumbnail_url: null,
          vote_count: 3
        },
        {
          poll_id: poll.id,
          option_text: 'Green',
          thumbnail_url: 'https://example.com/green.jpg',
          vote_count: 2
        }
      ])
      .returning()
      .execute();

    const result = await getPollById(poll.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(poll.id);
    expect(result!.title).toEqual('Favorite Color');
    expect(result!.description).toEqual('What is your favorite color?');
    expect(result!.cover_photo_url).toBeNull();
    expect(result!.is_active).toBe(true);
    expect(result!.total_votes).toEqual(10);
    expect(result!.popularity_score).toEqual(25.50);
    expect(typeof result!.popularity_score).toBe('number');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify options
    expect(result!.options).toHaveLength(3);
    
    const redOption = result!.options.find(opt => opt.option_text === 'Red');
    expect(redOption).toBeDefined();
    expect(redOption!.poll_id).toEqual(poll.id);
    expect(redOption!.thumbnail_url).toEqual('https://example.com/red.jpg');
    expect(redOption!.vote_count).toEqual(5);
    expect(redOption!.created_at).toBeInstanceOf(Date);

    const blueOption = result!.options.find(opt => opt.option_text === 'Blue');
    expect(blueOption).toBeDefined();
    expect(blueOption!.thumbnail_url).toBeNull();
    expect(blueOption!.vote_count).toEqual(3);

    const greenOption = result!.options.find(opt => opt.option_text === 'Green');
    expect(greenOption).toBeDefined();
    expect(greenOption!.thumbnail_url).toEqual('https://example.com/green.jpg');
    expect(greenOption!.vote_count).toEqual(2);
  });

  it('should handle poll with null description and cover_photo_url', async () => {
    // Create a minimal poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Simple Poll',
        description: null,
        cover_photo_url: null,
        is_active: false,
        total_votes: 0,
        popularity_score: '0.00'
      })
      .returning()
      .execute();

    const poll = pollResult[0];
    const result = await getPollById(poll.id);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Simple Poll');
    expect(result!.description).toBeNull();
    expect(result!.cover_photo_url).toBeNull();
    expect(result!.is_active).toBe(false);
    expect(result!.popularity_score).toEqual(0);
    expect(typeof result!.popularity_score).toBe('number');
  });
});
