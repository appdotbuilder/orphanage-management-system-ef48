import { db } from '../db';
import { staffTable, usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Staff } from '../schema';

export const getStaffById = async (id: number): Promise<Staff | null> => {
  try {
    // Query staff with joined user information
    const results = await db.select()
      .from(staffTable)
      .innerJoin(usersTable, eq(staffTable.user_id, usersTable.id))
      .where(eq(staffTable.id, id))
      .execute();

    // Return null if staff member not found
    if (results.length === 0) {
      return null;
    }

    // Extract staff data from joined result
    const result = results[0];
    const staffData = result.staff;

    return {
      id: staffData.id,
      user_id: staffData.user_id,
      name: staffData.name,
      email: staffData.email,
      phone_number: staffData.phone_number,
      position: staffData.position,
      created_at: staffData.created_at,
      updated_at: staffData.updated_at
    };
  } catch (error) {
    console.error('Staff retrieval failed:', error);
    throw error;
  }
};