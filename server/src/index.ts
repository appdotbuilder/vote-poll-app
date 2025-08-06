
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createPollInputSchema, 
  updatePollInputSchema, 
  addPollOptionInputSchema,
  voteInputSchema,
  adminLoginInputSchema
} from './schema';

// Import handlers
import { createPoll } from './handlers/create_poll';
import { getPolls } from './handlers/get_polls';
import { getPollById } from './handlers/get_poll_by_id';
import { updatePoll } from './handlers/update_poll';
import { deletePoll } from './handlers/delete_poll';
import { addPollOption } from './handlers/add_poll_option';
import { vote } from './handlers/vote';
import { checkVoteEligibility } from './handlers/check_vote_eligibility';
import { getVoteSummary } from './handlers/get_vote_summary';
import { adminLogin } from './handlers/admin_login';
import { getAdminPolls } from './handlers/get_admin_polls';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Public endpoints for frontend
  getPolls: publicProcedure
    .query(() => getPolls()),

  getPollById: publicProcedure
    .input(z.number())
    .query(({ input }) => getPollById(input)),

  vote: publicProcedure
    .input(voteInputSchema)
    .mutation(({ input }) => vote(input)),

  checkVoteEligibility: publicProcedure
    .input(z.object({ pollId: z.number(), ipAddress: z.string() }))
    .query(({ input }) => checkVoteEligibility(input.pollId, input.ipAddress)),

  getVoteSummary: publicProcedure
    .input(z.number())
    .query(({ input }) => getVoteSummary(input)),

  // Admin endpoints
  adminLogin: publicProcedure
    .input(adminLoginInputSchema)
    .mutation(({ input }) => adminLogin(input)),

  getAdminPolls: publicProcedure
    .query(() => getAdminPolls()),

  createPoll: publicProcedure
    .input(createPollInputSchema)
    .mutation(({ input }) => createPoll(input)),

  updatePoll: publicProcedure
    .input(updatePollInputSchema)
    .mutation(({ input }) => updatePoll(input)),

  deletePoll: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deletePoll(input)),

  addPollOption: publicProcedure
    .input(addPollOptionInputSchema)
    .mutation(({ input }) => addPollOption(input)),
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
