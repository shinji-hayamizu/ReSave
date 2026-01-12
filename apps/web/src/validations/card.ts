import { z } from 'zod';

export const cardStatusSchema = z.enum(['new', 'active', 'completed']);

export const cardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  front: z.string().min(1, '必須項目です').max(10000, '10000文字以内で入力してください'),
  back: z.string().min(1, '必須項目です').max(10000, '10000文字以内で入力してください'),
  schedule: z.array(z.number().int().positive()),
  currentStep: z.number().int().min(0),
  nextReviewAt: z.string().datetime().nullable(),
  status: cardStatusSchema,
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCardSchema = z.object({
  front: z.string().min(1, '必須項目です').max(10000, '10000文字以内で入力してください'),
  back: z.string().max(10000, '10000文字以内で入力してください').optional().default(''),
  tagIds: z.array(z.string().uuid()).optional(),
  schedule: z.array(z.number().int().positive()).optional(),
});

export const updateCardSchema = createCardSchema.partial();

export const cardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  tagId: z.string().uuid().optional(),
  status: z.enum(['all', 'new', 'due', 'completed']).default('all'),
});

export type Card = z.infer<typeof cardSchema>;
export type CardStatus = z.infer<typeof cardStatusSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type CardQuery = z.infer<typeof cardQuerySchema>;
