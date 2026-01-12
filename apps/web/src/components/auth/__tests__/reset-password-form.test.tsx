import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { ResetPasswordForm } from '../reset-password-form';

const mockResetPasswordForEmail = vi.fn();

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        getUser: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateUser: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  describe('レンダリング', () => {
    it('パスワードリセットフォームが表示される', () => {
      // Given: ResetPasswordFormコンポーネント
      // When: レンダリング
      render(<ResetPasswordForm />);

      // Then: フォーム要素が表示される
      expect(screen.getByText('パスワードリセット')).toBeInTheDocument();
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'リセットリンクを送信' })
      ).toBeInTheDocument();
      expect(screen.getByText('ログインに戻る')).toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('空のメールアドレスでエラーが表示される', async () => {
      // Given: 空のフォーム
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      // When: 送信ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
      });
    });

    it('不正な形式のメールアドレスでエラーが表示される', async () => {
      // Given: 不正な形式のメールアドレス
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      // When: 不正なメールアドレスを入力して送信
      const emailInput = screen.getByLabelText('メールアドレス');
      await user.type(emailInput, 'test@test');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(
          screen.getByText('有効なメールアドレスを入力してください')
        ).toBeInTheDocument();
      });
    });
  });

  describe('リセット処理', () => {
    it('リセット成功時に送信完了画面が表示される', async () => {
      // Given: リセットが成功する状態
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      // When: 有効なメールアドレスを入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      // Then: 送信完了画面が表示される
      await waitFor(() => {
        expect(screen.getByText('メールを送信しました')).toBeInTheDocument();
        expect(
          screen.getByText(/パスワードリセット用のメールを送信しました/)
        ).toBeInTheDocument();
      });
    });

    it('Supabaseに正しいリダイレクトURLが渡される', async () => {
      // Given: リセットが成功する状態
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      // When: 有効なメールアドレスを入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      // Then: 正しいリダイレクトURLでAPIが呼ばれる
      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
          redirectTo: 'http://localhost:3000/auth/callback?next=/update-password',
        });
      });
    });

    it('送信処理中はボタンが無効化される', async () => {
      // Given: リセットが遅延する状態
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      // When: 有効なメールアドレスを入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      // Then: ボタンが無効化される
      expect(screen.getByRole('button', { name: '送信中...' })).toBeDisabled();
    });
  });
});
