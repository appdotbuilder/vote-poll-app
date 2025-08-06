
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { adminUsersTable } from '../db/schema';
import { type AdminLoginInput } from '../schema';
import { adminLogin } from '../handlers/admin_login';

// Test admin user data
const testAdmin = {
  username: 'testadmin',
  password_hash: 'testpassword123',
};

const validLoginInput: AdminLoginInput = {
  username: 'testadmin',
  password: 'testpassword123'
};

const invalidPasswordInput: AdminLoginInput = {
  username: 'testadmin',
  password: 'wrongpassword'
};

const nonExistentUserInput: AdminLoginInput = {
  username: 'nonexistent',
  password: 'anypassword'
};

describe('adminLogin', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test admin user
    await db.insert(adminUsersTable)
      .values(testAdmin)
      .execute();
  });

  afterEach(resetDB);

  it('should return true for valid credentials', async () => {
    const result = await adminLogin(validLoginInput);
    expect(result).toBe(true);
  });

  it('should return false for invalid password', async () => {
    const result = await adminLogin(invalidPasswordInput);
    expect(result).toBe(false);
  });

  it('should return false for non-existent username', async () => {
    const result = await adminLogin(nonExistentUserInput);
    expect(result).toBe(false);
  });

  it('should handle empty username', async () => {
    const emptyUsernameInput: AdminLoginInput = {
      username: '',
      password: 'anypassword'
    };
    
    const result = await adminLogin(emptyUsernameInput);
    expect(result).toBe(false);
  });

  it('should verify admin user exists in database', async () => {
    // Verify our test setup worked
    const users = await db.select()
      .from(adminUsersTable)
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].username).toBe('testadmin');
    expect(users[0].password_hash).toBe('testpassword123');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });
});
