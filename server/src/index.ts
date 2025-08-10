import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  loginInputSchema, 
  updateUserInputSchema,
  resetPasswordInputSchema,
  deleteUserInputSchema,
  createStaffInputSchema,
  updateStaffInputSchema,
  deleteStaffInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { resetPassword } from './handlers/reset_password';
import { createStaff } from './handlers/create_staff';
import { getStaff } from './handlers/get_staff';
import { getStaffById } from './handlers/get_staff_by_id';
import { updateStaff } from './handlers/update_staff';
import { deleteStaff } from './handlers/delete_staff';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User Authentication & Management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  deleteUser: publicProcedure
    .input(deleteUserInputSchema)
    .mutation(({ input }) => deleteUser(input)),

  resetPassword: publicProcedure
    .input(resetPasswordInputSchema)
    .mutation(({ input }) => resetPassword(input)),

  // Staff Management
  createStaff: publicProcedure
    .input(createStaffInputSchema)
    .mutation(({ input }) => createStaff(input)),

  getStaff: publicProcedure
    .query(() => getStaff()),

  getStaffById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getStaffById(input.id)),

  updateStaff: publicProcedure
    .input(updateStaffInputSchema)
    .mutation(({ input }) => updateStaff(input)),

  deleteStaff: publicProcedure
    .input(deleteStaffInputSchema)
    .mutation(({ input }) => deleteStaff(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();