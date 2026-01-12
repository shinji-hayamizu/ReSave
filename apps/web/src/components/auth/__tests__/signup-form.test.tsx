import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { SignupForm } from '../signup-form';

const mockSignUp = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

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
        signUp: mockSignUp,
        getUser: vi.fn(),
        signInWithPassword: vi.fn(),
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
    it('新規登録フォームが表示される', () => {
      // Given: SignupFormコンポーネント
      // When: レンダリング
      render(<SignupForm />);

      // Then: フォーム要素が表示される
      expect(screen.getAllByText('新規登録')).toHaveLength(2);
      expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
      expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument();
      expect(screen.getByText('ログイン')).toBeInTheDocument();
    });

    it('パスワード要件が表示される', () => {
      // Given: SignupFormコンポーネント
      // When: レンダリング
      render(<SignupForm />);

      // Then: パスワード要件が表示される
      expect(screen.getByText('8文字以上、英字と数字を含む')).toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('空のフォーム送信でバリデーションエラーが表示される', async () => {
      // Given: 空のフォーム
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 送信ボタンをクリック
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
      });
    });

    it('パスワードが一致しない場合エラーが表示される', async () => {
      // Given: パスワードが一致しないフォーム
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 異なるパスワードを入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password456');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
      });
    });

    it('パスワードが要件を満たさない場合エラーが表示される', async () => {
      // Given: 要件を満たさないパスワード
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 短いパスワードを入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'short');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'short');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: バリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument();
      });
    });
  });

  describe('登録処理', () => {
    it('登録成功時に確認メール送信画面が表示される', async () => {
      // Given: 登録が成功する状態
      mockSignUp.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 有効な認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: 確認メール送信画面が表示される
      await waitFor(() => {
        expect(screen.getByText('確認メールを送信しました')).toBeInTheDocument();
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      });
    });

    it('登録失敗時にエラーメッセージが表示される', async () => {
      // Given: 登録が失敗する状態
      mockSignUp.mockResolvedValue({
        error: { message: 'Registration failed' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: エラーメッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('登録に失敗しました。しばらくしてから再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('登録処理中はボタンが無効化される', async () => {
      // Given: 登録が遅延する状態
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 有効な認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: ボタンが無効化される
      expect(screen.getByRole('button', { name: '登録中...' })).toBeDisabled();
    });
  });
});
