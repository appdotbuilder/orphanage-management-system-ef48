import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // First, check if the user exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUsers.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date()
    };

    // Add optional fields only if provided
    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    // Hash password if provided using Bun's built-in password hashing
    if (input.password !== undefined) {
      updateData.password_hash = await Bun.password.hash(input.password);
    }

    // Update the user
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};