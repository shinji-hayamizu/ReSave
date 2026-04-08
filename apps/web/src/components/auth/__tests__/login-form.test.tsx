import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createClient } from '@/lib/supabase/client';

import { LoginForm } from '../login-form';

const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>
    );

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', origin: 'http://localhost:3000' },
    });

    vi.mocked(createClient).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signInWithOAuth: mockSignInWithOAuth,
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

  describe('OAuth エラーパラメータ', () => {
    it('error=oauth_failedパラメータがある場合エラーメッセージが表示される', async () => {
      // Given: error=oauth_failed クエリパラメータがある状態
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('error=oauth_failed') as unknown as ReturnType<typeof useSearchParams>
      );

      // When: レンダリング
      render(<LoginForm />);

      // Then: Googleログイン失敗メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('Googleログインに失敗しました。もう一度お試しください。')
        ).toBeInTheDocument();
      });
    });

    it('error=oauth_failed以外のパラメータではエラーメッセージが表示されない', () => {
      // Given: 異なるerrorパラメータがある状態
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('error=other') as unknown as ReturnType<typeof useSearchParams>
      );

      // When: レンダリング
      render(<LoginForm />);

      // Then: エラーメッセージが表示されない
      expect(
        screen.queryByText('Googleログインに失敗しました。もう一度お試しください。')
      ).not.toBeInTheDocument();
    });

    it('redirectパラメータがある場合ログイン後にリダイレクトされる', async () => {
      // Given: redirect=/dashboard クエリパラメータがある状態
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('redirect=/dashboard') as unknown as ReturnType<typeof useSearchParams>
      );
      mockSignInWithPassword.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: ログイン
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: redirectパラメータのURLにリダイレクトされる
      await waitFor(() => {
        expect(window.location.href).toBe('/dashboard');
      });
    });
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

    it('Googleログインボタンが表示される', () => {
      // Given: LoginFormコンポーネント
      // When: レンダリング
      render(<LoginForm />);

      // Then: Googleログインボタンが表示される
      expect(screen.getByRole('button', { name: /Googleでログイン/i })).toBeInTheDocument();
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
        expect(window.location.href).toBe('/');
      });
    });

    it('invalid_credentialsエラー時に認証情報不正メッセージが表示される', async () => {
      // Given: invalid_credentialsコードのエラーが返る状態
      mockSignInWithPassword.mockResolvedValue({
        error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 無効な認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: 認証情報不正メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('メールアドレスまたはパスワードが正しくありません')
        ).toBeInTheDocument();
      });
    });

    it('メッセージに"Invalid login credentials"が含まれる場合に認証情報不正メッセージが表示される', async () => {
      // Given: codeなしでmessageに"Invalid login credentials"が含まれるエラー
      mockSignInWithPassword.mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 無効な認証情報を入力して送信
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: 認証情報不正メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('メールアドレスまたはパスワードが正しくありません')
        ).toBeInTheDocument();
      });
    });

    it('user_not_foundエラー時にアカウント未発見メッセージが表示される', async () => {
      // Given: user_not_foundコードのエラーが返る状態
      mockSignInWithPassword.mockResolvedValue({
        error: { code: 'user_not_found', message: 'User not found' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: 存在しないメールアドレスで送信
      await user.type(screen.getByLabelText('メールアドレス'), 'notexist@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: アカウント未発見メッセージが表示される
      await waitFor(() => {
        expect(screen.getByText('アカウントが見つかりません')).toBeInTheDocument();
      });
    });

    it('email_rate_limit_exceededエラー時にレート制限メッセージが表示される', async () => {
      // Given: email_rate_limit_exceededコードのエラーが返る状態
      mockSignInWithPassword.mockResolvedValue({
        error: { code: 'email_rate_limit_exceeded', message: 'Rate limit exceeded' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: ログインを試みる
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: レート制限メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('しばらく時間をおいてから再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('status 429エラー時にレート制限メッセージが表示される', async () => {
      // Given: status 429のエラーが返る状態
      mockSignInWithPassword.mockResolvedValue({
        error: { status: 429, message: 'Too many requests' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: ログインを試みる
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: レート制限メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('しばらく時間をおいてから再度お試しください')
        ).toBeInTheDocument();
      });
    });

    it('不明なエラー時に汎用ログイン失敗メッセージが表示される', async () => {
      // Given: 未知のエラーコードが返る状態
      mockSignInWithPassword.mockResolvedValue({
        error: { code: 'unknown_error', message: 'Something went wrong' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: ログインを試みる
      await user.type(screen.getByLabelText('メールアドレス'), 'test@example.com');
      await user.type(screen.getByLabelText('パスワード'), 'password123');
      await user.click(screen.getByRole('button', { name: 'ログイン' }));

      // Then: 汎用ログイン失敗メッセージが表示される
      await waitFor(() => {
        expect(
          screen.getByText('ログインに失敗しました。しばらくしてから再度お試しください')
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

  describe('Googleログイン', () => {
    it('GoogleログインボタンクリックでsignInWithOAuthが呼ばれる', async () => {
      // Given: signInWithOAuthが成功する状態
      mockSignInWithOAuth.mockResolvedValue({ error: null });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: Googleログインボタンをクリック
      await user.click(screen.getByRole('button', { name: /Googleでログイン/i }));

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

    it('Googleログイン開始失敗時にエラーメッセージが表示される', async () => {
      // Given: signInWithOAuthが失敗する状態
      mockSignInWithOAuth.mockResolvedValue({
        error: { message: 'OAuth error' },
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      // When: Googleログインボタンをクリック
      await user.click(screen.getByRole('button', { name: /Googleでログイン/i }));

      // Then: エラーメッセージが表示される
      await waitFor(() => {
        expect(screen.getByText('Googleログインの開始に失敗しました')).toBeInTheDocument();
      });
    });
  });
});
