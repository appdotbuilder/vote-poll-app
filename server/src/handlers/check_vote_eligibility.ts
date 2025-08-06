
import { db } from '../db';
import { votesTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function checkVoteEligibility(pollId: number, ipAddress: string): Promise<boolean> {
  try {
    // Check if there's already a vote from this IP for this poll
    const existingVotes = await db.select()
      .from(votesTable)
      .where(and(
        eq(votesTable.poll_id, pollId),
        eq(votesTable.ip_address, ipAddress)
      ))
      .execute();

    // Return true if no existing vote found (eligible to vote)
    // Return false if vote already exists (not eligible to vote)
    return existingVotes.length === 0;
  } catch (error) {
    console.error('Vote eligibility check failed:', error);
    throw error;
  }
}
