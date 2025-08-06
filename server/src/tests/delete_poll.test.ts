
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { deletePoll } from '../handlers/delete_poll';
import { eq } from 'drizzle-orm';

describe('deletePoll', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a poll successfully', async () => {
    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A poll for testing deletion',
        total_votes: 0,
        popularity_score: '0'
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Delete the poll
    const result = await deletePoll(pollId);

    expect(result).toBe(true);

    // Verify poll is deleted
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, pollId))
      .execute();

    expect(polls).toHaveLength(0);
  });

  it('should cascade delete poll options and votes', async () => {
    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll with Options',
        description: 'A poll for testing cascade deletion',
        total_votes: 2,
        popularity_score: '5.5'
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Create poll options
    const optionResult = await db.insert(pollOptionsTable)
      .values([
        {
          poll_id: pollId,
          option_text: 'Option 1',
          vote_count: 1
        },
        {
          poll_id: pollId,
          option_text: 'Option 2',
          vote_count: 1
        }
      ])
      .returning()
      .execute();

    // Create votes for the options
    await db.insert(votesTable)
      .values([
        {
          poll_id: pollId,
          poll_option_id: optionResult[0].id,
          ip_address: '192.168.1.1'
        },
        {
          poll_id: pollId,
          poll_option_id: optionResult[1].id,
          ip_address: '192.168.1.2'
        }
      ])
      .execute();

    // Delete the poll
    const result = await deletePoll(pollId);

    expect(result).toBe(true);

    // Verify poll is deleted
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, pollId))
      .execute();

    expect(polls).toHaveLength(0);

    // Verify options are cascade deleted
    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.poll_id, pollId))
      .execute();

    expect(options).toHaveLength(0);

    // Verify votes are cascade deleted
    const votes = await db.select()
      .from(votesTable)
      .where(eq(votesTable.poll_id, pollId))
      .execute();

    expect(votes).toHaveLength(0);
  });

  it('should return false when poll does not exist', async () => {
    // Try to delete non-existent poll
    const result = await deletePoll(99999);

    expect(result).toBe(false);
  });

  it('should handle deletion of poll with no options or votes', async () => {
    // Create test poll without options or votes
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Empty Poll',
        description: null,
        cover_photo_url: null,
        is_active: false,
        total_votes: 0,
        popularity_score: '0'
      })
      .returning()
      .execute();

    const pollId = pollResult[0].id;

    // Delete the poll
    const result = await deletePoll(pollId);

    expect(result).toBe(true);

    // Verify poll is deleted
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, pollId))
      .execute();

    expect(polls).toHaveLength(0);
  });
});
