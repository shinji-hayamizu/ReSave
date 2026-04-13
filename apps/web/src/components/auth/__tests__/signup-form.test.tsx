import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { SignupForm } from '../signup-form';

const mockSignUp = vi.fn();
const mockSignInWithOAuth = vi.fn();
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
        signInWithOAuth: mockSignInWithOAuth,
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
      // Given: 登録が成功する状態（identitiesが存在し空でない）
      mockSignUp.mockResolvedValue({ data: { user: { identities: [{ id: '1' }] } }, error: null });
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

    it('不明なエラー時に汎用登録失敗メッセージが表示される', async () => {
      // Given: 未知のエラーコードが返る状態
      mockSignUp.mockResolvedValue({
        error: { code: 'unknown_error', message: 'Registration failed' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: 汎用エラーメッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('登録に失敗しました。しばらくしてから再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('user_already_existsエラー時にメールアドレス重複メッセージが表示される', async () => {
      // Given: user_already_existsコードのエラーが返る状態
      mockSignUp.mockResolvedValue({
        error: { code: 'user_already_exists', message: 'User already registered' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 登録済みメールアドレスで送信
      await user.type(screen.getByLabelText('メールアドレス'), 'existing@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: メールアドレス重複メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('このメールアドレスはすでに登録されています')
        ).toBeInTheDocument();
      });
    });

    it('identitiesが空の場合にメールアドレス重複メッセージが表示される', async () => {
      // Given: signUpが成功するがidentitiesが空の状態（既登録ユーザーの別パターン）
      mockSignUp.mockResolvedValue({
        data: { user: { identities: [] } },
        error: null,
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 登録済みメールアドレスで送信
      await user.type(screen.getByLabelText('メールアドレス'), 'existing@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: メールアドレス重複メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('このメールアドレスはすでに登録されています')
        ).toBeInTheDocument();
      });
    });

    it('weak_passwordエラー時にパスワード強度メッセージが表示される', async () => {
      // Given: weak_passwordコードのエラーが返る状態
      mockSignUp.mockResolvedValue({
        error: { code: 'weak_password', message: 'Password is too weak' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 弱いパスワードで送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: パスワード強度不足メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('パスワードが弱すぎます。8文字以上の英数字混在にしてください')
        ).toBeInTheDocument();
      });
    });

    it('email_rate_limit_exceededエラー時にレート制限メッセージが表示される', async () => {
      // Given: email_rate_limit_exceededコードのエラーが返る状態
      mockSignUp.mockResolvedValue({
        error: { code: 'email_rate_limit_exceeded', message: 'Rate limit exceeded' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 登録を試みる
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: レート制限メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('しばらく時間をおいてから再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('status 429エラー時にレート制限メッセージが表示される', async () => {
      // Given: status 429のエラーが返る状態
      mockSignUp.mockResolvedValue({
        error: { status: 429, message: 'Too many requests' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 登録を試みる
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: レート制限メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('しばらく時間をおいてから再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('email_provider_disabledエラー時にメール認証無効メッセージが表示される', async () => {
      // Given: email_provider_disabledコードのエラーが返る状態
      mockSignUp.mockResolvedValue({
        error: { code: 'email_provider_disabled', message: 'Email provider is disabled' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: 登録を試みる
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');
      await user.click(screen.getByRole('button', { name: '新規登録' }));

      // Then: メール認証無効メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('メール認証が無効です。管理者にお問い合わせください')
        ).toBeInTheDocument();
      });
    });

    it('Googleで登録ボタンクリックでsignInWithOAuthが呼ばれる', async () => {
      // Given: signInWithOAuthが成功する状態
      mockSignInWithOAuth.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: Googleで登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: /Googleで登録/i }));

      // Then: signInWithOAuthがgoogleプロバイダーで呼ばれる
      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: expect.objectContaining({
            redirectTo: expect.stringContaining('/auth/callback'),
          }),
        });
      });
    });

    it('Google登録失敗時にエラーメッセージが表示される', async () => {
      // Given: signInWithOAuthが失敗する状態
      mockSignInWithOAuth.mockResolvedValue({
        error: { message: 'OAuth error' },
      });
      const user = userEvent.setup();
      render(<SignupForm />);

      // When: Googleで登録ボタンをクリック
      await user.click(screen.getByRole('button', { name: /Googleで登録/i }));

      // Then: エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByText('Googleでの登録に失敗しました')).toBeInTheDocument();
      });
    });

    it('登録処理中はボタンが無効化される', async () => {
      // Given: 登録が遅延する状態
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: { identities: [{ id: '1' }] } }, error: null }), 100))
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
