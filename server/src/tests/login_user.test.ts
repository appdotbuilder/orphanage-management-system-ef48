import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { createHash } from 'crypto';

// Helper function to create password hash (matching the handler's approach)
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials (admin without staff)', async () => {
    // Create test user (admin)
    const passwordHash = hashPassword('testpass123');
    const userResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: passwordHash,
        role: 'admin'
      })
      .returning()
      .execute();

    const loginInput: LoginInput = {
      email: 'admin@example.com',
      password: 'testpass123'
    };

    const result = await loginUser(loginInput);

    // Verify user data
    expect(result.user.id).toEqual(userResult[0].id);
    expect(result.user.email).toEqual('admin@example.com');
    expect(result.user.role).toEqual('admin');
    expect(result.user.password_hash).toEqual(passwordHash);
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Admin user should not have staff record
    expect(result.staff).toBeNull();
  });

  it('should authenticate staff user with associated staff data', async () => {
    // Create test user (staff)
    const passwordHash = hashPassword('staffpass123');
    const userResult = await db.insert(usersTable)
      .values({
        email: 'staff@example.com',
        password_hash: passwordHash,
        role: 'staff'
      })
      .returning()
      .execute();

    // Create associated staff record
    const staffResult = await db.insert(staffTable)
      .values({
        user_id: userResult[0].id,
        name: 'John Staff',
        email: 'staff@example.com',
        phone_number: '123-456-7890',
        position: 'Manager'
      })
      .returning()
      .execute();

    const loginInput: LoginInput = {
      email: 'staff@example.com',
      password: 'staffpass123'
    };

    const result = await loginUser(loginInput);

    // Verify user data
    expect(result.user.id).toEqual(userResult[0].id);
    expect(result.user.email).toEqual('staff@example.com');
    expect(result.user.role).toEqual('staff');
    expect(result.user.password_hash).toEqual(passwordHash);

    // Verify staff data
    expect(result.staff).not.toBeNull();
    expect(result.staff!.id).toEqual(staffResult[0].id);
    expect(result.staff!.user_id).toEqual(userResult[0].id);
    expect(result.staff!.name).toEqual('John Staff');
    expect(result.staff!.email).toEqual('staff@example.com');
    expect(result.staff!.phone_number).toEqual('123-456-7890');
    expect(result.staff!.position).toEqual('Manager');
    expect(result.staff!.created_at).toBeInstanceOf(Date);
    expect(result.staff!.updated_at).toBeInstanceOf(Date);
  });

  it('should authenticate staff user without phone number', async () => {
    // Create test user (staff)
    const passwordHash = hashPassword('staffpass456');
    const userResult = await db.insert(usersTable)
      .values({
        email: 'staff2@example.com',
        password_hash: passwordHash,
        role: 'staff'
      })
      .returning()
      .execute();

    // Create associated staff record without phone number
    await db.insert(staffTable)
      .values({
        user_id: userResult[0].id,
        name: 'Jane Staff',
        email: 'staff2@example.com',
        phone_number: null, // No phone number
        position: 'Assistant'
      })
      .returning()
      .execute();

    const loginInput: LoginInput = {
      email: 'staff2@example.com',
      password: 'staffpass456'
    };

    const result = await loginUser(loginInput);

    // Verify staff data with null phone_number
    expect(result.staff).not.toBeNull();
    expect(result.staff!.name).toEqual('Jane Staff');
    expect(result.staff!.phone_number).toBeNull();
    expect(result.staff!.position).toEqual('Assistant');
  });

  it('should throw error for non-existent email', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    await expect(loginUser(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for wrong password', async () => {
    // Create test user
    const passwordHash = hashPassword('correctpass');
    await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: passwordHash,
        role: 'admin'
      })
      .returning()
      .execute();

    const loginInput: LoginInput = {
      email: 'user@example.com',
      password: 'wrongpassword'
    };

    await expect(loginUser(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle staff user without staff record gracefully', async () => {
    // Create staff user but no corresponding staff record
    const passwordHash = hashPassword('staffpass789');
    const userResult = await db.insert(usersTable)
      .values({
        email: 'staffuser@example.com',
        password_hash: passwordHash,
        role: 'staff'
      })
      .returning()
      .execute();

    const loginInput: LoginInput = {
      email: 'staffuser@example.com',
      password: 'staffpass789'
    };

    const result = await loginUser(loginInput);

    // Should authenticate successfully but with null staff
    expect(result.user.id).toEqual(userResult[0].id);
    expect(result.user.email).toEqual('staffuser@example.com');
    expect(result.user.role).toEqual('staff');
    expect(result.staff).toBeNull();
  });

  it('should be case sensitive for email authentication', async () => {
    // Create test user with lowercase email
    const passwordHash = hashPassword('testpass');
    await db.insert(usersTable)
      .values({
        email: 'user@example.com',
        password_hash: passwordHash,
        role: 'admin'
      })
      .returning()
      .execute();

    // Try login with uppercase email
    const loginInput: LoginInput = {
      email: 'USER@EXAMPLE.COM',
      password: 'testpass'
    };

    await expect(loginUser(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle malformed password hash gracefully', async () => {
    // Create test user with invalid hash
    await db.insert(usersTable)
      .values({
        email: 'baduser@example.com',
        password_hash: 'invalid-hash-format',
        role: 'admin'
      })
      .returning()
      .execute();

    const loginInput: LoginInput = {
      email: 'baduser@example.com',
      password: 'anypassword'
    };

    await expect(loginUser(loginInput)).rejects.toThrow(/invalid email or password/i);
  });
});