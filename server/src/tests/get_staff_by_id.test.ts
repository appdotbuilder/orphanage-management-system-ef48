import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffTable } from '../db/schema';
import { getStaffById } from '../handlers/get_staff_by_id';
import { eq } from 'drizzle-orm';

describe('getStaffById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return staff with all information when staff exists', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'staff@example.com',
        password_hash: 'hashedpassword123',
        role: 'staff'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create staff record
    const staffResult = await db.insert(staffTable)
      .values({
        user_id: userId,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone_number: '+1234567890',
        position: 'Manager'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Test the handler
    const result = await getStaffById(staffId);

    // Verify staff information
    expect(result).not.toBeNull();
    expect(result!.id).toBe(staffId);
    expect(result!.user_id).toBe(userId);
    expect(result!.name).toBe('John Doe');
    expect(result!.email).toBe('john.doe@example.com');
    expect(result!.phone_number).toBe('+1234567890');
    expect(result!.position).toBe('Manager');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return staff with null phone number when phone is not provided', async () => {
    // Create a user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'staff2@example.com',
        password_hash: 'hashedpassword123',
        role: 'staff'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create staff record without phone number
    const staffResult = await db.insert(staffTable)
      .values({
        user_id: userId,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone_number: null, // Explicitly null
        position: 'Assistant'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Test the handler
    const result = await getStaffById(staffId);

    // Verify staff information with null phone
    expect(result).not.toBeNull();
    expect(result!.id).toBe(staffId);
    expect(result!.name).toBe('Jane Smith');
    expect(result!.email).toBe('jane.smith@example.com');
    expect(result!.phone_number).toBeNull();
    expect(result!.position).toBe('Assistant');
  });

  it('should return null when staff does not exist', async () => {
    const nonExistentId = 999;

    const result = await getStaffById(nonExistentId);

    expect(result).toBeNull();
  });

  it('should handle admin user role correctly', async () => {
    // Create an admin user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: 'hashedpassword123',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create staff record for admin user
    const staffResult = await db.insert(staffTable)
      .values({
        user_id: userId,
        name: 'Admin User',
        email: 'admin.user@example.com',
        phone_number: '+9876543210',
        position: 'Administrator'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Test the handler
    const result = await getStaffById(staffId);

    // Verify staff information for admin
    expect(result).not.toBeNull();
    expect(result!.id).toBe(staffId);
    expect(result!.user_id).toBe(userId);
    expect(result!.name).toBe('Admin User');
    expect(result!.position).toBe('Administrator');
  });

  it('should verify staff data is properly stored in database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'verify@example.com',
        password_hash: 'hashedpassword123',
        role: 'staff'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create staff record
    const staffResult = await db.insert(staffTable)
      .values({
        user_id: userId,
        name: 'Verification Test',
        email: 'verify.test@example.com',
        phone_number: '+1111111111',
        position: 'Tester'
      })
      .returning()
      .execute();

    const staffId = staffResult[0].id;

    // Get staff through handler
    const handlerResult = await getStaffById(staffId);

    // Directly query database to verify
    const dbResult = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, staffId))
      .execute();

    // Compare handler result with database
    expect(handlerResult).not.toBeNull();
    expect(dbResult).toHaveLength(1);
    expect(handlerResult!.id).toBe(dbResult[0].id);
    expect(handlerResult!.name).toBe(dbResult[0].name);
    expect(handlerResult!.email).toBe(dbResult[0].email);
    expect(handlerResult!.phone_number).toBe(dbResult[0].phone_number);
    expect(handlerResult!.position).toBe(dbResult[0].position);
  });
});