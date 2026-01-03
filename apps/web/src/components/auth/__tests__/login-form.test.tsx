import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '../login-form';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignInWithPassword = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('ログインフォームが表示される', () => {
      render(<LoginForm />);

      expect(screen.getAllByText('ログイン')).toHaveLength(2);
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
      expect(screen.getByText('パスワードを忘れた方')).toBeInTheDocument();
      expect(screen.getByText('新規登録')).toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('空のフォーム送信でバリデーションエラーが表示される', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      await waitFor(() => {
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
        expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
      });
    });

    it(
      '不正なメールアドレス形式でエラーが表示される',
      async () => {
        const user = userEvent.setup();
        render(<LoginForm />);

        const emailInput = screen.getByLabelText('メールアドレス');
        await user.type(emailInput, 'invalid-email');
        await user.type(screen.getByLabelText('パスワード'), 'password123');
        await user.click(screen.getByRole('button', { name: 'ログイン' }));

        await waitFor(
          () => {
            expect(
              screen.getByText('有効なメールアドレスを入力してください')
            ).toBeInTheDocument();
          },
          { timeout: 10000 }
        );
      },
      15000
    );
  });

  describe('ログイン処理', () => {
    it('ログイン成功時にホームへリダイレクトする', async () => {
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(mockPush).toHaveBeenCalledWith('/');
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('ログイン失敗時にエラーメッセージが表示される', async () => {
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      await waitFor(() => {
        expect(
          screen.getByText('メールアドレスまたはパスワードが正しくありません')
        ).toBeInTheDocument();
      });
    });

    it('ログイン処理中はボタンが無効化される', async () => {
      mockSignInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      expect(screen.getByRole('button', { name: 'ログイン中...' })).toBeDisabled();
    });
  });
});
