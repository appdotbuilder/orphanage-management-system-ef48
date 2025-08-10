import { z } from 'zod';

// User role enum
export const userRoleSchema = z.enum(['admin', 'staff']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema for authentication
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  role: userRoleSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for user registration/creation
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for user login
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schema for updating user
export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: userRoleSchema.optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

// Input schema for password reset
export const resetPasswordInputSchema = z.object({
  id: z.number(),
  new_password: z.string().min(6)
});

export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;

// Staff schema
export const staffSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone_number: z.string().nullable(),
  position: z.string(), // jabatan
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Staff = z.infer<typeof staffSchema>;

// Input schema for creating staff
export const createStaffInputSchema = z.object({
  user_id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone_number: z.string().nullable(),
  position: z.string()
});

export type CreateStaffInput = z.infer<typeof createStaffInputSchema>;

// Input schema for updating staff
export const updateStaffInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone_number: z.string().nullable().optional(),
  position: z.string().optional()
});

export type UpdateStaffInput = z.infer<typeof updateStaffInputSchema>;

// Input schema for deleting user
export const deleteUserInputSchema = z.object({
  id: z.number()
});

export type DeleteUserInput = z.infer<typeof deleteUserInputSchema>;

// Input schema for deleting staff
export const deleteStaffInputSchema = z.object({
  id: z.number()
});

export type DeleteStaffInput = z.infer<typeof deleteStaffInputSchema>;

// Login response schema
export const loginResponseSchema = z.object({
  user: userSchema,
  staff: staffSchema.nullable()
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;