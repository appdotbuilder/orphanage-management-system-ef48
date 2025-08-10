import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';

export const getUsers = async (): Promise<Omit<User, 'password_hash'>[]> => {
  try {
    // Fetch all users from the database, excluding password_hash for security
    const results = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      role: usersTable.role,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at
    })
    .from(usersTable)
    .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};