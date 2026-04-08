import { z } from 'zod';

const validTagColors = [
  'blue',
  'green',
  'purple',
  'orange',
  'pink',
  'cyan',
  'yellow',
  'gray',
] as const;

export const tagSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください'),
  color: z.string(),
  createdAt: z.string().datetime(),
});

export const createTagSchema = z.object({
  name: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください'),
  color: z.enum(validTagColors).default('blue'),
});

export const updateTagSchema = createTagSchema.partial();

export const tagQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type Tag = z.infer<typeof tagSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagQuery = z.infer<typeof tagQuerySchema>;
