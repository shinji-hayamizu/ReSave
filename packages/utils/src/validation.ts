import { z } from 'zod'

export const cardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  front: z.string().min(1).max(500),
  back: z.string().max(2000),
  reviewLevel: z.number().int().min(0).max(6),
  nextReviewAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const createCardSchema = z.object({
  front: z.string().min(1, 'テキストは必須です').max(500, 'テキストは500文字以内にしてください'),
  back: z.string().max(2000, '隠しテキストは2000文字以内にしてください').default(''),
  tagIds: z.array(z.string().uuid()).max(10, 'タグは最大10個までです').optional(),
})

export const updateCardSchema = z.object({
  front: z.string().min(1).max(500).optional(),
  back: z.string().max(2000).optional(),
  tagIds: z.array(z.string().uuid()).max(10).optional(),
})

export const tagSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  createdAt: z.string().datetime(),
})

export const createTagSchema = z.object({
  name: z.string().min(1, 'タグ名は必須です').max(30, 'タグ名は30文字以内にしてください'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '色コードの形式が正しくありません')
    .default('#6366f1'),
})

export const updateTagSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export const assessmentSchema = z.enum(['ok', 'remembered', 'again'])

export const studyLogSchema = z.object({
  cardId: z.string().uuid(),
  assessment: assessmentSchema,
})
