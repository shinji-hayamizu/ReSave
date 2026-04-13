import { z } from 'zod';

export const reviewScheduleSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください'),
  intervals: z.array(z.number().int().positive()).min(1, '1つ以上の間隔が必要です'),
  isDefault: z.boolean(),
  createdAt: z.string().datetime(),
});

export const createReviewScheduleSchema = z.object({
  name: z.string().min(1, '必須項目です').max(50, '50文字以内で入力してください'),
  intervals: z.array(z.number().int().positive()).min(1, '1つ以上の間隔が必要です'),
  isDefault: z.boolean().optional().default(false),
});

export const updateReviewScheduleSchema = createReviewScheduleSchema.partial();

export type ReviewSchedule = z.infer<typeof reviewScheduleSchema>;
export type CreateReviewScheduleInput = z.infer<typeof createReviewScheduleSchema>;
export type UpdateReviewScheduleInput = z.infer<typeof updateReviewScheduleSchema>;
