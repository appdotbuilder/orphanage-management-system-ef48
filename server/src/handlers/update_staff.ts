import { db } from '../db';
import { staffTable } from '../db/schema';
import { type UpdateStaffInput, type Staff } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStaff = async (input: UpdateStaffInput): Promise<Staff> => {
  try {
    // Verify staff member exists first
    const existingStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, input.id))
      .execute();

    if (existingStaff.length === 0) {
      throw new Error(`Staff member with id ${input.id} not found`);
    }

    // Build update object only with provided fields
    const updateData: Partial<typeof staffTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    if (input.phone_number !== undefined) {
      updateData.phone_number = input.phone_number;
    }

    if (input.position !== undefined) {
      updateData.position = input.position;
    }

    // Update staff record
    const result = await db.update(staffTable)
      .set(updateData)
      .where(eq(staffTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Staff update failed:', error);
    throw error;
  }
};