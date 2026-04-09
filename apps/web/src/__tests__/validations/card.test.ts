import { describe, it, expect } from 'vitest';
import {
  cardSchema,
  createCardSchema,
  updateCardSchema,
  cardQuerySchema,
} from '@/validations/card';

describe('cardSchema', () => {
  const validCard = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    front: '表面のテキスト',
    back: '裏面のテキスト',
    sourceUrl: null,
    schedule: [1, 3, 7, 14, 30, 180],
    currentStep: 3,
    nextReviewAt: '2024-01-15T00:00:00.000Z',
    status: 'active' as const,
    completedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効なカードデータを受け入れる', () => {
    // Given: 有効なカードデータ
    // When: パース実行
    const result = cardSchema.safeParse(validCard);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('nextReviewAtがnullでも受け入れる', () => {
    // Given: nextReviewAtがnullのカードデータ
    const cardWithNullReview = {
      ...validCard,
      nextReviewAt: null,
    };

    // When: パース実行
    const result = cardSchema.safeParse(cardWithNullReview);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('currentStepの範囲外の値を拒否する: 負の値', () => {
    // Given: currentStepが負の値のカードデータ
    const invalidCard = {
      ...validCard,
      currentStep: -1,
    };

    // When: パース実行
    const result = cardSchema.safeParse(invalidCard);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('無効なUUIDを拒否する', () => {
    // Given: 無効なUUIDを持つカードデータ
    const invalidCard = {
      ...validCard,
      id: 'not-a-uuid',
    };

    // When: パース実行
    const result = cardSchema.safeParse(invalidCard);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('無効なstatusを拒否する', () => {
    // Given: 無効なstatusを持つカードデータ
    const invalidCard = {
      ...validCard,
      status: 'invalid',
    };

    // When: パース実行
    const result = cardSchema.safeParse(invalidCard);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('completedAtがnullでも受け入れる', () => {
    // Given: completedAtがnullのカードデータ
    // When: パース実行
    const result = cardSchema.safeParse(validCard);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('完了済みカードを受け入れる', () => {
    // Given: completedAt付きの完了済みカードデータ
    const completedCard = {
      ...validCard,
      status: 'completed' as const,
      completedAt: '2024-01-20T00:00:00.000Z',
    };

    // When: パース実行
    const result = cardSchema.safeParse(completedCard);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });
});

describe('createCardSchema', () => {
  it('有効な作成データを受け入れる', () => {
    // Given: 有効な作成データ
    const validCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
    };

    // When: パース実行
    const result = createCardSchema.safeParse(validCreate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('backが省略された場合でも受け入れる', () => {
    // Given: backを省略した作成データ
    const validCreate = {
      front: '質問テキスト',
    };

    // When: パース実行
    const result = createCardSchema.safeParse(validCreate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.back).toBe('');
    }
  });

  it('tagIds付きの作成データを受け入れる', () => {
    // Given: tagIds付きの作成データ
    const validCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
      tagIds: [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      ],
    };

    // When: パース実行
    const result = createCardSchema.safeParse(validCreate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('schedule付きの作成データを受け入れる', () => {
    // Given: カスタムschedule付きの作成データ
    const validCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
      schedule: [1, 2, 4, 7, 14],
    };

    // When: パース実行
    const result = createCardSchema.safeParse(validCreate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('空の表面テキストを拒否する', () => {
    // Given: 空のfrontを持つ作成データ
    const invalidCreate = {
      front: '',
      back: '回答テキスト',
    };

    // When: パース実行
    const result = createCardSchema.safeParse(invalidCreate);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('10000文字を超える表面テキストを拒否する', () => {
    // Given: 10000文字を超えるfrontを持つ作成データ
    const invalidCreate = {
      front: 'a'.repeat(10001),
      back: '回答テキスト',
    };

    // When: パース実行
    const result = createCardSchema.safeParse(invalidCreate);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('10000文字以内で入力してください');
    }
  });

  it('10000文字を超える裏面テキストを拒否する', () => {
    // Given: 10000文字を超えるbackを持つ作成データ
    const invalidCreate = {
      front: '質問テキスト',
      back: 'a'.repeat(10001),
    };

    // When: パース実行
    const result = createCardSchema.safeParse(invalidCreate);

    // Then: パースに失敗し、適切なエラーメッセージが返る
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('10000文字以内で入力してください');
    }
  });

  it('無効なtagIdを拒否する', () => {
    // Given: 無効なtagIdを持つ作成データ
    const invalidCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
      tagIds: ['not-a-uuid'],
    };

    // When: パース実行
    const result = createCardSchema.safeParse(invalidCreate);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('scheduleに0以下の値を含む場合拒否する', () => {
    // Given: 0以下の値を含むschedule
    const invalidCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
      schedule: [0, 1, 3],
    };

    // When: パース実行
    const result = createCardSchema.safeParse(invalidCreate);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('updateCardSchema', () => {
  it('部分更新データを受け入れる: frontのみ', () => {
    // Given: frontのみの更新データ
    const partialUpdate = {
      front: '更新された質問',
    };

    // When: パース実行
    const result = updateCardSchema.safeParse(partialUpdate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('部分更新データを受け入れる: backのみ', () => {
    // Given: backのみの更新データ
    const partialUpdate = {
      back: '更新された回答',
    };

    // When: パース実行
    const result = updateCardSchema.safeParse(partialUpdate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを受け入れる', () => {
    // Given: 空の更新データ
    const emptyUpdate = {};

    // When: パース実行
    const result = updateCardSchema.safeParse(emptyUpdate);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('10000文字を超えるテキストを拒否する', () => {
    // Given: 10000文字を超えるfrontを持つ更新データ
    const invalidUpdate = {
      front: 'a'.repeat(10001),
    };

    // When: パース実行
    const result = updateCardSchema.safeParse(invalidUpdate);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('cardQuerySchema', () => {
  it('デフォルト値を適用する', () => {
    // Given: 空のクエリ
    const emptyQuery = {};

    // When: パース実行
    const result = cardQuerySchema.safeParse(emptyQuery);

    // Then: デフォルト値が適用される
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.status).toBe('all');
    }
  });

  it('カスタム値を受け入れる', () => {
    // Given: カスタム値を持つクエリ
    const customQuery = {
      limit: 50,
      offset: 10,
      tagId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'due',
    };

    // When: パース実行
    const result = cardQuerySchema.safeParse(customQuery);

    // Then: 指定した値が設定される
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
      expect(result.data.tagId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data.status).toBe('due');
    }
  });

  it('limitの範囲外の値を拒否する: 0以下', () => {
    // Given: limit=0のクエリ
    const invalidQuery = {
      limit: 0,
    };

    // When: パース実行
    const result = cardQuerySchema.safeParse(invalidQuery);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('limitの範囲外の値を拒否する: 100超過', () => {
    // Given: limit=101のクエリ
    const invalidQuery = {
      limit: 101,
    };

    // When: パース実行
    const result = cardQuerySchema.safeParse(invalidQuery);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('負のoffsetを拒否する', () => {
    // Given: 負のoffsetを持つクエリ
    const invalidQuery = {
      offset: -1,
    };

    // When: パース実行
    const result = cardQuerySchema.safeParse(invalidQuery);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('無効なstatusを拒否する', () => {
    // Given: 無効なstatusを持つクエリ
    const invalidQuery = {
      status: 'invalid',
    };

    // When: パース実行
    const result = cardQuerySchema.safeParse(invalidQuery);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('文字列のlimitを数値に変換する', () => {
    // Given: 文字列の数値を持つクエリ
    const stringQuery = {
      limit: '30',
      offset: '5',
    };

    // When: パース実行
    const result = cardQuerySchema.safeParse(stringQuery);

    // Then: 数値に変換される
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(30);
      expect(result.data.offset).toBe(5);
    }
  });
});
