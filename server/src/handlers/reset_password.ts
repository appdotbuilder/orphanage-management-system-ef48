import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type ResetPasswordInput, type User } from '../schema';

// Helper function to hash password using Node.js crypto
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

export async function resetPassword(input: ResetPasswordInput): Promise<User> {
  try {
    // Check if user exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUsers.length === 0) {
      throw new Error('User not found');
    }

    // Hash the new password
    const hashedPassword = hashPassword(input.new_password);

    // Update user password and updated_at timestamp
    const result = await db.update(usersTable)
      .set({
        password_hash: hashedPassword,
        updated_at: new Date()
      })
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Failed to update password');
    }

    return result[0];
  } catch (error) {
    console.error('Password reset failed:', error);
    throw error;
  }
}