import { describe, it, expect } from 'vitest';
import {
  reviewScheduleSchema,
  createReviewScheduleSchema,
  updateReviewScheduleSchema,
} from '@/validations/review-schedule';

describe('reviewScheduleSchema', () => {
  const validSchedule = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'デフォルトスケジュール',
    intervals: [1, 3, 7, 14, 30, 180],
    isDefault: true,
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効なスケジュールデータを受け入れる', () => {
    // Given: 有効なスケジュールデータ
    // When: パース実行
    const result = reviewScheduleSchema.safeParse(validSchedule);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('無効なUUIDを拒否する', () => {
    // Given: 無効なUUIDを持つスケジュールデータ
    const invalidSchedule = {
      ...validSchedule,
      id: 'not-a-uuid',
    };

    // When: パース実行
    const result = reviewScheduleSchema.safeParse(invalidSchedule);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('空の名前を拒否する', () => {
    // Given: 空の名前を持つスケジュールデータ
    const invalidSchedule = {
      ...validSchedule,
      name: '',
    };

    // When: パース実行
    const result = reviewScheduleSchema.safeParse(invalidSchedule);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('50文字を超える名前を拒否する', () => {
    // Given: 50文字を超える名前を持つスケジュールデータ
    const invalidSchedule = {
      ...validSchedule,
      name: 'a'.repeat(51),
    };

    // When: パース実行
    const result = reviewScheduleSchema.safeParse(invalidSchedule);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('50文字以内で入力してください');
    }
  });

  it('空のintervals配列を拒否する', () => {
    // Given: 空のintervals配列を持つスケジュールデータ
    const invalidSchedule = {
      ...validSchedule,
      intervals: [],
    };

    // When: パース実行
    const result = reviewScheduleSchema.safeParse(invalidSchedule);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('1つ以上の間隔が必要です');
    }
  });

  it('intervalsに0以下の値を含む場合拒否する', () => {
    // Given: 0以下の値を含むintervals
    const invalidSchedule = {
      ...validSchedule,
      intervals: [0, 1, 3],
    };

    // When: パース実行
    const result = reviewScheduleSchema.safeParse(invalidSchedule);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('intervalsに負の値を含む場合拒否する', () => {
    // Given: 負の値を含むintervals
    const invalidSchedule = {
      ...validSchedule,
      intervals: [-1, 1, 3],
    };

    // When: パース実行
    const result = reviewScheduleSchema.safeParse(invalidSchedule);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('isDefaultがfalseでも受け入れる', () => {
    // Given: isDefaultがfalseのスケジュールデータ
    const nonDefaultSchedule = {
      ...validSchedule,
      isDefault: false,
    };

    // When: パース実行
    const result = reviewScheduleSchema.safeParse(nonDefaultSchedule);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });
});

describe('createReviewScheduleSchema', () => {
  it('有効な作成データを受け入れる', () => {
    // Given: 有効な作成データ
    const validCreate = {
      name: '新しいスケジュール',
      intervals: [1, 2, 4, 7],
    };

    // When: パース実行
    const result = createReviewScheduleSchema.safeParse(validCreate);

    // Then: パースに成功し、isDefaultがデフォルトでfalseになる
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(false);
    }
  });

  it('isDefault付きの作成データを受け入れる', () => {
    // Given: isDefault付きの作成データ
    const validCreate = {
      name: '新しいスケジュール',
      intervals: [1, 2, 4, 7],
      isDefault: true,
    };

    // When: パース実行
    const result = createReviewScheduleSchema.safeParse(validCreate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDefault).toBe(true);
    }
  });

  it('空の名前を拒否する', () => {
    // Given: 空の名前を持つ作成データ
    const invalidCreate = {
      name: '',
      intervals: [1, 2, 4],
    };

    // When: パース実行
    const result = createReviewScheduleSchema.safeParse(invalidCreate);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('空のintervals配列を拒否する', () => {
    // Given: 空のintervals配列を持つ作成データ
    const invalidCreate = {
      name: '新しいスケジュール',
      intervals: [],
    };

    // When: パース実行
    const result = createReviewScheduleSchema.safeParse(invalidCreate);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('1つ以上の間隔が必要です');
    }
  });
});

describe('updateReviewScheduleSchema', () => {
  it('部分更新データを受け入れる: nameのみ', () => {
    // Given: nameのみの更新データ
    const partialUpdate = {
      name: '更新された名前',
    };

    // When: パース実行
    const result = updateReviewScheduleSchema.safeParse(partialUpdate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('部分更新データを受け入れる: intervalsのみ', () => {
    // Given: intervalsのみの更新データ
    const partialUpdate = {
      intervals: [1, 3, 7, 14],
    };

    // When: パース実行
    const result = updateReviewScheduleSchema.safeParse(partialUpdate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('部分更新データを受け入れる: isDefaultのみ', () => {
    // Given: isDefaultのみの更新データ
    const partialUpdate = {
      isDefault: true,
    };

    // When: パース実行
    const result = updateReviewScheduleSchema.safeParse(partialUpdate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを受け入れる', () => {
    // Given: 空の更新データ
    const emptyUpdate = {};

    // When: パース実行
    const result = updateReviewScheduleSchema.safeParse(emptyUpdate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('50文字を超える名前を拒否する', () => {
    // Given: 50文字を超える名前を持つ更新データ
    const invalidUpdate = {
      name: 'a'.repeat(51),
    };

    // When: パース実行
    const result = updateReviewScheduleSchema.safeParse(invalidUpdate);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});
