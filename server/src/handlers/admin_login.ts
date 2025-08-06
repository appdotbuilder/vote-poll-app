
import { db } from '../db';
import { adminUsersTable } from '../db/schema';
import { type AdminLoginInput } from '../schema';
import { eq } from 'drizzle-orm';

export const adminLogin = async (input: AdminLoginInput): Promise<boolean> => {
  try {
    // Query for user by username
    const users = await db.select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, input.username))
      .execute();

    // Check if user exists
    if (users.length === 0) {
      return false;
    }

    const user = users[0];

    // For now, using simple password comparison
    // In production, this should use proper password hashing (bcrypt, argon2, etc.)
    return user.password_hash === input.password;
  } catch (error) {
    console.error('Admin login failed:', error);
    throw error;
  }
};
