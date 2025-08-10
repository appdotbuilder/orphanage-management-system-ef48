import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import crypto from 'crypto';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type ResetPasswordInput } from '../schema';
import { resetPassword } from '../handlers/reset_password';
import { eq } from 'drizzle-orm';

// Helper function to hash password (matching handler implementation)
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Helper function to verify password against hash
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Test input for password reset
const testResetInput: ResetPasswordInput = {
  id: 1,
  new_password: 'newpassword123'
};

// Helper to create a test user with unique email
const createTestUser = async (emailSuffix: string = ''): Promise<number> => {
  const hashedPassword = hashPassword('oldpassword123');
  const email = emailSuffix ? `test${emailSuffix}@example.com` : `test${Date.now()}@example.com`;
  
  const result = await db.insert(usersTable)
    .values({
      email,
      password_hash: hashedPassword,
      role: 'staff'
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('resetPassword', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should reset user password successfully', async () => {
    // Create test user first
    const userId = await createTestUser();
    const resetInput = { ...testResetInput, id: userId };

    // Reset password
    const result = await resetPassword(resetInput);

    // Validate response
    expect(result.id).toEqual(userId);
    expect(result.email).toContain('@example.com');
    expect(result.role).toEqual('staff');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.password_hash).toBe('string');
    expect(result.password_hash).not.toEqual('oldpassword123'); // Should be hashed
  });

  it('should hash the new password correctly', async () => {
    // Create test user
    const userId = await createTestUser();
    const resetInput = { ...testResetInput, id: userId };

    // Reset password
    const result = await resetPassword(resetInput);

    // Verify password is properly hashed
    const isValidHash = verifyPassword('newpassword123', result.password_hash);
    expect(isValidHash).toBe(true);

    // Verify old password no longer works
    const isOldPasswordValid = verifyPassword('oldpassword123', result.password_hash);
    expect(isOldPasswordValid).toBe(false);
  });

  it('should update password in database', async () => {
    // Create test user
    const userId = await createTestUser();
    const resetInput = { ...testResetInput, id: userId };

    // Get original user data
    const originalUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    const originalUser = originalUsers[0];

    // Reset password
    await resetPassword(resetInput);

    // Query updated user from database
    const updatedUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(updatedUsers).toHaveLength(1);
    const updatedUser = updatedUsers[0];

    // Verify password was changed
    expect(updatedUser.password_hash).not.toEqual(originalUser.password_hash);

    // Verify new password works
    const isNewPasswordValid = verifyPassword('newpassword123', updatedUser.password_hash);
    expect(isNewPasswordValid).toBe(true);

    // Verify updated_at timestamp was changed
    expect(updatedUser.updated_at.getTime()).toBeGreaterThan(originalUser.updated_at.getTime());
  });

  it('should update the updated_at timestamp', async () => {
    // Create test user
    const userId = await createTestUser();
    const resetInput = { ...testResetInput, id: userId };

    // Get current time before reset
    const beforeReset = new Date();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Reset password
    const result = await resetPassword(resetInput);

    // Verify updated_at is recent
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeReset.getTime());
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const nonExistentInput = { ...testResetInput, id: 999 };

    await expect(resetPassword(nonExistentInput)).rejects.toThrow(/user not found/i);
  });

  it('should handle password hashing properly', async () => {
    // Create test user
    const userId = await createTestUser();
    const resetInput = { ...testResetInput, id: userId };

    // Reset password
    const result = await resetPassword(resetInput);

    // Verify hash format (should contain salt:hash format)
    expect(result.password_hash).toContain(':');
    const [salt, hash] = result.password_hash.split(':');
    expect(salt.length).toBe(32); // 16 bytes = 32 hex chars
    expect(hash.length).toBe(128); // 64 bytes = 128 hex chars

    // Verify it's a valid hash by comparing
    const isValid = verifyPassword('newpassword123', result.password_hash);
    expect(isValid).toBe(true);
  });

  it('should preserve other user fields unchanged', async () => {
    // Create test user
    const userId = await createTestUser();
    const resetInput = { ...testResetInput, id: userId };

    // Get original user data
    const originalUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    const originalUser = originalUsers[0];

    // Reset password
    const result = await resetPassword(resetInput);

    // Verify other fields remain unchanged
    expect(result.id).toEqual(originalUser.id);
    expect(result.email).toEqual(originalUser.email);
    expect(result.role).toEqual(originalUser.role);
    expect(result.created_at).toEqual(originalUser.created_at);

    // Only password_hash and updated_at should change
    expect(result.password_hash).not.toEqual(originalUser.password_hash);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUser.updated_at.getTime());
  });

  it('should generate unique hashes for same password', async () => {
    // Create two test users with unique emails
    const userId1 = await createTestUser('1');
    const userId2 = await createTestUser('2');

    const resetInput1 = { id: userId1, new_password: 'samepassword' };
    const resetInput2 = { id: userId2, new_password: 'samepassword' };

    // Reset both passwords to the same value
    const result1 = await resetPassword(resetInput1);
    const result2 = await resetPassword(resetInput2);

    // Hashes should be different due to salt
    expect(result1.password_hash).not.toEqual(result2.password_hash);

    // But both should verify correctly
    expect(verifyPassword('samepassword', result1.password_hash)).toBe(true);
    expect(verifyPassword('samepassword', result2.password_hash)).toBe(true);
  });
});