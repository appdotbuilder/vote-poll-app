
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type CreatePollInput, type PollWithOptions } from '../schema';

export async function createPoll(input: CreatePollInput): Promise<PollWithOptions> {
  try {
    // Insert the poll record
    const pollResult = await db.insert(pollsTable)
      .values({
        title: input.title,
        description: input.description,
        cover_photo_url: input.cover_photo_url,
        is_active: true,
        total_votes: 0,
        popularity_score: '0' // Convert number to string for numeric column
      })
      .returning()
      .execute();

    const poll = pollResult[0];

    // Insert all poll options
    const optionsData = input.options.map(option => ({
      poll_id: poll.id,
      option_text: option.option_text,
      thumbnail_url: option.thumbnail_url,
      vote_count: 0
    }));

    const optionsResult = await db.insert(pollOptionsTable)
      .values(optionsData)
      .returning()
      .execute();

    // Return poll with options, converting numeric fields
    return {
      ...poll,
      popularity_score: parseFloat(poll.popularity_score), // Convert string to number
      options: optionsResult
    };
  } catch (error) {
    console.error('Poll creation failed:', error);
    throw error;
  }
}
