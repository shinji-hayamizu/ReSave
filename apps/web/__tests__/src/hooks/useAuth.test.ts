import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

describe('useAuth', () => {
  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
  };

  const mockGetUser = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        onAuthStateChange: mockOnAuthStateChange,
      },
    });
  });

  it('初期状態ではloadingがtrueでuserがnull', async () => {
    // Given: getUserが遅延して解決する
    mockGetUser.mockReturnValue(new Promise(() => {}));

    // When: フックをレンダリング
    const { result } = renderHook(() => useAuth());

    // Then: 初期状態が正しい
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('認証済みユーザーが存在する場合にユーザー情報を返す', async () => {
    // Given: 認証済みユーザーが存在
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // When: フックをレンダリング
    const { result } = renderHook(() => useAuth());

    // Then: ユーザー情報が設定される
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('未認証の場合にuserがnullを返す', async () => {
    // Given: 未認証状態
    mockGetUser.mockResolvedValue({ data: { user: null } });

    // When: フックをレンダリング
    const { result } = renderHook(() => useAuth());

    // Then: userがnull
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  it('onAuthStateChangeが登録される', async () => {
    // Given: 認証済みユーザー
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // When: フックをレンダリング
    renderHook(() => useAuth());

    // Then: onAuthStateChangeが呼ばれる
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });

  it('アンマウント時にsubscriptionがunsubscribeされる', async () => {
    // Given: 認証済みユーザー
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    // When: フックをレンダリングしてアンマウント
    const { unmount } = renderHook(() => useAuth());
    unmount();

    // Then: unsubscribeが呼ばれる
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('認証状態変更時にユーザー情報が更新される', async () => {
    // Given: 初期状態は未認証
    mockGetUser.mockResolvedValue({ data: { user: null } });
    let authStateCallback: (event: string, session: { user: typeof mockUser } | null) => void;
    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });

    // When: フックをレンダリング
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Then: 認証状態変更をシミュレート
    authStateCallback!('SIGNED_IN', { user: mockUser });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('ログアウト時にuserがnullになる', async () => {
    // Given: 初期状態は認証済み
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    let authStateCallback: (event: string, session: null) => void;
    mockOnAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });

    // When: フックをレンダリング
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });

    // Then: ログアウトをシミュレート
    authStateCallback!('SIGNED_OUT', null);

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });
});
