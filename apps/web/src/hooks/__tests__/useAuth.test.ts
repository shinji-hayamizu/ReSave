import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuth } from '../useAuth';

const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockUnsubscribe = vi.fn();
const mockStartAutoRefresh = vi.fn();
const mockStopAutoRefresh = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
      startAutoRefresh: mockStartAutoRefresh,
      stopAutoRefresh: mockStopAutoRefresh,
    },
  }),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  describe('初期状態', () => {
    it('初期状態はloading=true, user=null', () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
    });
  });

  describe('ユーザー取得', () => {
    it('認証済みユーザーが取得される', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('未認証の場合はuser=null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toBe(null);
      });
    });
  });

  describe('認証状態の変更監視', () => {
    it('onAuthStateChangeが呼び出される', () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      renderHook(() => useAuth());

      expect(mockOnAuthStateChange).toHaveBeenCalled();
    });

    it('認証状態変更時にユーザーが更新される', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({ data: { user: null } });

      let authStateCallback: (event: string, session: { user: typeof mockUser } | null) => void;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        authStateCallback('SIGNED_IN', { user: mockUser });
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('ログアウト時にユーザーがnullになる', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });

      let authStateCallback: (event: string, session: null) => void;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      act(() => {
        authStateCallback('SIGNED_OUT', null);
      });

      expect(result.current.user).toBe(null);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時に購読が解除される', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const { unmount } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(mockOnAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
      expect(mockStopAutoRefresh).toHaveBeenCalled();
    });

    it('マウント時にautoRefreshが開始される', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      renderHook(() => useAuth());

      expect(mockStartAutoRefresh).toHaveBeenCalled();
    });
  });
});
