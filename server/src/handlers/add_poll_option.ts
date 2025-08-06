
import { db } from '../db';
import { pollOptionsTable, pollsTable } from '../db/schema';
import { type AddPollOptionInput, type PollOption } from '../schema';
import { eq } from 'drizzle-orm';

export async function addPollOption(input: AddPollOptionInput): Promise<PollOption> {
  try {
    // First verify the poll exists and is active
    const existingPoll = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.id, input.poll_id))
      .execute();

    if (existingPoll.length === 0) {
      throw new Error('Poll not found');
    }

    if (!existingPoll[0].is_active) {
      throw new Error('Cannot add options to inactive poll');
    }

    // Insert the new poll option
    const result = await db.insert(pollOptionsTable)
      .values({
        poll_id: input.poll_id,
        option_text: input.option_text,
        thumbnail_url: input.thumbnail_url,
        vote_count: 0
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add poll option failed:', error);
    throw error;
  }
}
