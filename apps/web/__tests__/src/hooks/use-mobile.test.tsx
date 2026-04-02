import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  const originalInnerWidth = window.innerWidth;
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mediaQueryCallback: ((e: { matches: boolean }) => void) | null = null;

  beforeEach(() => {
    mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, callback: () => void) => {
        if (event === 'change') {
          mediaQueryCallback = callback;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    window.matchMedia = mockMatchMedia as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    mediaQueryCallback = null;
  });

  it('初期状態ではfalseを返す', () => {
    // Given: デスクトップサイズの画面幅
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // When: フックをレンダリング
    const { result } = renderHook(() => useIsMobile());

    // Then: falseを返す
    expect(result.current).toBe(false);
  });

  it('画面幅が768px未満の場合にtrueを返す', () => {
    // Given: モバイルサイズの画面幅
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    });

    // When: フックをレンダリング
    const { result } = renderHook(() => useIsMobile());

    // Then: trueを返す
    expect(result.current).toBe(true);
  });

  it('画面幅が768pxの場合にfalseを返す', () => {
    // Given: ちょうど768pxの画面幅
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // When: フックをレンダリング
    const { result } = renderHook(() => useIsMobile());

    // Then: falseを返す（768px以上はデスクトップ）
    expect(result.current).toBe(false);
  });

  it('画面幅が変更された場合に値が更新される', () => {
    // Given: 初期状態はデスクトップサイズ
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // When: 画面幅をモバイルサイズに変更
    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      if (mediaQueryCallback) {
        mediaQueryCallback({ matches: true });
      }
    });

    // Then: trueに更新される
    expect(result.current).toBe(true);
  });

  it('matchMediaが正しいクエリで呼ばれる', () => {
    // Given: デスクトップサイズの画面幅
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    // When: フックをレンダリング
    renderHook(() => useIsMobile());

    // Then: 正しいメディアクエリで呼ばれる
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('アンマウント時にイベントリスナーが削除される', () => {
    // Given: フックをレンダリング
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const mockRemoveEventListener = vi.fn();
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: mockRemoveEventListener,
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useIsMobile());

    // When: アンマウント
    unmount();

    // Then: removeEventListenerが呼ばれる
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
});
