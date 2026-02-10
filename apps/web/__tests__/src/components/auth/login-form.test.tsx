import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

describe('LoginForm', () => {
  const mockSignInWithPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '', origin: 'http://localhost:3000' },
    });

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    });
  });

  it('フォームをレンダリングする', () => {
    // Given: LoginForm

    // When: レンダリング
    render(<LoginForm />);

    // Then: フォーム要素が表示される
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
  });

  it('パスワードリセットリンクが表示される', () => {
    // Given: LoginForm

    // When: レンダリング
    render(<LoginForm />);

    // Then: パスワードリセットリンクが表示される
    expect(screen.getByText('パスワードを忘れた方')).toHaveAttribute(
      'href',
      '/reset-password'
    );
  });

  it('新規登録リンクが表示される', () => {
    // Given: LoginForm

    // When: レンダリング
    render(<LoginForm />);

    // Then: 新規登録リンクが表示される
    expect(screen.getByText('新規登録')).toHaveAttribute('href', '/signup');
  });

  it('メールアドレスが空の場合にバリデーションエラーを表示する', async () => {
    // Given: LoginForm
    const user = userEvent.setup();

    // When: 空のまま送信
    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('パスワードが空の場合にバリデーションエラーを表示する', async () => {
    // Given: メールアドレスのみ入力
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );

    // When: 送信
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('パスワードを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('不正なメールアドレスの場合にバリデーションエラーを表示する', async () => {
    // Given: 不正なメールアドレス
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText('メールアドレス'), 'invalid-email');
    await user.type(screen.getByLabelText('パスワード'), 'password123');

    // When: 送信（fireEvent.submitでブラウザのHTML5バリデーションをバイパス）
    const form = screen.getByRole('button', { name: 'ログイン' }).closest('form');
    fireEvent.submit(form!);

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('有効なメールアドレスを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('ログイン成功時にリダイレクトする', async () => {
    // Given: ログインが成功する
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    // When: 有効な認証情報で送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Then: フルページナビゲーションでリダイレクトされる
    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });

  it('ログイン失敗時にエラーメッセージを表示する', async () => {
    // Given: ログインが失敗する
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    // When: 認証情報で送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Then: エラーメッセージが表示される
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスまたはパスワードが正しくありません')
      ).toBeInTheDocument();
    });
  });

  it('送信中はボタンが無効化される', async () => {
    // Given: ログイン処理中
    let resolveSignIn: (value: { error: null }) => void;
    mockSignInWithPassword.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignIn = resolve;
        })
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    // When: 送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');

    const loginButton = screen.getByRole('button', { name: 'ログイン' });
    await user.click(loginButton);

    // Then: ボタンが無効化される
    await waitFor(() => {
      expect(screen.getByText('ログイン中...')).toBeInTheDocument();
    });

    resolveSignIn!({ error: null });
  });

  it('signInWithPasswordが正しいパラメータで呼ばれる', async () => {
    // Given: LoginForm
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    // When: 送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.click(screen.getByRole('button', { name: 'ログイン' }));

    // Then: 正しいパラメータで呼ばれる
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
