
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type PollWithOptions } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAdminPolls(): Promise<PollWithOptions[]> {
  try {
    // First, get all polls (including inactive ones)
    const polls = await db.select()
      .from(pollsTable)
      .execute();

    // Then get all poll options
    const allOptions = await db.select()
      .from(pollOptionsTable)
      .execute();

    // Group options by poll_id for efficient lookup
    const optionsByPollId = allOptions.reduce((acc, option) => {
      if (!acc[option.poll_id]) {
        acc[option.poll_id] = [];
      }
      acc[option.poll_id].push(option);
      return acc;
    }, {} as Record<number, typeof allOptions>);

    // Combine polls with their options and convert numeric fields
    return polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      cover_photo_url: poll.cover_photo_url,
      created_at: poll.created_at,
      updated_at: poll.updated_at,
      is_active: poll.is_active,
      total_votes: poll.total_votes,
      popularity_score: parseFloat(poll.popularity_score), // Convert numeric to number
      options: (optionsByPollId[poll.id] || []).map(option => ({
        id: option.id,
        poll_id: option.poll_id,
        option_text: option.option_text,
        thumbnail_url: option.thumbnail_url,
        vote_count: option.vote_count,
        created_at: option.created_at
      }))
    }));
  } catch (error) {
    console.error('Failed to fetch admin polls:', error);
    throw error;
  }
}
