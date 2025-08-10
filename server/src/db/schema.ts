import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define user role enum
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff']);

// Users table for authentication
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Staff table for staff management (pengurus)
export const staffTable = pgTable('staff', {
  id: serial('id').primaryKey(),
  user_id: serial('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone_number: text('phone_number'), // Nullable by default
  position: text('position').notNull(), // jabatan
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ one }) => ({
  staff: one(staffTable, {
    fields: [usersTable.id],
    references: [staffTable.user_id],
  }),
}));

export const staffRelations = relations(staffTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [staffTable.user_id],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Staff = typeof staffTable.$inferSelect;
export type NewStaff = typeof staffTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  staff: staffTable 
};

export const tableRelations = {
  usersRelations,
  staffRelations
};