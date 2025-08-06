
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { checkVoteEligibility } from '../handlers/check_vote_eligibility';

describe('checkVoteEligibility', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return true when IP has not voted for poll', async () => {
    // Create a poll first
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll'
      })
      .returning()
      .execute();
    
    const pollId = pollResult[0].id;
    const ipAddress = '192.168.1.1';

    const isEligible = await checkVoteEligibility(pollId, ipAddress);

    expect(isEligible).toBe(true);
  });

  it('should return false when IP has already voted for poll', async () => {
    // Create a poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll'
      })
      .returning()
      .execute();
    
    const pollId = pollResult[0].id;

    // Create a poll option
    const optionResult = await db.insert(pollOptionsTable)
      .values({
        poll_id: pollId,
        option_text: 'Option 1'
      })
      .returning()
      .execute();
    
    const optionId = optionResult[0].id;
    const ipAddress = '192.168.1.1';

    // Create a vote for this IP and poll
    await db.insert(votesTable)
      .values({
        poll_id: pollId,
        poll_option_id: optionId,
        ip_address: ipAddress
      })
      .execute();

    const isEligible = await checkVoteEligibility(pollId, ipAddress);

    expect(isEligible).toBe(false);
  });

  it('should return true when IP has voted for different poll', async () => {
    // Create two polls
    const poll1Result = await db.insert(pollsTable)
      .values({
        title: 'Test Poll 1',
        description: 'First test poll'
      })
      .returning()
      .execute();
    
    const poll2Result = await db.insert(pollsTable)
      .values({
        title: 'Test Poll 2',
        description: 'Second test poll'
      })
      .returning()
      .execute();
    
    const poll1Id = poll1Result[0].id;
    const poll2Id = poll2Result[0].id;

    // Create poll options for both polls
    const option1Result = await db.insert(pollOptionsTable)
      .values({
        poll_id: poll1Id,
        option_text: 'Option 1 for Poll 1'
      })
      .returning()
      .execute();
    
    const ipAddress = '192.168.1.1';

    // Vote on poll 1
    await db.insert(votesTable)
      .values({
        poll_id: poll1Id,
        poll_option_id: option1Result[0].id,
        ip_address: ipAddress
      })
      .execute();

    // Check eligibility for poll 2 (should be true)
    const isEligible = await checkVoteEligibility(poll2Id, ipAddress);

    expect(isEligible).toBe(true);
  });

  it('should return true when different IP has voted for same poll', async () => {
    // Create a poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll'
      })
      .returning()
      .execute();
    
    const pollId = pollResult[0].id;

    // Create a poll option
    const optionResult = await db.insert(pollOptionsTable)
      .values({
        poll_id: pollId,
        option_text: 'Option 1'
      })
      .returning()
      .execute();
    
    const optionId = optionResult[0].id;

    // Create a vote from a different IP
    await db.insert(votesTable)
      .values({
        poll_id: pollId,
        poll_option_id: optionId,
        ip_address: '192.168.1.100'
      })
      .execute();

    // Check eligibility for a different IP
    const isEligible = await checkVoteEligibility(pollId, '192.168.1.1');

    expect(isEligible).toBe(true);
  });

  it('should handle IPv6 addresses correctly', async () => {
    // Create a poll
    const pollResult = await db.insert(pollsTable)
      .values({
        title: 'Test Poll',
        description: 'A test poll'
      })
      .returning()
      .execute();
    
    const pollId = pollResult[0].id;
    const ipv6Address = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';

    const isEligible = await checkVoteEligibility(pollId, ipv6Address);

    expect(isEligible).toBe(true);
  });
});
