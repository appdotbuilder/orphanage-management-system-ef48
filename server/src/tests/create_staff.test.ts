import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffTable } from '../db/schema';
import { type CreateStaffInput } from '../schema';
import { createStaff } from '../handlers/create_staff';
import { eq } from 'drizzle-orm';

describe('createStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'testuser@example.com',
        password_hash: 'hashed_password',
        role: 'staff'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;
  });

  const testStaffInput: CreateStaffInput = {
    user_id: 0, // Will be set to testUserId in tests
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone_number: '+1234567890',
    position: 'Manager'
  };

  it('should create a staff record successfully', async () => {
    const input = { ...testStaffInput, user_id: testUserId };
    const result = await createStaff(input);

    // Verify returned staff object
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.user_id).toBe(testUserId);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.phone_number).toBe('+1234567890');
    expect(result.position).toBe('Manager');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save staff record to database', async () => {
    const input = { ...testStaffInput, user_id: testUserId };
    const result = await createStaff(input);

    // Verify data is saved in database
    const savedStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, result.id))
      .execute();

    expect(savedStaff).toHaveLength(1);
    expect(savedStaff[0].user_id).toBe(testUserId);
    expect(savedStaff[0].name).toBe('John Doe');
    expect(savedStaff[0].email).toBe('john.doe@example.com');
    expect(savedStaff[0].phone_number).toBe('+1234567890');
    expect(savedStaff[0].position).toBe('Manager');
    expect(savedStaff[0].created_at).toBeInstanceOf(Date);
    expect(savedStaff[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create staff with null phone number', async () => {
    const inputWithNullPhone = {
      ...testStaffInput,
      user_id: testUserId,
      phone_number: null
    };
    const result = await createStaff(inputWithNullPhone);

    expect(result.phone_number).toBeNull();

    // Verify in database
    const savedStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, result.id))
      .execute();

    expect(savedStaff[0].phone_number).toBeNull();
  });

  it('should throw error when user does not exist', async () => {
    const input = { ...testStaffInput, user_id: 99999 }; // Non-existent user ID

    await expect(createStaff(input)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should throw error when user already has staff record', async () => {
    const input = { ...testStaffInput, user_id: testUserId };

    // Create first staff record
    await createStaff(input);

    // Try to create second staff record for same user
    const duplicateInput = {
      ...testStaffInput,
      user_id: testUserId,
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };

    await expect(createStaff(duplicateInput)).rejects.toThrow(/already has a staff record/i);
  });

  it('should create staff records for different users', async () => {
    // Create second user
    const secondUserResult = await db.insert(usersTable)
      .values({
        email: 'seconduser@example.com',
        password_hash: 'hashed_password2',
        role: 'staff'
      })
      .returning()
      .execute();

    const secondUserId = secondUserResult[0].id;

    // Create staff for first user
    const firstStaffInput = { ...testStaffInput, user_id: testUserId };
    const firstStaff = await createStaff(firstStaffInput);

    // Create staff for second user
    const secondStaffInput = {
      ...testStaffInput,
      user_id: secondUserId,
      name: 'Jane Smith',
      email: 'jane.smith@example.com'
    };
    const secondStaff = await createStaff(secondStaffInput);

    // Verify both records exist and are different
    expect(firstStaff.id).not.toBe(secondStaff.id);
    expect(firstStaff.user_id).toBe(testUserId);
    expect(secondStaff.user_id).toBe(secondUserId);
    expect(secondStaff.name).toBe('Jane Smith');
    expect(secondStaff.email).toBe('jane.smith@example.com');

    // Verify both exist in database
    const allStaff = await db.select().from(staffTable).execute();
    expect(allStaff).toHaveLength(2);
  });

  it('should handle various position values', async () => {
    const positions = ['CEO', 'CTO', 'Developer', 'Analyst', 'Intern'];

    for (let i = 0; i < positions.length; i++) {
      // Create a new user for each position
      const userResult = await db.insert(usersTable)
        .values({
          email: `user${i}@example.com`,
          password_hash: 'hashed_password',
          role: 'staff'
        })
        .returning()
        .execute();

      const input = {
        ...testStaffInput,
        user_id: userResult[0].id,
        name: `Staff ${i}`,
        email: `staff${i}@example.com`,
        position: positions[i]
      };

      const result = await createStaff(input);
      expect(result.position).toBe(positions[i]);
    }
  });
});