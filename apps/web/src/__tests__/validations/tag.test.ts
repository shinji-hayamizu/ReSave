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
    name: 'プログラミング',
    color: 'blue',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  it('有効なタグデータを受け入れる', () => {
    const result = tagSchema.safeParse(validTag);
    expect(result.success).toBe(true);
  });

  it('無効なUUIDを拒否する', () => {
    const invalidTag = {
      ...validTag,
      id: 'not-a-uuid',
    };

    const result = tagSchema.safeParse(invalidTag);
    expect(result.success).toBe(false);
  });

  it('空の名前を拒否する', () => {
    const invalidTag = {
      ...validTag,
      name: '',
    };

    const result = tagSchema.safeParse(invalidTag);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('50文字を超える名前を拒否する', () => {
    const invalidTag = {
      ...validTag,
      name: 'a'.repeat(51),
    };

    const result = tagSchema.safeParse(invalidTag);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('50文字以内で入力してください');
    }
  });

  it('有効な色名を受け入れる: blue', () => {
    const result = tagSchema.safeParse({ ...validTag, color: 'blue' });
    expect(result.success).toBe(true);
  });

  it('有効な色名を受け入れる: green', () => {
    const result = tagSchema.safeParse({ ...validTag, color: 'green' });
    expect(result.success).toBe(true);
  });

  it('有効な色名を受け入れる: purple', () => {
    const result = tagSchema.safeParse({ ...validTag, color: 'purple' });
    expect(result.success).toBe(true);
  });
});

describe('createTagSchema', () => {
  it('有効な作成データを受け入れる', () => {
    const validCreate = {
      name: '新しいタグ',
      color: 'green',
    };

    const result = createTagSchema.safeParse(validCreate);
    expect(result.success).toBe(true);
  });

  it('colorを省略した場合デフォルト値(blue)を使用する', () => {
    const createWithoutColor = {
      name: '新しいタグ',
    };

    const result = createTagSchema.safeParse(createWithoutColor);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe('blue');
    }
  });

  it('空の名前を拒否する', () => {
    const invalidCreate = {
      name: '',
      color: 'green',
    };

    const result = createTagSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('必須項目です');
    }
  });

  it('50文字を超える名前を拒否する', () => {
    const invalidCreate = {
      name: 'a'.repeat(51),
      color: 'green',
    };

    const result = createTagSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('50文字以内で入力してください');
    }
  });

  it('無効な色名を拒否する', () => {
    const invalidCreate = {
      name: '新しいタグ',
      color: 'invalid',
    };

    const result = createTagSchema.safeParse(invalidCreate);
    expect(result.success).toBe(false);
  });
});

describe('updateTagSchema', () => {
  it('部分更新データを受け入れる: nameのみ', () => {
    const partialUpdate = {
      name: '更新されたタグ名',
    };

    const result = updateTagSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('部分更新データを受け入れる: colorのみ', () => {
    const partialUpdate = {
      color: 'cyan',
    };

    const result = updateTagSchema.safeParse(partialUpdate);
    expect(result.success).toBe(true);
  });

  it('空のオブジェクトを受け入れる', () => {
    const emptyUpdate = {};

    const result = updateTagSchema.safeParse(emptyUpdate);
    expect(result.success).toBe(true);
  });

  it('50文字を超える名前を拒否する', () => {
    const invalidUpdate = {
      name: 'a'.repeat(51),
    };

    const result = updateTagSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });

  it('無効な色名を拒否する', () => {
    const invalidUpdate = {
      color: 'not-a-color',
    };

    const result = updateTagSchema.safeParse(invalidUpdate);
    expect(result.success).toBe(false);
  });
});

describe('tagQuerySchema', () => {
  it('デフォルト値を適用する', () => {
    const emptyQuery = {};

    const result = tagQuerySchema.safeParse(emptyQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('カスタム値を受け入れる', () => {
    const customQuery = {
      limit: 50,
      offset: 10,
    };

    const result = tagQuerySchema.safeParse(customQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(10);
    }
  });

  it('limitの範囲外の値を拒否する: 0以下', () => {
    const invalidQuery = {
      limit: 0,
    };

    const result = tagQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('limitの範囲外の値を拒否する: 100超過', () => {
    const invalidQuery = {
      limit: 101,
    };

    const result = tagQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('負のoffsetを拒否する', () => {
    const invalidQuery = {
      offset: -1,
    };

    const result = tagQuerySchema.safeParse(invalidQuery);
    expect(result.success).toBe(false);
  });

  it('文字列のlimitを数値に変換する', () => {
    const stringQuery = {
      limit: '30',
      offset: '5',
    };

    const result = tagQuerySchema.safeParse(stringQuery);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(30);
      expect(result.data.offset).toBe(5);
    }
  });
});
