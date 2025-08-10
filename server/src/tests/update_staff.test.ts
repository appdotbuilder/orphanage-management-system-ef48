import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffTable } from '../db/schema';
import { type UpdateStaffInput } from '../schema';
import { updateStaff } from '../handlers/update_staff';
import { eq } from 'drizzle-orm';

describe('updateStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test user and staff
  const createTestUserAndStaff = async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        role: 'staff'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test staff
    const staffResult = await db.insert(staffTable)
      .values({
        user_id: user.id,
        name: 'Original Name',
        email: 'test@example.com',
        phone_number: '123-456-7890',
        position: 'Original Position'
      })
      .returning()
      .execute();

    return { user, staff: staffResult[0] };
  };

  it('should update all staff fields when provided', async () => {
    const { staff } = await createTestUserAndStaff();

    const updateInput: UpdateStaffInput = {
      id: staff.id,
      name: 'Updated Name',
      email: 'updated@example.com',
      phone_number: '987-654-3210',
      position: 'Updated Position'
    };

    const result = await updateStaff(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(staff.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone_number).toEqual('987-654-3210');
    expect(result.position).toEqual('Updated Position');
    expect(result.user_id).toEqual(staff.user_id);
    expect(result.created_at).toEqual(staff.created_at);
    expect(result.updated_at).not.toEqual(staff.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields (partial update)', async () => {
    const { staff } = await createTestUserAndStaff();

    const updateInput: UpdateStaffInput = {
      id: staff.id,
      name: 'Only Name Updated',
      position: 'Only Position Updated'
    };

    const result = await updateStaff(updateInput);

    // Verify only specified fields were updated
    expect(result.name).toEqual('Only Name Updated');
    expect(result.position).toEqual('Only Position Updated');
    // These should remain unchanged
    expect(result.email).toEqual(staff.email);
    expect(result.phone_number).toEqual(staff.phone_number);
    expect(result.user_id).toEqual(staff.user_id);
    expect(result.updated_at).not.toEqual(staff.updated_at);
  });

  it('should handle phone_number set to null', async () => {
    const { staff } = await createTestUserAndStaff();

    const updateInput: UpdateStaffInput = {
      id: staff.id,
      phone_number: null
    };

    const result = await updateStaff(updateInput);

    expect(result.phone_number).toBeNull();
    expect(result.updated_at).not.toEqual(staff.updated_at);
    // Other fields should remain unchanged
    expect(result.name).toEqual(staff.name);
    expect(result.email).toEqual(staff.email);
    expect(result.position).toEqual(staff.position);
  });

  it('should update staff record in database', async () => {
    const { staff } = await createTestUserAndStaff();

    const updateInput: UpdateStaffInput = {
      id: staff.id,
      name: 'Database Updated Name',
      email: 'database@example.com'
    };

    await updateStaff(updateInput);

    // Verify changes were persisted in database
    const updatedStaff = await db.select()
      .from(staffTable)
      .where(eq(staffTable.id, staff.id))
      .execute();

    expect(updatedStaff).toHaveLength(1);
    expect(updatedStaff[0].name).toEqual('Database Updated Name');
    expect(updatedStaff[0].email).toEqual('database@example.com');
    expect(updatedStaff[0].position).toEqual(staff.position); // Unchanged
    expect(updatedStaff[0].updated_at).not.toEqual(staff.updated_at);
  });

  it('should throw error when staff member does not exist', async () => {
    const updateInput: UpdateStaffInput = {
      id: 999, // Non-existent ID
      name: 'Should Fail'
    };

    await expect(updateStaff(updateInput)).rejects.toThrow(/Staff member with id 999 not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    const { staff } = await createTestUserAndStaff();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateStaffInput = {
      id: staff.id,
      name: 'Timestamp Test'
    };

    const result = await updateStaff(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(staff.updated_at.getTime());
  });

  it('should handle updating with same values', async () => {
    const { staff } = await createTestUserAndStaff();

    const updateInput: UpdateStaffInput = {
      id: staff.id,
      name: staff.name, // Same value
      email: staff.email, // Same value
      phone_number: staff.phone_number, // Same value
      position: staff.position // Same value
    };

    const result = await updateStaff(updateInput);

    // Values should be the same but updated_at should change
    expect(result.name).toEqual(staff.name);
    expect(result.email).toEqual(staff.email);
    expect(result.phone_number).toEqual(staff.phone_number);
    expect(result.position).toEqual(staff.position);
    expect(result.updated_at).not.toEqual(staff.updated_at);
  });
});