import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('単一のクラス名を返す', () => {
    // Given: 単一のクラス名
    const input = 'text-red-500';

    // When: cn関数を呼び出し
    const result = cn(input);

    // Then: そのままのクラス名が返される
    expect(result).toBe('text-red-500');
  });

  it('複数のクラス名を結合する', () => {
    // Given: 複数のクラス名
    const classes = ['text-red-500', 'bg-blue-500'];

    // When: cn関数を呼び出し
    const result = cn(...classes);

    // Then: 結合されたクラス名が返される
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('重複するTailwindクラスをマージする', () => {
    // Given: 重複するテキスト色クラス
    const classes = ['text-red-500', 'text-blue-500'];

    // When: cn関数を呼び出し
    const result = cn(...classes);

    // Then: 後者のクラスが優先される
    expect(result).toBe('text-blue-500');
  });

  it('条件付きクラスを処理する', () => {
    // Given: 条件付きクラス（clsxの機能）
    const isActive = true;
    const isDisabled = false;

    // When: cn関数を呼び出し
    const result = cn('base-class', isActive && 'active', isDisabled && 'disabled');

    // Then: trueの条件のみが含まれる
    expect(result).toBe('base-class active');
  });

  it('falseの条件を除外する', () => {
    // Given: falseの条件
    const condition = false;

    // When: cn関数を呼び出し
    const result = cn('base-class', condition && 'conditional-class');

    // Then: falseの条件は除外される
    expect(result).toBe('base-class');
  });

  it('オブジェクト形式の条件を処理する', () => {
    // Given: オブジェクト形式の条件
    const conditions = {
      'text-red-500': true,
      'text-blue-500': false,
      'bg-gray-100': true,
    };

    // When: cn関数を呼び出し
    const result = cn(conditions);

    // Then: trueのキーのみが含まれる
    expect(result).toBe('text-red-500 bg-gray-100');
  });

  it('配列形式のクラスを処理する', () => {
    // Given: 配列形式のクラス
    const classes = ['class1', 'class2', ['class3', 'class4']];

    // When: cn関数を呼び出し
    const result = cn(classes);

    // Then: フラット化されたクラス名が返される
    expect(result).toBe('class1 class2 class3 class4');
  });

  it('undefinedとnullを無視する', () => {
    // Given: undefinedとnullを含む引数
    const result = cn('base-class', undefined, null, 'other-class');

    // Then: undefinedとnullは除外される
    expect(result).toBe('base-class other-class');
  });

  it('空文字を無視する', () => {
    // Given: 空文字を含む引数
    const result = cn('base-class', '', 'other-class');

    // Then: 空文字は除外される
    expect(result).toBe('base-class other-class');
  });

  it('引数なしの場合に空文字を返す', () => {
    // Given: 引数なし

    // When: cn関数を呼び出し
    const result = cn();

    // Then: 空文字が返される
    expect(result).toBe('');
  });

  it('padding系のクラスをマージする', () => {
    // Given: 重複するpaddingクラス
    const classes = ['p-4', 'p-8'];

    // When: cn関数を呼び出し
    const result = cn(...classes);

    // Then: 後者のクラスが優先される
    expect(result).toBe('p-8');
  });

  it('異なる方向のpaddingは両方保持する', () => {
    // Given: 異なる方向のpaddingクラス
    const classes = ['px-4', 'py-2'];

    // When: cn関数を呼び出し
    const result = cn(...classes);

    // Then: 両方のクラスが保持される
    expect(result).toBe('px-4 py-2');
  });

  it('レスポンシブクラスを正しく処理する', () => {
    // Given: レスポンシブクラス
    const classes = ['text-sm', 'md:text-base', 'lg:text-lg'];

    // When: cn関数を呼び出し
    const result = cn(...classes);

    // Then: すべてのレスポンシブクラスが保持される
    expect(result).toBe('text-sm md:text-base lg:text-lg');
  });

  it('複雑な組み合わせを正しく処理する', () => {
    // Given: 複雑な組み合わせ
    const isActive = true;
    const result = cn(
      'base-class',
      'text-red-500',
      isActive && 'active-class',
      { 'hover:bg-gray-100': true },
      ['array-class-1', 'array-class-2']
    );

    // Then: すべてが正しく結合される
    expect(result).toContain('base-class');
    expect(result).toContain('text-red-500');
    expect(result).toContain('active-class');
    expect(result).toContain('hover:bg-gray-100');
    expect(result).toContain('array-class-1');
    expect(result).toContain('array-class-2');
  });
});
