import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { UpdatePasswordForm } from '../update-password-form';

const mockUpdateUser = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

describe('UpdatePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });

    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: mockRefresh,
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    vi.mocked(createClient).mockReturnValue({
      auth: {
        updateUser: mockUpdateUser,
        getUser: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('レンダリング', () => {
    it('パスワード更新フォームが表示される', () => {
      // Given: UpdatePasswordFormコンポーネント
      // When: レンダリング
      render(<UpdatePasswordForm />);

      // Then: フォーム要素が表示される
      expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument();
      expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'パスワードを更新' })).toBeInTheDocument();
      expect(screen.getByText('8文字以上、英字と数字を含む')).toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('空のフォーム送信でバリデーションエラーが表示される', async () => {
      // Given: 空のフォーム
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<UpdatePasswordForm />);

      // When: 送信ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument();
      });
    });

    it('パスワードが一致しない場合エラーが表示される', async () => {
      // Given: パスワードが一致しないフォーム
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<UpdatePasswordForm />);

      // When: 異なるパスワードを入力して送信
      await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password456');
      await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
      });
    });

    it('パスワードが要件を満たさない場合エラーが表示される', async () => {
      // Given: 要件を満たさないパスワード
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<UpdatePasswordForm />);

      // When: 短いパスワードを入力して送信
      await user.type(screen.getByLabelText('新しいパスワード'), 'short');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'short');
      await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument();
      });
    });
  });

  describe('更新処理', () => {
    it('更新成功時に完了画面が表示される', async () => {
      // Given: 更新が成功する状態
      mockUpdateUser.mockResolvedValue({ error: null });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<UpdatePasswordForm />);

      // When: 有効なパスワードを入力して送信
      await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

      // Then: 完了画面が表示される
      await waitFor(() => {
        expect(screen.getByText('パスワードを更新しました')).toBeInTheDocument();
        expect(screen.getByText('自動的にホームページへ移動します...')).toBeInTheDocument();
        expect(screen.getByText('今すぐホームへ移動')).toBeInTheDocument();
      });
    });

    it('更新成功後にホームへリダイレクトする', async () => {
      // Given: 更新が成功する状態
      mockUpdateUser.mockResolvedValue({ error: null });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<UpdatePasswordForm />);

      // When: 有効なパスワードを入力して送信
      await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

      // Then: 2秒後にホームにリダイレクトされる
      await waitFor(() => {
        expect(screen.getByText('パスワードを更新しました')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('更新失敗時にエラーメッセージが表示される', async () => {
      // Given: 更新が失敗する状態
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Update failed' },
      });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<UpdatePasswordForm />);

      // When: パスワードを入力して送信
      await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

      // Then: エラーメッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('パスワードの更新に失敗しました。再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('更新処理中はボタンが無効化される', async () => {
      // Given: 更新が遅延する状態
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<UpdatePasswordForm />);

      // When: 有効なパスワードを入力して送信
      await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

      // Then: ボタンが無効化される
      expect(screen.getByRole('button', { name: '更新中...' })).toBeDisabled();
    });
  });
});
