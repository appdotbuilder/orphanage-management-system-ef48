import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type UpdateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  const hashedPassword = await Bun.password.hash(userData.password);
  
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

const testUserData: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  role: 'staff'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user email', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);
    
    // Update email
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'updated@example.com'
    };
    
    const result = await updateUser(updateInput);
    
    // Verify updated fields
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.role).toEqual('staff'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update user role', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);
    
    // Update role
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      role: 'admin'
    };
    
    const result = await updateUser(updateInput);
    
    // Verify updated fields
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('test@example.com'); // Should remain unchanged
    expect(result.role).toEqual('admin');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });

  it('should update user password and hash it', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);
    const originalPasswordHash = createdUser.password_hash;
    
    // Update password
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      password: 'newpassword456'
    };
    
    const result = await updateUser(updateInput);
    
    // Verify password was hashed and changed
    expect(result.password_hash).not.toEqual(originalPasswordHash);
    expect(result.password_hash).not.toEqual('newpassword456'); // Should be hashed
    expect(result.password_hash.length).toBeGreaterThan(20); // Hash should be long
    
    // Verify password hash is valid using Bun's password verification
    const isValidPassword = await Bun.password.verify('newpassword456', result.password_hash);
    expect(isValidPassword).toBe(true);
    
    // Verify old password no longer works
    const isOldPasswordValid = await Bun.password.verify('password123', result.password_hash);
    expect(isOldPasswordValid).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);
    
    // Update multiple fields
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'multi@example.com',
      password: 'multiupdate789',
      role: 'admin'
    };
    
    const result = await updateUser(updateInput);
    
    // Verify all updated fields
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual('multi@example.com');
    expect(result.role).toEqual('admin');
    expect(result.password_hash).not.toEqual(createdUser.password_hash);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
    
    // Verify new password works
    const isValidPassword = await Bun.password.verify('multiupdate789', result.password_hash);
    expect(isValidPassword).toBe(true);
  });

  it('should update user in database', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);
    
    // Update user
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'dbupdate@example.com',
      role: 'admin'
    };
    
    await updateUser(updateInput);
    
    // Query database to verify update
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();
    
    expect(updatedUsers).toHaveLength(1);
    expect(updatedUsers[0].email).toEqual('dbupdate@example.com');
    expect(updatedUsers[0].role).toEqual('admin');
    expect(updatedUsers[0].updated_at).toBeInstanceOf(Date);
    expect(updatedUsers[0].updated_at > createdUser.updated_at).toBe(true);
  });

  it('should throw error when user not found', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999, // Non-existent ID
      email: 'notfound@example.com'
    };
    
    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/);
  });

  it('should preserve unchanged fields', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);
    
    // Update only email
    const updateInput: UpdateUserInput = {
      id: createdUser.id,
      email: 'preserve@example.com'
    };
    
    const result = await updateUser(updateInput);
    
    // Verify unchanged fields are preserved
    expect(result.email).toEqual('preserve@example.com'); // Changed
    expect(result.role).toEqual(createdUser.role); // Preserved
    expect(result.password_hash).toEqual(createdUser.password_hash); // Preserved
    expect(result.created_at).toEqual(createdUser.created_at); // Preserved
  });

  it('should handle empty update gracefully', async () => {
    // Create test user
    const createdUser = await createTestUser(testUserData);
    
    // Update with no optional fields (only id provided)
    const updateInput: UpdateUserInput = {
      id: createdUser.id
    };
    
    const result = await updateUser(updateInput);
    
    // Verify only updated_at changed
    expect(result.id).toEqual(createdUser.id);
    expect(result.email).toEqual(createdUser.email);
    expect(result.role).toEqual(createdUser.role);
    expect(result.password_hash).toEqual(createdUser.password_hash);
    expect(result.created_at).toEqual(createdUser.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdUser.updated_at).toBe(true);
  });
});