import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';
import { eq } from 'drizzle-orm';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should return all users without password_hash', async () => {
    // Create test users
    const testUsers = [
      {
        email: 'admin@test.com',
        password_hash: 'hashed_password_1',
        role: 'admin' as const
      },
      {
        email: 'staff@test.com',
        password_hash: 'hashed_password_2',
        role: 'staff' as const
      }
    ];

    // Insert users directly into database
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    // Should return 2 users
    expect(result).toHaveLength(2);

    // Check that password_hash is not included
    result.forEach(user => {
      expect(user).not.toHaveProperty('password_hash');
      expect(user.id).toBeDefined();
      expect(user.email).toBeDefined();
      expect(user.role).toBeDefined();
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific user data
    const adminUser = result.find(u => u.email === 'admin@test.com');
    const staffUser = result.find(u => u.email === 'staff@test.com');

    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe('admin');
    expect(staffUser).toBeDefined();
    expect(staffUser?.role).toBe('staff');
  });

  it('should return users in consistent order', async () => {
    // Create multiple users
    const testUsers = [
      {
        email: 'user1@test.com',
        password_hash: 'hash1',
        role: 'admin' as const
      },
      {
        email: 'user2@test.com',
        password_hash: 'hash2',
        role: 'staff' as const
      },
      {
        email: 'user3@test.com',
        password_hash: 'hash3',
        role: 'admin' as const
      }
    ];

    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify all required fields are present
    result.forEach(user => {
      expect(typeof user.id).toBe('number');
      expect(typeof user.email).toBe('string');
      expect(['admin', 'staff']).toContain(user.role);
      expect(user.created_at).toBeInstanceOf(Date);
      expect(user.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should verify data integrity with database', async () => {
    // Create a test user
    const testUser = {
      email: 'test@example.com',
      password_hash: 'secure_hash',
      role: 'staff' as const
    };

    const [insertedUser] = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const result = await getUsers();
    
    expect(result).toHaveLength(1);
    
    const returnedUser = result[0];
    expect(returnedUser.id).toBe(insertedUser.id);
    expect(returnedUser.email).toBe(testUser.email);
    expect(returnedUser.role).toBe(testUser.role);
    
    // Verify password_hash is not returned but exists in database
    const dbUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, insertedUser.id))
      .execute();
    
    expect(dbUser[0].password_hash).toBe(testUser.password_hash);
    expect(returnedUser).not.toHaveProperty('password_hash');
  });

  it('should handle users with different roles correctly', async () => {
    // Create users with all possible roles
    const adminUser = {
      email: 'admin@test.com',
      password_hash: 'admin_hash',
      role: 'admin' as const
    };
    
    const staffUser = {
      email: 'staff@test.com',
      password_hash: 'staff_hash',
      role: 'staff' as const
    };

    await db.insert(usersTable)
      .values([adminUser, staffUser])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    const roles = result.map(u => u.role).sort();
    expect(roles).toEqual(['admin', 'staff']);
    
    // Verify each user has correct role
    const admin = result.find(u => u.email === 'admin@test.com');
    const staff = result.find(u => u.email === 'staff@test.com');
    
    expect(admin?.role).toBe('admin');
    expect(staff?.role).toBe('staff');
  });
});