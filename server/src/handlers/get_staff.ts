import { db } from '../db';
import { staffTable, usersTable } from '../db/schema';
import { type Staff } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStaff(): Promise<Staff[]> {
  try {
    // Join staff table with users table to get comprehensive staff data
    const results = await db.select()
      .from(staffTable)
      .innerJoin(usersTable, eq(staffTable.user_id, usersTable.id))
      .execute();

    // Map the joined results to the Staff schema format
    return results.map(result => ({
      id: result.staff.id,
      user_id: result.staff.user_id,
      name: result.staff.name,
      email: result.staff.email,
      phone_number: result.staff.phone_number,
      position: result.staff.position,
      created_at: result.staff.created_at,
      updated_at: result.staff.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch staff:', error);
    throw error;
  }
}