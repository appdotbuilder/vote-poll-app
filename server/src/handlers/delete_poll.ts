
import { db } from '../db';
import { pollsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deletePoll(id: number): Promise<boolean> {
  try {
    // Delete poll - CASCADE will automatically remove options and votes
    const result = await db.delete(pollsTable)
      .where(eq(pollsTable.id, id))
      .returning()
      .execute();

    // Return true if poll was found and deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Poll deletion failed:', error);
    throw error;
  }
}
