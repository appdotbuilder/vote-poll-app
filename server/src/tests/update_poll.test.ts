
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type UpdatePollInput } from '../schema';
import { updatePoll } from '../handlers/update_poll';
import { eq } from 'drizzle-orm';

describe('updatePoll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPollId: number;

  beforeEach(async () => {
    // Create a test poll first
    const polls = await db.insert(pollsTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        cover_photo_url: 'https://example.com/original.jpg',
        is_active: true,
        total_votes: 5,
        popularity_score: '10.50'
      })
      .returning()
      .execute();

    testPollId = polls[0].id;

    // Add some options
    await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: testPollId,
          option_text: 'Option 1',
          vote_count: 3
        },
        {
          poll_id: testPollId,
          option_text: 'Option 2',
          vote_count: 2
        }
      ])
      .execute();
  });

  it('should update poll title', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Updated Title'
    };

    const result = await updatePoll(input);

    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.cover_photo_url).toEqual('https://example.com/original.jpg'); // Unchanged
    expect(result.is_active).toEqual(true); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update poll description', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      description: 'Updated description'
    };

    const result = await updatePoll(input);

    expect(result.title).toEqual('Original Title'); // Unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update poll active status', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      is_active: false
    };

    const result = await updatePoll(input);

    expect(result.is_active).toEqual(false);
    expect(result.title).toEqual('Original Title'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'New Title',
      description: 'New description',
      cover_photo_url: 'https://example.com/new.jpg',
      is_active: false
    };

    const result = await updatePoll(input);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.cover_photo_url).toEqual('https://example.com/new.jpg');
    expect(result.is_active).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null values', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      description: null,
      cover_photo_url: null
    };

    const result = await updatePoll(input);

    expect(result.description).toBeNull();
    expect(result.cover_photo_url).toBeNull();
    expect(result.title).toEqual('Original Title'); // Unchanged
  });

  it('should return poll with options', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Updated Title'
    };

    const result = await updatePoll(input);

    expect(result.options).toHaveLength(2);
    expect(result.options[0].option_text).toEqual('Option 1');
    expect(result.options[1].option_text).toEqual('Option 2');
    expect(result.options[0].poll_id).toEqual(testPollId);
    expect(result.options[1].poll_id).toEqual(testPollId);
  });

  it('should convert numeric fields correctly', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Updated Title'
    };

    const result = await updatePoll(input);

    expect(typeof result.popularity_score).toEqual('number');
    expect(result.popularity_score).toEqual(10.5);
    expect(result.total_votes).toEqual(5);
  });

  it('should save changes to database', async () => {
    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Database Updated Title',
      is_active: false
    };

    await updatePoll(input);

    // Verify changes in database
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, testPollId))
      .execute();

    expect(polls).toHaveLength(1);
    expect(polls[0].title).toEqual('Database Updated Title');
    expect(polls[0].is_active).toEqual(false);
    expect(polls[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent poll', async () => {
    const input: UpdatePollInput = {
      id: 99999,
      title: 'Non-existent'
    };

    expect(updatePoll(input)).rejects.toThrow(/poll.*not found/i);
  });

  it('should update updated_at timestamp', async () => {
    const originalPoll = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, testPollId))
      .execute();

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdatePollInput = {
      id: testPollId,
      title: 'Title with new timestamp'
    };

    const result = await updatePoll(input);

    expect(result.updated_at.getTime()).toBeGreaterThan(originalPoll[0].updated_at.getTime());
  });
});
