import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffTable } from '../db/schema';
import { type DeleteUserInput, type CreateUserInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';
// Helper function to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  // Use a simple hash for testing - in real app this would be bcrypt
  const hashedPassword = `hashed_${userData.password}`;
  
  const result = await db.insert(usersTable)
    .values({
      email: userData.email,
      password_hash: hashedPassword,
      role: userData.role
    })
    .returning()
    .execute();

  return result[0];
};

// Helper function to create a test staff record
const createTestStaff = async (userId: number) => {
  const result = await db.insert(staffTable)
    .values({
      user_id: userId,
      name: 'Test Staff',
      email: 'staff@test.com',
      phone_number: '123-456-7890',
      position: 'Manager'
    })
    .returning()
    .execute();

  return result[0];
};

// Test input for admin user
const testAdminInput: CreateUserInput = {
  email: 'admin@test.com',
  password: 'password123',
  role: 'admin'
};

// Test input for staff user
const testStaffInput: CreateUserInput = {
  email: 'staff@test.com',
  password: 'password123',
  role: 'staff'
};

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a staff user successfully', async () => {
    // Create admin and staff users
    const admin = await createTestUser(testAdminInput);
    const staff = await createTestUser(testStaffInput);

    const deleteInput: DeleteUserInput = {
      id: staff.id
    };

    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user is deleted from database
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, staff.id))
      .execute();

    expect(deletedUser).toHaveLength(0);

    // Verify admin user still exists
    const existingAdmin = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, admin.id))
      .execute();

    expect(existingAdmin).toHaveLength(1);
  });

  it('should cascade delete associated staff record', async () => {
    // Create admin and staff user
    const admin = await createTestUser(testAdminInput);
    const staff = await createTestUser(testStaffInput);
    
    // Create staff record for the staff user
    const staffRecord = await createTestStaff(staff.id);

    const deleteInput: DeleteUserInput = {
      id: staff.id
    };

    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify both user and staff records are deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, staff.id))
      .execute();

    const deletedStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, staffRecord.id))
      .execute();

    expect(deletedUser).toHaveLength(0);
    expect(deletedStaff).toHaveLength(0);
  });

  it('should delete an admin user when there are multiple admins', async () => {
    // Create two admin users
    const admin1 = await createTestUser(testAdminInput);
    const admin2 = await createTestUser({
      email: 'admin2@test.com',
      password: 'password123',
      role: 'admin'
    });

    const deleteInput: DeleteUserInput = {
      id: admin1.id
    };

    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify first admin is deleted
    const deletedAdmin = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, admin1.id))
      .execute();

    expect(deletedAdmin).toHaveLength(0);

    // Verify second admin still exists
    const existingAdmin = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, admin2.id))
      .execute();

    expect(existingAdmin).toHaveLength(1);
  });

  it('should prevent deletion of the last admin user', async () => {
    // Create only one admin user
    const admin = await createTestUser(testAdminInput);

    const deleteInput: DeleteUserInput = {
      id: admin.id
    };

    // Should throw error when trying to delete the last admin
    expect(deleteUser(deleteInput)).rejects.toThrow(/cannot delete the last admin user/i);

    // Verify admin user still exists
    const existingAdmin = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, admin.id))
      .execute();

    expect(existingAdmin).toHaveLength(1);
  });

  it('should throw error when trying to delete non-existent user', async () => {
    const deleteInput: DeleteUserInput = {
      id: 999 // Non-existent ID
    };

    // Should throw error for non-existent user
    expect(deleteUser(deleteInput)).rejects.toThrow(/user with id 999 not found/i);
  });

  it('should handle deletion when user has no associated staff record', async () => {
    // Create a staff user without associated staff record
    const staffUser = await createTestUser(testStaffInput);
    
    // Also create an admin to ensure we don't hit the "last admin" restriction
    await createTestUser(testAdminInput);

    const deleteInput: DeleteUserInput = {
      id: staffUser.id
    };

    const result = await deleteUser(deleteInput);

    expect(result.success).toBe(true);

    // Verify user is deleted
    const deletedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, staffUser.id))
      .execute();

    expect(deletedUser).toHaveLength(0);
  });
});