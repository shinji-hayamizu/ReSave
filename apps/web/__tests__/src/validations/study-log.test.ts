import { describe, it, expect } from 'vitest';
import {
  assessmentSchema,
  studyLogSchema,
  submitAssessmentSchema,
} from '@/validations/study-log';

describe('assessmentSchema', () => {
  it('okの場合にパースに成功する', () => {
    // Given: 有効な評価値
    const input = 'ok';

    // When: スキーマでパース
    const result = assessmentSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('rememberedの場合にパースに成功する', () => {
    // Given: 有効な評価値
    const input = 'remembered';

    // When: スキーマでパース
    const result = assessmentSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('againの場合にパースに成功する', () => {
    // Given: 有効な評価値
    const input = 'again';

    // When: スキーマでパース
    const result = assessmentSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('不正な評価値の場合にパースに失敗する', () => {
    // Given: 不正な評価値
    const input = 'invalid';

    // When: スキーマでパース
    const result = assessmentSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '有効な評価を選択してください'
      );
    }
  });

  it('空文字の場合にパースに失敗する', () => {
    // Given: 空文字
    const input = '';

    // When: スキーマでパース
    const result = assessmentSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('数値の場合にパースに失敗する', () => {
    // Given: 数値
    const input = 1;

    // When: スキーマでパース
    const result = assessmentSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('studyLogSchema', () => {
  const validStudyLog = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    cardId: '123e4567-e89b-12d3-a456-426614174002',
    assessment: 'ok' as const,
    studiedAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効な学習ログデータの場合にパースに成功する', () => {
    // Given: 有効な学習ログデータ
    const input = validStudyLog;

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('assessmentがrememberedの場合にパースに成功する', () => {
    // Given: assessmentがremembered
    const input = { ...validStudyLog, assessment: 'remembered' };

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('assessmentがagainの場合にパースに成功する', () => {
    // Given: assessmentがagain
    const input = { ...validStudyLog, assessment: 'again' };

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('idが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なUUID
    const input = { ...validStudyLog, id: 'invalid-uuid' };

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('userIdが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なUUID
    const input = { ...validStudyLog, userId: 'invalid-uuid' };

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('cardIdが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なUUID
    const input = { ...validStudyLog, cardId: 'invalid-uuid' };

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('assessmentが不正な場合にパースに失敗する', () => {
    // Given: 不正な評価値
    const input = { ...validStudyLog, assessment: 'invalid' };

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('studiedAtが不正な日時形式の場合にパースに失敗する', () => {
    // Given: 不正な日時形式
    const input = { ...validStudyLog, studiedAt: '2024-01-01' };

    // When: スキーマでパース
    const result = studyLogSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('submitAssessmentSchema', () => {
  it('有効な評価送信データの場合にパースに成功する', () => {
    // Given: 有効な評価送信データ
    const input = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'ok',
    };

    // When: スキーマでパース
    const result = submitAssessmentSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('assessmentがrememberedの場合にパースに成功する', () => {
    // Given: assessmentがremembered
    const input = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'remembered',
    };

    // When: スキーマでパース
    const result = submitAssessmentSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('assessmentがagainの場合にパースに成功する', () => {
    // Given: assessmentがagain
    const input = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'again',
    };

    // When: スキーマでパース
    const result = submitAssessmentSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('cardIdが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なUUID
    const input = {
      cardId: 'invalid-uuid',
      assessment: 'ok',
    };

    // When: スキーマでパース
    const result = submitAssessmentSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '有効なカードIDを指定してください'
      );
    }
  });

  it('cardIdが空文字の場合にパースに失敗する', () => {
    // Given: cardIdが空文字
    const input = {
      cardId: '',
      assessment: 'ok',
    };

    // When: スキーマでパース
    const result = submitAssessmentSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('assessmentが不正な場合にパースに失敗する', () => {
    // Given: 不正な評価値
    const input = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: 'invalid',
    };

    // When: スキーマでパース
    const result = submitAssessmentSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('assessmentが空文字の場合にパースに失敗する', () => {
    // Given: assessmentが空文字
    const input = {
      cardId: '123e4567-e89b-12d3-a456-426614174000',
      assessment: '',
    };

    // When: スキーマでパース
    const result = submitAssessmentSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});
