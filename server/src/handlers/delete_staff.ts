import { db } from '../db';
import { staffTable, usersTable } from '../db/schema';
import { type DeleteStaffInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteStaff = async (input: DeleteStaffInput): Promise<{ success: boolean }> => {
  try {
    // First, check if the staff record exists
    const existingStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, input.id))
      .execute();

    if (existingStaff.length === 0) {
      throw new Error(`Staff with ID ${input.id} not found`);
    }

    // Delete the staff record (this will NOT delete the associated user due to cascade settings)
    const result = await db.delete(staffTable)
      .where(eq(staffTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Staff deletion failed:', error);
    throw error;
  }
};