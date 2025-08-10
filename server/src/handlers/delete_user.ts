import { db } from '../db';
import { usersTable } from '../db/schema';
import { type DeleteUserInput } from '../schema';
import { eq, and, count } from 'drizzle-orm';

export const deleteUser = async (input: DeleteUserInput): Promise<{ success: boolean }> => {
  try {
    // First, check if the user exists
    const userToDelete = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (userToDelete.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    const targetUser = userToDelete[0];

    // If deleting an admin, check if it's the last admin
    if (targetUser.role === 'admin') {
      const adminCountResult = await db.select({ count: count() })
        .from(usersTable)
        .where(eq(usersTable.role, 'admin'))
        .execute();

      const adminCount = adminCountResult[0].count;
      
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user');
      }
    }

    // Delete the user (staff records will cascade delete due to foreign key constraint)
    await db.delete(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};