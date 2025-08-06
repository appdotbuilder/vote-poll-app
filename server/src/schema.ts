
import { z } from 'zod';

// Poll schema
export const pollSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  cover_photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  is_active: z.boolean(),
  total_votes: z.number().int(),
  popularity_score: z.number()
});

export type Poll = z.infer<typeof pollSchema>;

// Poll option schema
export const pollOptionSchema = z.object({
  id: z.number(),
  poll_id: z.number(),
  option_text: z.string(),
  thumbnail_url: z.string().nullable(),
  vote_count: z.number().int(),
  created_at: z.coerce.date()
});

export type PollOption = z.infer<typeof pollOptionSchema>;

// Vote schema
export const voteSchema = z.object({
  id: z.number(),
  poll_id: z.number(),
  poll_option_id: z.number(),
  ip_address: z.string(),
  voted_at: z.coerce.date()
});

export type Vote = z.infer<typeof voteSchema>;

// Admin user schema
export const adminUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});

export type AdminUser = z.infer<typeof adminUserSchema>;

// Input schemas for creating polls
export const createPollInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  cover_photo_url: z.string().url().nullable(),
  options: z.array(z.object({
    option_text: z.string().min(1),
    thumbnail_url: z.string().url().nullable()
  })).min(2)
});

export type CreatePollInput = z.infer<typeof createPollInputSchema>;

// Input schema for updating polls
export const updatePollInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  cover_photo_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdatePollInput = z.infer<typeof updatePollInputSchema>;

// Input schema for adding poll option
export const addPollOptionInputSchema = z.object({
  poll_id: z.number(),
  option_text: z.string().min(1),
  thumbnail_url: z.string().url().nullable()
});

export type AddPollOptionInput = z.infer<typeof addPollOptionInputSchema>;

// Input schema for voting
export const voteInputSchema = z.object({
  poll_id: z.number(),
  poll_option_id: z.number(),
  ip_address: z.string()
});

export type VoteInput = z.infer<typeof voteInputSchema>;

// Input schema for admin login
export const adminLoginInputSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type AdminLoginInput = z.infer<typeof adminLoginInputSchema>;

// Poll with options response schema
export const pollWithOptionsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  cover_photo_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  is_active: z.boolean(),
  total_votes: z.number().int(),
  popularity_score: z.number(),
  options: z.array(pollOptionSchema)
});

export type PollWithOptions = z.infer<typeof pollWithOptionsSchema>;

// Vote summary schema
export const voteSummarySchema = z.object({
  poll_id: z.number(),
  total_votes: z.number().int(),
  options: z.array(z.object({
    option_id: z.number(),
    option_text: z.string(),
    vote_count: z.number().int(),
    percentage: z.number()
  }))
});

export type VoteSummary = z.infer<typeof voteSummarySchema>;
