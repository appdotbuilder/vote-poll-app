
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type AddPollOptionInput } from '../schema';
import { addPollOption } from '../handlers/add_poll_option';
import { eq } from 'drizzle-orm';

describe('addPollOption', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPollId: number;

  beforeEach(async () => {
    // Create a test poll first
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A poll for testing',
        cover_photo_url: null,
        is_active: true,
        total_votes: 0,
        popularity_score: '0'
      })
      .returning()
      .execute();

    testPollId = pollResult[0].id;
  });

  const testInput: AddPollOptionInput = {
    poll_id: 0, // Will be set in test
    option_text: 'New Option',
    thumbnail_url: 'https://example.com/thumbnail.jpg'
  };

  it('should add a poll option', async () => {
    const input = { ...testInput, poll_id: testPollId };
    const result = await addPollOption(input);

    expect(result.poll_id).toEqual(testPollId);
    expect(result.option_text).toEqual('New Option');
    expect(result.thumbnail_url).toEqual('https://example.com/thumbnail.jpg');
    expect(result.vote_count).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save poll option to database', async () => {
    const input = { ...testInput, poll_id: testPollId };
    const result = await addPollOption(input);

    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.id, result.id))
      .execute();

    expect(options).toHaveLength(1);
    expect(options[0].poll_id).toEqual(testPollId);
    expect(options[0].option_text).toEqual('New Option');
    expect(options[0].thumbnail_url).toEqual('https://example.com/thumbnail.jpg');
    expect(options[0].vote_count).toEqual(0);
    expect(options[0].created_at).toBeInstanceOf(Date);
  });

  it('should add option with null thumbnail_url', async () => {
    const input = { 
      ...testInput, 
      poll_id: testPollId,
      thumbnail_url: null 
    };
    const result = await addPollOption(input);

    expect(result.poll_id).toEqual(testPollId);
    expect(result.option_text).toEqual('New Option');
    expect(result.thumbnail_url).toBeNull();
    expect(result.vote_count).toEqual(0);
  });

  it('should throw error for non-existent poll', async () => {
    const input = { ...testInput, poll_id: 99999 };

    expect(addPollOption(input)).rejects.toThrow(/poll not found/i);
  });

  it('should throw error for inactive poll', async () => {
    // Set poll to inactive
    await db.update(pollsTable)
      .set({ is_active: false })
      .where(eq(pollsTable.id, testPollId))
      .execute();

    const input = { ...testInput, poll_id: testPollId };

    expect(addPollOption(input)).rejects.toThrow(/cannot add options to inactive poll/i);
  });
});
