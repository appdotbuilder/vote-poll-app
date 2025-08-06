
import { db } from '../db';
import { pollsTable, pollOptionsTable } from '../db/schema';
import { type UpdatePollInput, type PollWithOptions } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePoll = async (input: UpdatePollInput): Promise<PollWithOptions> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.cover_photo_url !== undefined) {
      updateData.cover_photo_url = input.cover_photo_url;
    }
    
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the poll
    const updatedPolls = await db.update(pollsTable)
      .set(updateData)
      .where(eq(pollsTable.id, input.id))
      .returning()
      .execute();

    if (updatedPolls.length === 0) {
      throw new Error(`Poll with id ${input.id} not found`);
    }

    // Get the poll options
    const options = await db.select()
      .from(pollOptionsTable)
      .where(eq(pollOptionsTable.poll_id, input.id))
      .execute();

    const updatedPoll = updatedPolls[0];
    
    // Convert numeric fields and return with options
    return {
      ...updatedPoll,
      popularity_score: parseFloat(updatedPoll.popularity_score),
      options: options
    };
  } catch (error) {
    console.error('Poll update failed:', error);
    throw error;
  }
};
