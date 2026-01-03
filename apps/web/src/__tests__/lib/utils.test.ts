import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('単一のクラス名を返す', () => {
    const result = cn('text-red-500');
    expect(result).toBe('text-red-500');
  });

  it('複数のクラス名を結合する', () => {
    const result = cn('text-red-500', 'bg-white');
    expect(result).toBe('text-red-500 bg-white');
  });

  it('条件付きクラス名を処理する', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('false条件のクラス名を除外する', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('オブジェクト形式のクラス名を処理する', () => {
    const result = cn({
      'text-red-500': true,
      'text-blue-500': false,
      'bg-white': true,
    });
    expect(result).toBe('text-red-500 bg-white');
  });

  it('配列形式のクラス名を処理する', () => {
    const result = cn(['text-red-500', 'bg-white']);
    expect(result).toBe('text-red-500 bg-white');
  });

  it('Tailwindの競合するクラスをマージする', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('Tailwindのレスポンシブクラスを正しく処理する', () => {
    const result = cn('p-4', 'md:p-6', 'lg:p-8');
    expect(result).toBe('p-4 md:p-6 lg:p-8');
  });

  it('undefinedを無視する', () => {
    const result = cn('text-red-500', undefined, 'bg-white');
    expect(result).toBe('text-red-500 bg-white');
  });

  it('nullを無視する', () => {
    const result = cn('text-red-500', null, 'bg-white');
    expect(result).toBe('text-red-500 bg-white');
  });

  it('空文字列を無視する', () => {
    const result = cn('text-red-500', '', 'bg-white');
    expect(result).toBe('text-red-500 bg-white');
  });

  it('引数なしで空文字列を返す', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('背景色の競合を解決する', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
  });

  it('テキスト色の競合を解決する', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('異なるユーティリティは保持する', () => {
    const result = cn('text-red-500', 'bg-blue-500', 'p-4');
    expect(result).toBe('text-red-500 bg-blue-500 p-4');
  });

  it('複雑な組み合わせを処理する', () => {
    const isError = true;
    const isDisabled = false;
    const result = cn(
      'base-input',
      'border',
      isError && 'border-red-500',
      isDisabled && 'opacity-50',
      { 'bg-gray-100': isDisabled }
    );
    expect(result).toBe('base-input border border-red-500');
  });
});
