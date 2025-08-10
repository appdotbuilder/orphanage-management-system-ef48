import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

// Helper function to verify password hash
const verifyPassword = (password: string, hash: string): boolean => {
  const [salt, storedHash] = hash.split(':');
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return storedHash === hashedPassword;
};

// Test inputs for different scenarios
const adminUserInput: CreateUserInput = {
  email: 'admin@test.com',
  password: 'securepassword123',
  role: 'admin'
};

const staffUserInput: CreateUserInput = {
  email: 'staff@test.com',
  password: 'staffpassword456',
  role: 'staff'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an admin user', async () => {
    const result = await createUser(adminUserInput);

    // Basic field validation
    expect(result.email).toEqual('admin@test.com');
    expect(result.role).toEqual('admin');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('securepassword123'); // Should be hashed
    expect(result.password_hash).toContain(':'); // Should contain salt separator
  });

  it('should create a staff user', async () => {
    const result = await createUser(staffUserInput);

    // Basic field validation
    expect(result.email).toEqual('staff@test.com');
    expect(result.role).toEqual('staff');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('staffpassword456'); // Should be hashed
    expect(result.password_hash).toContain(':'); // Should contain salt separator
  });

  it('should save user to database', async () => {
    const result = await createUser(adminUserInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('admin@test.com');
    expect(users[0].role).toEqual('admin');
    expect(users[0].password_hash).toBeDefined();
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await createUser(adminUserInput);

    // Verify password is hashed correctly using our helper
    const isValidHash = verifyPassword('securepassword123', result.password_hash);
    expect(isValidHash).toBe(true);

    // Verify wrong password doesn't match
    const isInvalidHash = verifyPassword('wrongpassword', result.password_hash);
    expect(isInvalidHash).toBe(false);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(adminUserInput);

    // Try to create another user with same email
    const duplicateEmailInput: CreateUserInput = {
      email: 'admin@test.com', // Same email
      password: 'differentpassword',
      role: 'staff'
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/unique|duplicate/i);
  });

  it('should create multiple users with different emails', async () => {
    // Create admin user
    const adminResult = await createUser(adminUserInput);

    // Create staff user
    const staffResult = await createUser(staffUserInput);

    // Both should be created successfully
    expect(adminResult.id).toBeDefined();
    expect(staffResult.id).toBeDefined();
    expect(adminResult.id).not.toEqual(staffResult.id);
    expect(adminResult.email).toEqual('admin@test.com');
    expect(staffResult.email).toEqual('staff@test.com');

    // Verify both exist in database
    const allUsers = await db.select()
      .from(usersTable)
      .execute();

    expect(allUsers).toHaveLength(2);
  });

  it('should handle password hashing for different passwords', async () => {
    const user1 = await createUser(adminUserInput);
    const user2 = await createUser(staffUserInput);

    // Different passwords should produce different hashes
    expect(user1.password_hash).not.toEqual(user2.password_hash);

    // Each hash should validate against its original password
    const user1Valid = verifyPassword('securepassword123', user1.password_hash);
    const user2Valid = verifyPassword('staffpassword456', user2.password_hash);

    expect(user1Valid).toBe(true);
    expect(user2Valid).toBe(true);

    // Cross-validation should fail
    const user1Invalid = verifyPassword('staffpassword456', user1.password_hash);
    const user2Invalid = verifyPassword('securepassword123', user2.password_hash);

    expect(user1Invalid).toBe(false);
    expect(user2Invalid).toBe(false);
  });

  it('should generate unique salts for same passwords', async () => {
    // Create two users with the same password
    const user1Input: CreateUserInput = {
      email: 'user1@test.com',
      password: 'samepassword',
      role: 'admin'
    };

    const user2Input: CreateUserInput = {
      email: 'user2@test.com',
      password: 'samepassword',
      role: 'staff'
    };

    const user1 = await createUser(user1Input);
    const user2 = await createUser(user2Input);

    // Even with same password, hashes should be different due to unique salts
    expect(user1.password_hash).not.toEqual(user2.password_hash);

    // But both should validate correctly
    expect(verifyPassword('samepassword', user1.password_hash)).toBe(true);
    expect(verifyPassword('samepassword', user2.password_hash)).toBe(true);
  });
});