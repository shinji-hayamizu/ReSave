import { describe, it, expect } from 'vitest';
import {
  tagSchema,
  createTagSchema,
  updateTagSchema,
  tagQuerySchema,
} from '@/validations/tag';

describe('tagSchema', () => {
  const validTag = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'タグ名',
    color: '#6366f1',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効なタグデータの場合にパースに成功する', () => {
    // Given: 有効なタグデータ
    const input = validTag;

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('idが不正なUUIDの場合にパースに失敗する', () => {
    // Given: 不正なUUID
    const input = { ...validTag, id: 'invalid-uuid' };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('nameが空文字の場合にパースに失敗する', () => {
    // Given: nameが空文字
    const input = { ...validTag, name: '' };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('nameが51文字以上の場合にパースに失敗する', () => {
    // Given: nameが51文字
    const input = { ...validTag, name: 'a'.repeat(51) };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '50文字以内で入力してください'
      );
    }
  });

  it('colorが不正なフォーマットの場合にパースに失敗する', () => {
    // Given: 不正なカラーコード
    const input = { ...validTag, color: 'red' };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        '有効な色コードを入力してください'
      );
    }
  });

  it('colorが#なしの場合にパースに失敗する', () => {
    // Given: #なしのカラーコード
    const input = { ...validTag, color: '6366f1' };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('colorが3桁のカラーコードの場合にパースに失敗する', () => {
    // Given: 3桁のカラーコード
    const input = { ...validTag, color: '#fff' };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('colorが大文字の場合にパースに成功する', () => {
    // Given: 大文字のカラーコード
    const input = { ...validTag, color: '#FFFFFF' };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('createdAtが不正な日時形式の場合にパースに失敗する', () => {
    // Given: 不正な日時形式
    const input = { ...validTag, createdAt: '2024-01-01' };

    // When: スキーマでパース
    const result = tagSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('createTagSchema', () => {
  it('有効な作成データの場合にパースに成功する', () => {
    // Given: 有効な作成データ
    const input = {
      name: 'タグ名',
      color: '#ff0000',
    };

    // When: スキーマでパース
    const result = createTagSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('colorを省略した場合にデフォルト値が適用される', () => {
    // Given: colorを省略した作成データ
    const input = {
      name: 'タグ名',
    };

    // When: スキーマでパース
    const result = createTagSchema.safeParse(input);

    // Then: デフォルト値が適用される
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe('#6366f1');
    }
  });

  it('nameが空の場合にパースに失敗する', () => {
    // Given: nameが空
    const input = {
      name: '',
      color: '#ff0000',
    };

    // When: スキーマでパース
    const result = createTagSchema.safeParse(input);

    // Then: パースに失敗し、エラーメッセージが表示される
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('colorが不正な場合にパースに失敗する', () => {
    // Given: 不正なカラーコード
    const input = {
      name: 'タグ名',
      color: 'invalid',
    };

    // When: スキーマでパース
    const result = createTagSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('updateTagSchema', () => {
  it('nameのみの更新データの場合にパースに成功する', () => {
    // Given: nameのみの更新データ
    const input = {
      name: '新しいタグ名',
    };

    // When: スキーマでパース
    const result = updateTagSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('colorのみの更新データの場合にパースに成功する', () => {
    // Given: colorのみの更新データ
    const input = {
      color: '#00ff00',
    };

    // When: スキーマでパース
    const result = updateTagSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('空オブジェクトの場合にパースに成功する', () => {
    // Given: 空オブジェクト
    const input = {};

    // When: スキーマでパース
    const result = updateTagSchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
  });

  it('nameが空文字の場合にパースに失敗する', () => {
    // Given: nameが空文字
    const input = { name: '' };

    // When: スキーマでパース
    const result = updateTagSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('colorが不正な場合にパースに失敗する', () => {
    // Given: 不正なカラーコード
    const input = { color: '#gggggg' };

    // When: スキーマでパース
    const result = updateTagSchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});

describe('tagQuerySchema', () => {
  it('パラメータなしの場合にデフォルト値が適用される', () => {
    // Given: 空のクエリパラメータ
    const input = {};

    // When: スキーマでパース
    const result = tagQuerySchema.safeParse(input);

    // Then: デフォルト値が適用される
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('有効なクエリパラメータの場合にパースに成功する', () => {
    // Given: 有効なクエリパラメータ
    const input = {
      limit: 50,
      offset: 10,
    };

    // When: スキーマでパース
    const result = tagQuerySchema.safeParse(input);

    // Then: パースに成功する
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
    }
  });

  it('文字列のlimitが数値に変換される', () => {
    // Given: 文字列のlimit
    const input = { limit: '30' };

    // When: スキーマでパース
    const result = tagQuerySchema.safeParse(input);

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
    const result = tagQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('limitが0以下の場合にパースに失敗する', () => {
    // Given: limitが0
    const input = { limit: 0 };

    // When: スキーマでパース
    const result = tagQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });

  it('offsetが負の場合にパースに失敗する', () => {
    // Given: offsetが負
    const input = { offset: -1 };

    // When: スキーマでパース
    const result = tagQuerySchema.safeParse(input);

    // Then: パースに失敗する
    expect(result.success).toBe(false);
  });
});
