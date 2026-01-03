import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResetPasswordForm } from '../reset-password-form';

const mockResetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  describe('レンダリング', () => {
    it('パスワードリセットフォームが表示される', () => {
      render(<ResetPasswordForm />);

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
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      await waitFor(() => {
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
      });
    });

    it('不正な形式のメールアドレスでエラーが表示される', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      const emailInput = screen.getByLabelText('メールアドレス');
      // test@test はHTML5のemail validationは通るがZodのemail()は通らない（TLD必須）
      await user.type(emailInput, 'test@test');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      await waitFor(() => {
        expect(
          screen.getByText('有効なメールアドレスを入力してください')
        ).toBeInTheDocument();
      });
    });
  });

  describe('リセット処理', () => {
    it('リセット成功時に送信完了画面が表示される', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      await waitFor(() => {
        expect(screen.getByText('メールを送信しました')).toBeInTheDocument();
        expect(
          screen.getByText(/パスワードリセット用のメールを送信しました/)
        ).toBeInTheDocument();
      });
    });

    it('Supabaseに正しいリダイレクトURLが渡される', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
          redirectTo: 'http://localhost:3000/auth/callback?next=/update-password',
        });
      });
    });

    it('送信処理中はボタンが無効化される', async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const user = userEvent.setup();
      render(<ResetPasswordForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

      expect(screen.getByRole('button', { name: '送信中...' })).toBeDisabled();
    });
  });
});
