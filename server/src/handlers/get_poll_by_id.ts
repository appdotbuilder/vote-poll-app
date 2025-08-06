
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type PollWithOptions } from '../schema';
import { eq } from 'drizzle-orm';

export async function getPollById(id: number): Promise<PollWithOptions | null> {
  try {
    // First get the poll
    const pollResults = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, id))
      .execute();

    if (pollResults.length === 0) {
      return null;
    }

    const poll = pollResults[0];

    // Get the poll options
    const optionResults = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.poll_id, id))
      .execute();

    // Convert numeric fields and structure the response
    return {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      cover_photo_url: poll.cover_photo_url,
      created_at: poll.created_at,
      updated_at: poll.updated_at,
      is_active: poll.is_active,
      total_votes: poll.total_votes,
      popularity_score: parseFloat(poll.popularity_score), // Convert numeric to number
      options: optionResults.map(option => ({
        id: option.id,
        poll_id: option.poll_id,
        option_text: option.option_text,
        thumbnail_url: option.thumbnail_url,
        vote_count: option.vote_count,
        created_at: option.created_at
      }))
    };
  } catch (error) {
    console.error('Failed to get poll by ID:', error);
    throw error;
  }
}
