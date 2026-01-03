import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SignupForm } from '../signup-form';

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignUp = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}));

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });
  });

  describe('レンダリング', () => {
    it('新規登録フォームが表示される', () => {
      render(<SignupForm />);

      expect(screen.getAllByText('新規登録')).toHaveLength(2);
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument();
      expect(screen.getByText('ログイン')).toBeInTheDocument();
    });

    it('パスワード要件が表示される', () => {
      render(<SignupForm />);

      expect(screen.getByText('8文字以上、英字と数字を含む')).toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('空のフォーム送信でバリデーションエラーが表示される', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.click(screen.getByRole('button', { name: '新規登録' }));

      await waitFor(() => {
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
      });
    });

    it('パスワードが一致しない場合エラーが表示される', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password456');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
      });
    });

    it('パスワードが要件を満たさない場合エラーが表示される', async () => {
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'short');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'short');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      await waitFor(() => {
        expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument();
      });
    });
  });

  describe('登録処理', () => {
    it('登録成功時に確認メール送信画面が表示される', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      await waitFor(() => {
        expect(screen.getByText('確認メールを送信しました')).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      });
    });

    it('登録失敗時にエラーメッセージが表示される', async () => {
      mockSignUp.mockResolvedValue({
        error: { message: 'Registration failed' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      await waitFor(() => {
        expect(
          screen.getByText('登録に失敗しました。しばらくしてから再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('登録処理中はボタンが無効化される', async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const user = userEvent.setup();
      render(<SignupForm />);

      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      expect(screen.getByRole('button', { name: '登録中...' })).toBeDisabled();
    });
  });
});
