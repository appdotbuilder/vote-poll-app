
import { serial, text, pgTable, timestamp, boolean, integer, varchar, numeric, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const pollsTable = pgTable('polls', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  cover_photo_url: text('cover_photo_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  total_votes: integer('total_votes').default(0).notNull(),
  popularity_score: numeric('popularity_score', { precision: 10, scale: 2 }).default('0').notNull()
}, (table) => ({
  popularityIndex: index('polls_popularity_idx').on(table.popularity_score),
  createdAtIndex: index('polls_created_at_idx').on(table.created_at),
  activeIndex: index('polls_active_idx').on(table.is_active)
}));

export const pollOptionsTable = pgTable('poll_options', {
  id: serial('id').primaryKey(),
  poll_id: integer('poll_id').notNull().references(() => pollsTable.id, { onDelete: 'cascade' }),
  option_text: text('option_text').notNull(),
  thumbnail_url: text('thumbnail_url'),
  vote_count: integer('vote_count').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  pollIdIndex: index('poll_options_poll_id_idx').on(table.poll_id)
}));

export const votesTable = pgTable('votes', {
  id: serial('id').primaryKey(),
  poll_id: integer('poll_id').notNull().references(() => pollsTable.id, { onDelete: 'cascade' }),
  poll_option_id: integer('poll_option_id').notNull().references(() => pollOptionsTable.id, { onDelete: 'cascade' }),
  ip_address: varchar('ip_address', { length: 45 }).notNull(), // Support IPv6
  voted_at: timestamp('voted_at').defaultNow().notNull()
}, (table) => ({
  uniqueVotePerPoll: unique('unique_vote_per_poll').on(table.poll_id, table.ip_address),
  pollIdIndex: index('votes_poll_id_idx').on(table.poll_id),
  ipAddressIndex: index('votes_ip_address_idx').on(table.ip_address)
}));

export const adminUsersTable = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const pollsRelations = relations(pollsTable, ({ many }) => ({
  options: many(pollOptionsTable),
  votes: many(votesTable)
}));

export const pollOptionsRelations = relations(pollOptionsTable, ({ one, many }) => ({
  poll: one(pollsTable, {
    fields: [pollOptionsTable.poll_id],
    references: [pollsTable.id]
  }),
  votes: many(votesTable)
}));

export const votesRelations = relations(votesTable, ({ one }) => ({
  poll: one(pollsTable, {
    fields: [votesTable.poll_id],
    references: [pollsTable.id]
  }),
  option: one(pollOptionsTable, {
    fields: [votesTable.poll_option_id],
    references: [pollOptionsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Poll = typeof pollsTable.$inferSelect;
export type NewPoll = typeof pollsTable.$inferInsert;
export type PollOption = typeof pollOptionsTable.$inferSelect;
export type NewPollOption = typeof pollOptionsTable.$inferInsert;
export type Vote = typeof votesTable.$inferSelect;
export type NewVote = typeof votesTable.$inferInsert;
export type AdminUser = typeof adminUsersTable.$inferSelect;
export type NewAdminUser = typeof adminUsersTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  polls: pollsTable,
  pollOptions: pollOptionsTable,
  votes: votesTable,
  adminUsers: adminUsersTable
};
