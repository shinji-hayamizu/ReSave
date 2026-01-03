import { z } from 'zod';

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const tagSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください'),
  color: z.string().regex(hexColorRegex, '有効な色コードを入力してください'),
  createdAt: z.string().datetime(),
});

export const createTagSchema = z.object({
  name: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください'),
  color: z
    .string()
    .regex(hexColorRegex, '有効な色コードを入力してください')
    .default('#6366f1'),
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
