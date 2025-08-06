
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type PollWithOptions } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getPolls(): Promise<PollWithOptions[]> {
  try {
    // Get all active polls ordered by popularity_score DESC, then created_at DESC
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.is_active, true))
      .orderBy(desc(pollsTable.popularity_score), desc(pollsTable.created_at))
      .execute();

    // Get all poll options for the active polls
    const pollIds = polls.map(poll => poll.id);
    
    let pollOptions: any[] = [];
    if (pollIds.length > 0) {
      pollOptions = await db.select()
        .from(pollOptionsTable)
        .execute();
    }

    // Group options by poll_id
    const optionsByPollId = pollOptions.reduce((acc, option) => {
      if (!acc[option.poll_id]) {
        acc[option.poll_id] = [];
      }
      acc[option.poll_id].push(option);
      return acc;
    }, {} as Record<number, typeof pollOptions>);

    // Combine polls with their options
    return polls.map(poll => ({
      ...poll,
      popularity_score: parseFloat(poll.popularity_score), // Convert numeric to number
      options: optionsByPollId[poll.id] || []
    }));
  } catch (error) {
    console.error('Failed to get polls:', error);
    throw error;
  }
}
