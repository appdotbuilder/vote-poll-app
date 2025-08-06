
import { db } from '../db';
import { pollsTable, pollOptionsTable, votesTable } from '../db/schema';
import { type VoteSummary } from '../schema';
import { eq } from 'drizzle-orm';

export async function getVoteSummary(pollId: number): Promise<VoteSummary> {
  try {
    // Get poll options with their vote counts
    const optionsWithVotes = await db.select({
      option_id: pollOptionsTable.id,
      option_text: pollOptionsTable.option_text,
      vote_count: pollOptionsTable.vote_count
    })
    .from(pollOptionsTable)
    .where(eq(pollOptionsTable.poll_id, pollId))
    .orderBy(pollOptionsTable.id)
    .execute();

    // Get total votes for the poll
    const pollData = await db.select({
      total_votes: pollsTable.total_votes
    })
    .from(pollsTable)
    .where(eq(pollsTable.id, pollId))
    .execute();

    const totalVotes = pollData[0]?.total_votes || 0;

    // Calculate percentages for each option
    const options = optionsWithVotes.map(option => ({
      option_id: option.option_id,
      option_text: option.option_text,
      vote_count: option.vote_count,
      percentage: totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100 * 100) / 100 : 0
    }));

    return {
      poll_id: pollId,
      total_votes: totalVotes,
      options
    };
  } catch (error) {
    console.error('Get vote summary failed:', error);
    throw error;
  }
}
