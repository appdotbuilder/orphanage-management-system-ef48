import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, staffTable } from '../db/schema';
import { getStaff } from '../handlers/get_staff';

describe('getStaff', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no staff exists', async () => {
    const result = await getStaff();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all staff members with their information', async () => {
    // Create test users first
    const passwordHash = 'hashed_password_123';
    
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'staff1@example.com',
          password_hash: passwordHash,
          role: 'staff'
        },
        {
          email: 'staff2@example.com',
          password_hash: passwordHash,
          role: 'staff'
        }
      ])
      .returning()
      .execute();

    // Create staff records
    const staff = await db.insert(staffTable)
      .values([
        {
          user_id: users[0].id,
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone_number: '1234567890',
          position: 'Manager'
        },
        {
          user_id: users[1].id,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone_number: null,
          position: 'Assistant'
        }
      ])
      .returning()
      .execute();

    const result = await getStaff();

    expect(result).toHaveLength(2);
    
    // Verify first staff member
    const firstStaff = result.find(s => s.name === 'John Doe');
    expect(firstStaff).toBeDefined();
    expect(firstStaff!.id).toBe(staff[0].id);
    expect(firstStaff!.user_id).toBe(users[0].id);
    expect(firstStaff!.name).toBe('John Doe');
    expect(firstStaff!.email).toBe('john.doe@example.com');
    expect(firstStaff!.phone_number).toBe('1234567890');
    expect(firstStaff!.position).toBe('Manager');
    expect(firstStaff!.created_at).toBeInstanceOf(Date);
    expect(firstStaff!.updated_at).toBeInstanceOf(Date);

    // Verify second staff member
    const secondStaff = result.find(s => s.name === 'Jane Smith');
    expect(secondStaff).toBeDefined();
    expect(secondStaff!.id).toBe(staff[1].id);
    expect(secondStaff!.user_id).toBe(users[1].id);
    expect(secondStaff!.name).toBe('Jane Smith');
    expect(secondStaff!.email).toBe('jane.smith@example.com');
    expect(secondStaff!.phone_number).toBe(null);
    expect(secondStaff!.position).toBe('Assistant');
    expect(secondStaff!.created_at).toBeInstanceOf(Date);
    expect(secondStaff!.updated_at).toBeInstanceOf(Date);
  });

  it('should only return staff with valid user references', async () => {
    // Create a user and staff record
    const passwordHash = 'hashed_password_123';
    
    const user = await db.insert(usersTable)
      .values({
        email: 'staff@example.com',
        password_hash: passwordHash,
        role: 'staff'
      })
      .returning()
      .execute();

    await db.insert(staffTable)
      .values({
        user_id: user[0].id,
        name: 'Valid Staff',
        email: 'valid@example.com',
        phone_number: '1234567890',
        position: 'Employee'
      })
      .execute();

    const result = await getStaff();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Valid Staff');
    expect(result[0].user_id).toBe(user[0].id);
  });

  it('should return staff ordered by creation date', async () => {
    // Create test users
    const passwordHash = 'hashed_password_123';
    
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'first@example.com',
          password_hash: passwordHash,
          role: 'staff'
        },
        {
          email: 'second@example.com',
          password_hash: passwordHash,
          role: 'staff'
        }
      ])
      .returning()
      .execute();

    // Create staff records with slight delay to ensure different timestamps
    await db.insert(staffTable)
      .values({
        user_id: users[0].id,
        name: 'First Staff',
        email: 'first.staff@example.com',
        phone_number: '1111111111',
        position: 'First Position'
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(staffTable)
      .values({
        user_id: users[1].id,
        name: 'Second Staff',
        email: 'second.staff@example.com',
        phone_number: '2222222222',
        position: 'Second Position'
      })
      .execute();

    const result = await getStaff();

    expect(result).toHaveLength(2);
    // Results should maintain creation order since we're using natural ordering
    expect(result[0].name).toBe('First Staff');
    expect(result[1].name).toBe('Second Staff');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle staff with all nullable fields as null', async () => {
    // Create test user
    const passwordHash = 'hashed_password_123';
    
    const user = await db.insert(usersTable)
      .values({
        email: 'minimal@example.com',
        password_hash: passwordHash,
        role: 'staff'
      })
      .returning()
      .execute();

    // Create staff with minimal required fields
    await db.insert(staffTable)
      .values({
        user_id: user[0].id,
        name: 'Minimal Staff',
        email: 'minimal.staff@example.com',
        phone_number: null, // Explicitly set nullable field
        position: 'Basic Position'
      })
      .execute();

    const result = await getStaff();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Minimal Staff');
    expect(result[0].phone_number).toBe(null);
    expect(result[0].position).toBe('Basic Position');
  });
});