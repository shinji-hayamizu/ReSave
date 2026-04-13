import { z } from 'zod';

export const assessmentSchema = z.enum(['ok', 'remembered', 'again'], {
  error: '有効な評価を選択してください',
});

export const studyLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  cardId: z.string().uuid(),
  assessment: assessmentSchema,
  studiedAt: z.string().datetime(),
});

export const submitAssessmentSchema = z.object({
  cardId: z.string().uuid({ error: '有効なカードIDを指定してください' }),
  assessment: assessmentSchema,
});

export type Assessment = z.infer<typeof assessmentSchema>;
export type StudyLog = z.infer<typeof studyLogSchema>;
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
