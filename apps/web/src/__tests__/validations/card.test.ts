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
    reviewLevel: 3,
    nextReviewAt: '2024-01-15T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効なカードデータを受け入れる', () => {
    const result = cardSchema.safeParse(validCard);
    expect(result.success).toBe(true);
  });

  it('nextReviewAtがnullでも受け入れる', () => {
    const cardWithNullReview = {
      ...validCard,
      nextReviewAt: null,
    };

    const result = cardSchema.safeParse(cardWithNullReview);
    expect(result.success).toBe(true);
  });

  it('reviewLevelの範囲外の値を拒否する: 負の値', () => {
    const invalidCard = {
      ...validCard,
      reviewLevel: -1,
    };

    const result = cardSchema.safeParse(invalidCard);
    expect(result.success).toBe(false);
  });

  it('reviewLevelの範囲外の値を拒否する: 7以上', () => {
    const invalidCard = {
      ...validCard,
      reviewLevel: 7,
    };

    const result = cardSchema.safeParse(invalidCard);
    expect(result.success).toBe(false);
  });

  it('無効なUUIDを拒否する', () => {
    const invalidCard = {
      ...validCard,
      id: 'not-a-uuid',
    };

    const result = cardSchema.safeParse(invalidCard);
    expect(result.success).toBe(false);
  });
});

describe('createCardSchema', () => {
  it('有効な作成データを受け入れる', () => {
    const validCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
    };

    const result = createCardSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it('tagIds付きの作成データを受け入れる', () => {
    const validCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
      tagIds: [
        '123e4567-e89b-12d3-a456-426614174000',
        '123e4567-e89b-12d3-a456-426614174001',
      ],
    };

    const result = createCardSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it('空の表面テキストを拒否する', () => {
    const invalidCreate = {
      front: '',
      back: '回答テキスト',
    };

    const result = createCardSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('空の裏面テキストを拒否する', () => {
    const invalidCreate = {
      front: '質問テキスト',
      back: '',
    };

    const result = createCardSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('10000文字を超える表面テキストを拒否する', () => {
    const invalidCreate = {
      front: 'a'.repeat(10001),
      back: '回答テキスト',
    };

    const result = createCardSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('10000文字以内で入力してください');
    }
  });

  it('10000文字を超える裏面テキストを拒否する', () => {
    const invalidCreate = {
      front: '質問テキスト',
      back: 'a'.repeat(10001),
    };

    const result = createCardSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('10000文字以内で入力してください');
    }
  });

  it('無効なtagIdを拒否する', () => {
    const invalidCreate = {
      front: '質問テキスト',
      back: '回答テキスト',
      tagIds: ['not-a-uuid'],
    };

    const result = createCardSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
  });
});

describe('updateCardSchema', () => {
  it('部分更新データを受け入れる: frontのみ', () => {
    const partialUpdate = {
      front: '更新された質問',
    };

    const result = updateCardSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('部分更新データを受け入れる: backのみ', () => {
    const partialUpdate = {
      back: '更新された回答',
    };

    const result = updateCardSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを受け入れる', () => {
    const emptyUpdate = {};

    const result = updateCardSchema.safeParse(emptyUpdate);
    expect(result.success).toBe(true);
  });

  it('10000文字を超えるテキストを拒否する', () => {
    const invalidUpdate = {
      front: 'a'.repeat(10001),
    };

    const result = updateCardSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});

describe('cardQuerySchema', () => {
  it('デフォルト値を適用する', () => {
    const emptyQuery = {};

    const result = cardQuerySchema.safeParse(emptyQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.status).toBe('all');
    }
  });

  it('カスタム値を受け入れる', () => {
    const customQuery = {
      limit: 50,
      offset: 10,
      tagId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'due',
    };

    const result = cardQuerySchema.safeParse(customQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
      expect(result.data.tagId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.data.status).toBe('due');
    }
  });

  it('limitの範囲外の値を拒否する: 0以下', () => {
    const invalidQuery = {
      limit: 0,
    };

    const result = cardQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('limitの範囲外の値を拒否する: 100超過', () => {
    const invalidQuery = {
      limit: 101,
    };

    const result = cardQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('負のoffsetを拒否する', () => {
    const invalidQuery = {
      offset: -1,
    };

    const result = cardQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('無効なstatusを拒否する', () => {
    const invalidQuery = {
      status: 'invalid',
    };

    const result = cardQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('文字列のlimitを数値に変換する', () => {
    const stringQuery = {
      limit: '30',
      offset: '5',
    };

    const result = cardQuerySchema.safeParse(stringQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(30);
      expect(result.data.offset).toBe(5);
    }
  });
});
