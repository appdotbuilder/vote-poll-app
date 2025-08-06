
import { db } from '../db';
import { votesTable, pollsTable, pollOptionsTable } from '../db/schema';
import { type VoteInput, type Vote } from '../schema';
import { eq, sql, and } from 'drizzle-orm';

export const vote = async (input: VoteInput): Promise<Vote> => {
  try {
    // Start a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Check if IP has already voted for this poll
      const existingVote = await tx.select()
        .from(votesTable)
        .where(and(
          eq(votesTable.poll_id, input.poll_id),
          eq(votesTable.ip_address, input.ip_address)
        ))
        .limit(1)
        .execute();

      if (existingVote.length > 0) {
        throw new Error('IP address has already voted for this poll');
      }

      // 2. Verify poll option exists and belongs to the poll
      const pollOption = await tx.select()
        .from(pollOptionsTable)
        .where(and(
          eq(pollOptionsTable.id, input.poll_option_id),
          eq(pollOptionsTable.poll_id, input.poll_id)
        ))
        .limit(1)
        .execute();

      if (pollOption.length === 0) {
        throw new Error('Poll option not found or does not belong to the specified poll');
      }

      // 3. Insert the vote record
      const voteResult = await tx.insert(votesTable)
        .values({
          poll_id: input.poll_id,
          poll_option_id: input.poll_option_id,
          ip_address: input.ip_address
        })
        .returning()
        .execute();

      // 4. Update vote count for the poll option
      await tx.update(pollOptionsTable)
        .set({
          vote_count: sql`${pollOptionsTable.vote_count} + 1`
        })
        .where(eq(pollOptionsTable.id, input.poll_option_id))
        .execute();

      // 5. Update total votes and popularity score for the poll
      // Popularity score increases by 1 for each vote (simple scoring)
      await tx.update(pollsTable)
        .set({
          total_votes: sql`${pollsTable.total_votes} + 1`,
          popularity_score: sql`${pollsTable.popularity_score} + 1`,
          updated_at: sql`now()`
        })
        .where(eq(pollsTable.id, input.poll_id))
        .execute();

      return voteResult[0];
    });

    return result;
  } catch (error) {
    console.error('Vote creation failed:', error);
    throw error;
  }
};
