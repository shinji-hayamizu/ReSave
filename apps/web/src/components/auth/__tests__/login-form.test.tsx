import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { LoginForm } from '../login-form';

const mockSignInWithPassword = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
        signInWithPassword: mockSignInWithPassword,
        getUser: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  describe('レンダリング', () => {
    it('ログインフォームが表示される', () => {
      // Given: LoginFormコンポーネント
      // When: レンダリング
      render(<LoginForm />);

      // Then: フォーム要素が表示される
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
      // Given: 空のフォーム
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 送信ボタンをクリック
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
        expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
      });
    });

    it('不正なメールアドレス形式でエラーが表示される', async () => {
      // Given: 不正な形式のメールアドレス
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 不正なメールアドレスを入力して送信
      const emailInput = screen.getByLabelText('メールアドレス');
      await user.type(emailInput, 'test@test');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(
          screen.getByText('有効なメールアドレスを入力してください')
        ).toBeInTheDocument();
      });
    });
  });

  describe('ログイン処理', () => {
    it('ログイン成功時にホームへリダイレクトする', async () => {
      // Given: ログインが成功する状態
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 有効な認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: 認証APIが呼ばれ、ホームにリダイレクトされる
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
      // Given: ログインが失敗する状態
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid credentials' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 無効な認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: エラーメッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('メールアドレスまたはパスワードが正しくありません')
        ).toBeInTheDocument();
      });
    });

    it('ログイン処理中はボタンが無効化される', async () => {
      // Given: ログインが遅延する状態
      mockSignInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 有効な認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: ボタンが無効化される
      expect(screen.getByRole('button', { name: 'ログイン中...' })).toBeDisabled();
    });
  });
});
