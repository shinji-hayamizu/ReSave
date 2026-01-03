import { describe, it, expect } from 'vitest';
import {
  assessmentSchema,
  studyLogSchema,
  submitAssessmentSchema,
} from '@/validations/study-log';

describe('assessmentSchema', () => {
  it('ok を受け入れる', () => {
    const result = assessmentSchema.safeParse('ok');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('ok');
    }
  });

  it('remembered を受け入れる', () => {
    const result = assessmentSchema.safeParse('remembered');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('remembered');
    }
  });

  it('again を受け入れる', () => {
    const result = assessmentSchema.safeParse('again');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('again');
    }
  });

  it('無効な評価値を拒否する', () => {
    const result = assessmentSchema.safeParse('invalid');
    expect(result.success).toBe(false);
  });

  it('空文字を拒否する', () => {
    const result = assessmentSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('数値を拒否する', () => {
    const result = assessmentSchema.safeParse(1);
    expect(result.success).toBe(false);
  });
});

describe('studyLogSchema', () => {
  const validStudyLog = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    cardId: '123e4567-e89b-12d3-a456-426614174002',
    assessment: 'ok',
    studiedAt: '2024-01-01T10:30:00.000Z',
  };

  it('有効な学習ログデータを受け入れる: ok', () => {
    const result = studyLogSchema.safeParse(validStudyLog);
    expect(result.success).toBe(true);
  });

  it('有効な学習ログデータを受け入れる: remembered', () => {
    const logWithRemembered = {
      ...validStudyLog,
      assessment: 'remembered',
    };

    const result = studyLogSchema.safeParse(logWithRemembered);
    expect(result.success).toBe(true);
  });

  it('有効な学習ログデータを受け入れる: again', () => {
    const logWithAgain = {
      ...validStudyLog,
      assessment: 'again',
    };

    const result = studyLogSchema.safeParse(logWithAgain);
    expect(result.success).toBe(true);
  });

  it('無効なUUIDを拒否する: id', () => {
    const invalidLog = {
      ...validStudyLog,
      id: 'not-a-uuid',
    };

    const result = studyLogSchema.safeParse(invalidLog);
    expect(result.success).toBe(false);
  });

  it('無効なUUIDを拒否する: userId', () => {
    const invalidLog = {
      ...validStudyLog,
      userId: 'not-a-uuid',
    };

    const result = studyLogSchema.safeParse(invalidLog);
    expect(result.success).toBe(false);
  });

  it('無効なUUIDを拒否する: cardId', () => {
    const invalidLog = {
      ...validStudyLog,
      cardId: 'not-a-uuid',
    };

    const result = studyLogSchema.safeParse(invalidLog);
    expect(result.success).toBe(false);
  });

  it('無効な評価を拒否する', () => {
    const invalidLog = {
      ...validStudyLog,
      assessment: 'invalid',
    };

    const result = studyLogSchema.safeParse(invalidLog);
    expect(result.success).toBe(false);
  });

  it('無効な日時形式を拒否する', () => {
    const invalidLog = {
      ...validStudyLog,
      studiedAt: 'not-a-datetime',
    };

    const result = studyLogSchema.safeParse(invalidLog);
    expect(result.success).toBe(false);
  });
});

describe('submitAssessmentSchema', () => {
  it('有効な評価送信データを受け入れる: ok', () => {
    const validSubmit = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'ok',
    };

    const result = submitAssessmentSchema.safeParse(validSubmit);
    expect(result.success).toBe(true);
  });

  it('有効な評価送信データを受け入れる: remembered', () => {
    const validSubmit = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'remembered',
    };

    const result = submitAssessmentSchema.safeParse(validSubmit);
    expect(result.success).toBe(true);
  });

  it('有効な評価送信データを受け入れる: again', () => {
    const validSubmit = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'again',
    };

    const result = submitAssessmentSchema.safeParse(validSubmit);
    expect(result.success).toBe(true);
  });

  it('無効なcardIdを拒否する', () => {
    const invalidSubmit = {
      cardId: 'not-a-uuid',
      assessment: 'ok',
    };

    const result = submitAssessmentSchema.safeParse(invalidSubmit);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('有効なカードIDを指定してください');
    }
  });

  it('無効な評価を拒否する', () => {
    const invalidSubmit = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'invalid',
    };

    const result = submitAssessmentSchema.safeParse(invalidSubmit);
    expect(result.success).toBe(false);
  });

  it('cardIdの欠落を拒否する', () => {
    const invalidSubmit = {
      assessment: 'ok',
    };

    const result = submitAssessmentSchema.safeParse(invalidSubmit);
    expect(result.success).toBe(false);
  });

  it('assessmentの欠落を拒否する', () => {
    const invalidSubmit = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = submitAssessmentSchema.safeParse(invalidSubmit);
    expect(result.success).toBe(false);
  });
});
