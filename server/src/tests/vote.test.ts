
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { type VoteInput } from '../schema';
import { vote } from '../handlers/vote';
import { eq } from 'drizzle-orm';

describe('vote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPollId: number;
  let testOptionId: number;

  beforeEach(async () => {
    // Create test poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A poll for testing votes'
      })
      .returning()
      .execute();
    testPollId = pollResult[0].id;

    // Create test poll option
    const optionResult = await db.insert(pollOptionsTable)
      .values({
        poll_id: testPollId,
        option_text: 'Test Option'
      })
      .returning()
      .execute();
    testOptionId = optionResult[0].id;
  });

  const testInput: VoteInput = {
    poll_id: 0, // Will be set in beforeEach
    poll_option_id: 0, // Will be set in beforeEach
    ip_address: '192.168.1.1'
  };

  it('should create a vote successfully', async () => {
    const input = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: testOptionId
    };

    const result = await vote(input);

    expect(result.id).toBeDefined();
    expect(result.poll_id).toEqual(testPollId);
    expect(result.poll_option_id).toEqual(testOptionId);
    expect(result.ip_address).toEqual('192.168.1.1');
    expect(result.voted_at).toBeInstanceOf(Date);
  });

  it('should save vote to database', async () => {
    const input = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: testOptionId
    };

    const result = await vote(input);

    const votes = await db.select()
      .from(votesTable)
      .where(eq(votesTable.id, result.id))
      .execute();

    expect(votes).toHaveLength(1);
    expect(votes[0].poll_id).toEqual(testPollId);
    expect(votes[0].poll_option_id).toEqual(testOptionId);
    expect(votes[0].ip_address).toEqual('192.168.1.1');
  });

  it('should update poll option vote count', async () => {
    const input = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: testOptionId
    };

    await vote(input);

    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.id, testOptionId))
      .execute();

    expect(options[0].vote_count).toEqual(1);
  });

  it('should update poll total votes and popularity score', async () => {
    const input = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: testOptionId
    };

    await vote(input);

    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, testPollId))
      .execute();

    expect(polls[0].total_votes).toEqual(1);
    expect(parseFloat(polls[0].popularity_score)).toEqual(1);
    expect(polls[0].updated_at).toBeInstanceOf(Date);
  });

  it('should prevent duplicate votes from same IP', async () => {
    const input = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: testOptionId
    };

    // First vote should succeed
    await vote(input);

    // Second vote from same IP should fail
    await expect(vote(input)).rejects.toThrow(/already voted/i);
  });

  it('should allow different IPs to vote on same poll', async () => {
    const input1 = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: testOptionId,
      ip_address: '192.168.1.1'
    };

    const input2 = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: testOptionId,
      ip_address: '192.168.1.2'
    };

    await vote(input1);
    await vote(input2);

    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, testPollId))
      .execute();

    expect(polls[0].total_votes).toEqual(2);
    expect(parseFloat(polls[0].popularity_score)).toEqual(2);
  });

  it('should fail when poll option does not exist', async () => {
    const input = {
      ...testInput,
      poll_id: testPollId,
      poll_option_id: 99999 // Non-existent option ID
    };

    await expect(vote(input)).rejects.toThrow(/not found/i);
  });

  it('should fail when poll option belongs to different poll', async () => {
    // Create another poll and option
    const anotherPollResult = await db.insert(pollsTable)
      .values({
        title: 'Another Poll',
        description: 'Different poll'
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      poll_id: anotherPollResult[0].id,
      poll_option_id: testOptionId // Option from different poll
    };

    await expect(vote(input)).rejects.toThrow(/not found/i);
  });
});
