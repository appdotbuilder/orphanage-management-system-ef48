import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staffTable, usersTable } from '../db/schema';
import { type DeleteStaffInput } from '../schema';
import { deleteStaff } from '../handlers/delete_staff';
import { eq } from 'drizzle-orm';

describe('deleteStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete a staff record', async () => {
    // Create a user first
    const user = await db.insert(usersTable)
      .values({
        email: 'staff@example.com',
        password_hash: 'hashed_password',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create a staff record
    const staff = await db.insert(staffTable)
      .values({
        user_id: user[0].id,
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '+1234567890',
        position: 'Manager'
      })
      .returning()
      .execute();

    const input: DeleteStaffInput = {
      id: staff[0].id
    };

    // Delete the staff record
    const result = await deleteStaff(input);

    // Verify the operation was successful
    expect(result.success).toBe(true);

    // Verify the staff record was deleted
    const deletedStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, staff[0].id))
      .execute();

    expect(deletedStaff).toHaveLength(0);

    // Verify the associated user record still exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user[0].id))
      .execute();

    expect(existingUser).toHaveLength(1);
    expect(existingUser[0].id).toEqual(user[0].id);
  });

  it('should throw error when staff does not exist', async () => {
    const input: DeleteStaffInput = {
      id: 9999 // Non-existent staff ID
    };

    await expect(deleteStaff(input)).rejects.toThrow(/Staff with ID 9999 not found/);
  });

  it('should handle deletion of staff with null phone number', async () => {
    // Create a user first
    const user = await db.insert(usersTable)
      .values({
        email: 'staff2@example.com',
        password_hash: 'hashed_password',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create a staff record with null phone_number
    const staff = await db.insert(staffTable)
      .values({
        user_id: user[0].id,
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone_number: null,
        position: 'Assistant'
      })
      .returning()
      .execute();

    const input: DeleteStaffInput = {
      id: staff[0].id
    };

    // Delete the staff record
    const result = await deleteStaff(input);

    // Verify the operation was successful
    expect(result.success).toBe(true);

    // Verify the staff record was deleted
    const deletedStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, staff[0].id))
      .execute();

    expect(deletedStaff).toHaveLength(0);
  });

  it('should delete multiple staff records independently', async () => {
    // Create users first
    const user1 = await db.insert(usersTable)
      .values({
        email: 'staff1@example.com',
        password_hash: 'hashed_password',
        role: 'staff'
      })
      .returning()
      .execute();

    const user2 = await db.insert(usersTable)
      .values({
        email: 'staff2@example.com',
        password_hash: 'hashed_password',
        role: 'staff'
      })
      .returning()
      .execute();

    // Create staff records
    const staff1 = await db.insert(staffTable)
      .values({
        user_id: user1[0].id,
        name: 'Staff One',
        email: 'staff1@company.com',
        phone_number: '+1111111111',
        position: 'Developer'
      })
      .returning()
      .execute();

    const staff2 = await db.insert(staffTable)
      .values({
        user_id: user2[0].id,
        name: 'Staff Two',
        email: 'staff2@company.com',
        phone_number: '+2222222222',
        position: 'Designer'
      })
      .returning()
      .execute();

    // Delete the first staff record
    const result1 = await deleteStaff({ id: staff1[0].id });
    expect(result1.success).toBe(true);

    // Verify first staff was deleted but second still exists
    const remainingStaff = await db.select()
      .from(staffTable)
      .execute();

    expect(remainingStaff).toHaveLength(1);
    expect(remainingStaff[0].id).toEqual(staff2[0].id);
    expect(remainingStaff[0].name).toEqual('Staff Two');

    // Delete the second staff record
    const result2 = await deleteStaff({ id: staff2[0].id });
    expect(result2.success).toBe(true);

    // Verify all staff records are deleted
    const allStaff = await db.select()
      .from(staffTable)
      .execute();

    expect(allStaff).toHaveLength(0);
  });
});