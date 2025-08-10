import { db } from '../db';
import { staffTable, usersTable } from '../db/schema';
import { type CreateStaffInput, type Staff } from '../schema';
import { eq } from 'drizzle-orm';

export const createStaff = async (input: CreateStaffInput): Promise<Staff> => {
  try {
    // First, verify that the user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with ID ${input.user_id} not found`);
    }

    // Check if the user already has a staff record
    const existingStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.user_id, input.user_id))
      .execute();

    if (existingStaff.length > 0) {
      throw new Error(`User with ID ${input.user_id} already has a staff record`);
    }

    // Create the staff record
    const result = await db.insert(staffTable)
      .values({
        user_id: input.user_id,
        name: input.name,
        email: input.email,
        phone_number: input.phone_number,
        position: input.position
      })
      .returning()
      .execute();

    const staff = result[0];
    return {
      id: staff.id,
      user_id: staff.user_id,
      name: staff.name,
      email: staff.email,
      phone_number: staff.phone_number,
      position: staff.position,
      created_at: staff.created_at,
      updated_at: staff.updated_at
    };
  } catch (error) {
    console.error('Staff creation failed:', error);
    throw error;
  }
};