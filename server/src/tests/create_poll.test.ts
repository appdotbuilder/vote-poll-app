
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type CreatePollInput } from '../schema';
import { createPoll } from '../handlers/create_poll';
import { eq } from 'drizzle-orm';

const testInput: CreatePollInput = {
  title: 'Favorite Programming Language',
  description: 'Which programming language do you prefer?',
  cover_photo_url: 'https://example.com/poll-cover.jpg',
  options: [
    {
      option_text: 'JavaScript',
      thumbnail_url: 'https://example.com/js.png'
    },
    {
      option_text: 'Python',
      thumbnail_url: 'https://example.com/python.png'
    },
    {
      option_text: 'TypeScript',
      thumbnail_url: null
    }
  ]
};

describe('createPoll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a poll with options', async () => {
    const result = await createPoll(testInput);

    // Validate poll fields
    expect(result.title).toEqual('Favorite Programming Language');
    expect(result.description).toEqual('Which programming language do you prefer?');
    expect(result.cover_photo_url).toEqual('https://example.com/poll-cover.jpg');
    expect(result.is_active).toBe(true);
    expect(result.total_votes).toEqual(0);
    expect(result.popularity_score).toEqual(0);
    expect(typeof result.popularity_score).toBe('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate options
    expect(result.options).toHaveLength(3);
    expect(result.options[0].option_text).toEqual('JavaScript');
    expect(result.options[0].thumbnail_url).toEqual('https://example.com/js.png');
    expect(result.options[0].poll_id).toEqual(result.id);
    expect(result.options[0].vote_count).toEqual(0);
    expect(result.options[0].id).toBeDefined();

    expect(result.options[1].option_text).toEqual('Python');
    expect(result.options[1].thumbnail_url).toEqual('https://example.com/python.png');

    expect(result.options[2].option_text).toEqual('TypeScript');
    expect(result.options[2].thumbnail_url).toBeNull();
  });

  it('should save poll to database', async () => {
    const result = await createPoll(testInput);

    // Verify poll was saved
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, result.id))
      .execute();

    expect(polls).toHaveLength(1);
    expect(polls[0].title).toEqual('Favorite Programming Language');
    expect(polls[0].description).toEqual('Which programming language do you prefer?');
    expect(polls[0].is_active).toBe(true);
    expect(polls[0].total_votes).toEqual(0);
    expect(parseFloat(polls[0].popularity_score)).toEqual(0);
  });

  it('should save poll options to database', async () => {
    const result = await createPoll(testInput);

    // Verify options were saved
    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.poll_id, result.id))
      .execute();

    expect(options).toHaveLength(3);
    expect(options[0].option_text).toEqual('JavaScript');
    expect(options[0].thumbnail_url).toEqual('https://example.com/js.png');
    expect(options[0].vote_count).toEqual(0);

    expect(options[1].option_text).toEqual('Python');
    expect(options[1].thumbnail_url).toEqual('https://example.com/python.png');

    expect(options[2].option_text).toEqual('TypeScript');
    expect(options[2].thumbnail_url).toBeNull();
  });

  it('should handle poll with minimal data', async () => {
    const minimalInput: CreatePollInput = {
      title: 'Simple Poll',
      description: null,
      cover_photo_url: null,
      options: [
        { option_text: 'Option A', thumbnail_url: null },
        { option_text: 'Option B', thumbnail_url: null }
      ]
    };

    const result = await createPoll(minimalInput);

    expect(result.title).toEqual('Simple Poll');
    expect(result.description).toBeNull();
    expect(result.cover_photo_url).toBeNull();
    expect(result.options).toHaveLength(2);
    expect(result.options[0].option_text).toEqual('Option A');
    expect(result.options[0].thumbnail_url).toBeNull();
    expect(result.options[1].option_text).toEqual('Option B');
    expect(result.options[1].thumbnail_url).toBeNull();
  });
});
