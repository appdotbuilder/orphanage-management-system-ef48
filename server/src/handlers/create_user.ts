import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import crypto from 'crypto';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString('hex');
    
    // Hash the password using crypto.pbkdf2Sync
    const hashedPassword = crypto.pbkdf2Sync(input.password, salt, 10000, 64, 'sha512').toString('hex');
    
    // Combine salt and hash for storage
    const passwordHash = `${salt}:${hashedPassword}`;

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash: passwordHash,
        role: input.role
      })
      .returning()
      .execute();

    const user = result[0];
    return user;
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};