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
    front: 'フロントテキスト',
    back: 'バックテキスト',
    reviewLevel: 0,
    nextReviewAt: '2024-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効なカードデータの場合にパースに成功する', () => {
    // Given: 有効なカードデータ
    const input = validCard;

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('nextReviewAtがnullの場合にパースに成功する', () => {
    // Given: nextReviewAtがnullのカードデータ
    const input = { ...validCard, nextReviewAt: null };

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('idが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なUUID
    const input = { ...validCard, id: 'invalid-uuid' };

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('frontが空文字の場合にパースに失敗する', () => {
    // Given: frontが空文字
    const input = { ...validCard, front: '' };

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('backが10001文字以上の場合にパースに失敗する', () => {
    // Given: backが10001文字
    const input = { ...validCard, back: 'a'.repeat(10001) };

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '10000文字以内で入力してください'
      );
    }
  });

  it('reviewLevelが負の場合にパースに失敗する', () => {
    // Given: reviewLevelが負
    const input = { ...validCard, reviewLevel: -1 };

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('reviewLevelが7以上の場合にパースに失敗する', () => {
    // Given: reviewLevelが7
    const input = { ...validCard, reviewLevel: 7 };

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('reviewLevelが小数の場合にパースに失敗する', () => {
    // Given: reviewLevelが小数
    const input = { ...validCard, reviewLevel: 1.5 };

    // When: スキーマでパース
    const result = cardSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('createCardSchema', () => {
  it('有効な作成データの場合にパースに成功する', () => {
    // Given: 有効な作成データ
    const input = {
      front: 'フロントテキスト',
      back: 'バックテキスト',
    };

    // When: スキーマでパース
    const result = createCardSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('tagIdsを含む場合にパースに成功する', () => {
    // Given: tagIdsを含む作成データ
    const input = {
      front: 'フロントテキスト',
      back: 'バックテキスト',
      tagIds: ['123e4567-e89b-12d3-a456-426614174000'],
    };

    // When: スキーマでパース
    const result = createCardSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('tagIdsが空配列の場合にパースに成功する', () => {
    // Given: tagIdsが空配列
    const input = {
      front: 'フロントテキスト',
      back: 'バックテキスト',
      tagIds: [],
    };

    // When: スキーマでパース
    const result = createCardSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('tagIdsに不正なUUIDが含まれる場合にパースに失敗する', () => {
    // Given: 不正なUUIDを含むtagIds
    const input = {
      front: 'フロントテキスト',
      back: 'バックテキスト',
      tagIds: ['invalid-uuid'],
    };

    // When: スキーマでパース
    const result = createCardSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('frontが空の場合にパースに失敗する', () => {
    // Given: frontが空
    const input = {
      front: '',
      back: 'バックテキスト',
    };

    // When: スキーマでパース
    const result = createCardSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });
});

describe('updateCardSchema', () => {
  it('frontのみの更新データの場合にパースに成功する', () => {
    // Given: frontのみの更新データ
    const input = {
      front: '新しいフロントテキスト',
    };

    // When: スキーマでパース
    const result = updateCardSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('空オブジェクトの場合にパースに成功する', () => {
    // Given: 空オブジェクト
    const input = {};

    // When: スキーマでパース
    const result = updateCardSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('frontが空文字の場合にパースに失敗する', () => {
    // Given: frontが空文字
    const input = { front: '' };

    // When: スキーマでパース
    const result = updateCardSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('cardQuerySchema', () => {
  it('パラメータなしの場合にデフォルト値が適用される', () => {
    // Given: 空のクエリパラメータ
    const input = {};

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: デフォルト値が適用される
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.status).toBe('all');
    }
  });

  it('有効なクエリパラメータの場合にパースに成功する', () => {
    // Given: 有効なクエリパラメータ
    const input = {
      limit: 50,
      offset: 10,
      tagId: '123e4567-e89b-12d3-a456-426614174000',
      status: 'due',
    };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
      expect(result.data.status).toBe('due');
    }
  });

  it('文字列のlimitが数値に変換される', () => {
    // Given: 文字列のlimit
    const input = { limit: '30' };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: 数値に変換される
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(30);
    }
  });

  it('limitが101以上の場合にパースに失敗する', () => {
    // Given: limitが101
    const input = { limit: 101 };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('limitが0以下の場合にパースに失敗する', () => {
    // Given: limitが0
    const input = { limit: 0 };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('offsetが負の場合にパースに失敗する', () => {
    // Given: offsetが負
    const input = { offset: -1 };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('statusがcompletedの場合にパースに成功する', () => {
    // Given: statusがcompleted
    const input = { status: 'completed' };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('statusが不正な値の場合にパースに失敗する', () => {
    // Given: 不正なstatus
    const input = { status: 'invalid' };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('tagIdが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なtagId
    const input = { tagId: 'invalid-uuid' };

    // When: スキーマでパース
    const result = cardQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});
