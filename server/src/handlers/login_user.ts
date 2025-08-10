import { db } from '../db';
import { usersTable, staffTable } from '../db/schema';
import { type LoginInput, type LoginResponse } from '../schema';
import { eq } from 'drizzle-orm';
import { createHash, timingSafeEqual } from 'crypto';

// Simple password verification using crypto (since bcrypt is not available)
const verifyPassword = (password: string, hash: string): boolean => {
  try {
    // Create hash of provided password
    const hashedInput = createHash('sha256').update(password).digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    const hashBuffer = Buffer.from(hash, 'hex');
    const inputBuffer = Buffer.from(hashedInput, 'hex');
    
    if (hashBuffer.length !== inputBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(hashBuffer, inputBuffer);
  } catch {
    return false;
  }
};

export const loginUser = async (input: LoginInput): Promise<LoginResponse> => {
  try {
    // Find user by email with optional staff data using left join
    const results = await db.select()
      .from(usersTable)
      .leftJoin(staffTable, eq(usersTable.id, staffTable.user_id))
      .where(eq(usersTable.email, input.email))
      .execute();

    if (results.length === 0) {
      throw new Error('Invalid email or password');
    }

    const result = results[0];
    const user = result.users;
    const staff = result.staff;

    // Verify password
    const isValidPassword = verifyPassword(input.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Return user data with associated staff info (if exists)
    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      staff: staff ? {
        id: staff.id,
        user_id: staff.user_id,
        name: staff.name,
        email: staff.email,
        phone_number: staff.phone_number,
        position: staff.position,
        created_at: staff.created_at,
        updated_at: staff.updated_at
      } : null
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};