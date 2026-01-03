import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/auth/signup-form';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('SignupForm', () => {
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        signUp: mockSignUp,
      },
    });
  });

  it('フォームをレンダリングする', () => {
    // Given: SignupForm

    // When: レンダリング
    render(<SignupForm />);

    // Then: フォーム要素が表示される
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument();
  });

  it('ログインリンクが表示される', () => {
    // Given: SignupForm

    // When: レンダリング
    render(<SignupForm />);

    // Then: ログインリンクが表示される
    expect(screen.getByText('ログイン')).toHaveAttribute('href', '/login');
  });

  it('パスワード要件の説明が表示される', () => {
    // Given: SignupForm

    // When: レンダリング
    render(<SignupForm />);

    // Then: パスワード要件が表示される
    expect(screen.getByText('8文字以上、英字と数字を含む')).toBeInTheDocument();
  });

  it('メールアドレスが空の場合にバリデーションエラーを表示する', async () => {
    // Given: SignupForm
    const user = userEvent.setup();

    // When: 空のまま送信
    render(<SignupForm />);
    await user.click(screen.getByRole('button', { name: '新規登録' }));

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('パスワードが短い場合にバリデーションエラーを表示する', async () => {
    // Given: 短いパスワード
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'short1');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'short1');

    // When: 送信
    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('パスワードは8文字以上で入力してください')
      ).toBeInTheDocument();
    });
  });

  it('パスワードに英字がない場合にバリデーションエラーを表示する', async () => {
    // Given: 数字のみのパスワード
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), '12345678');
    await user.type(screen.getByLabelText('パスワード（確認）'), '12345678');

    // When: 送信
    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('パスワードは英字と数字を含める必要があります')
      ).toBeInTheDocument();
    });
  });

  it('パスワードに数字がない場合にバリデーションエラーを表示する', async () => {
    // Given: 英字のみのパスワード
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'abcdefgh');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'abcdefgh');

    // When: 送信
    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('パスワードは英字と数字を含める必要があります')
      ).toBeInTheDocument();
    });
  });

  it('パスワードが一致しない場合にバリデーションエラーを表示する', async () => {
    // Given: 一致しないパスワード
    const user = userEvent.setup();
    render(<SignupForm />);
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'different123');

    // When: 送信
    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('パスワードが一致しません')
      ).toBeInTheDocument();
    });
  });

  it('登録成功時に確認メール送信画面を表示する', async () => {
    // Given: 登録が成功する
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SignupForm />);

    // When: 有効な情報で送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: 確認メール送信画面が表示される
    await waitFor(() => {
      expect(screen.getByText('確認メールを送信しました')).toBeInTheDocument();
      expect(
        screen.getByText(/test@example.com に確認メールを送信しました/)
      ).toBeInTheDocument();
    });
  });

  it('登録成功後にログインに戻るリンクが表示される', async () => {
    // Given: 登録が成功する
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SignupForm />);

    // When: 有効な情報で送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: ログインに戻るリンクが表示される
    await waitFor(() => {
      expect(screen.getByText('ログインに戻る')).toHaveAttribute(
        'href',
        '/login'
      );
    });
  });

  it('登録失敗時にエラーメッセージを表示する', async () => {
    // Given: 登録が失敗する
    mockSignUp.mockResolvedValue({
      error: { message: 'User already exists' },
    });
    const user = userEvent.setup();
    render(<SignupForm />);

    // When: 送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: エラーメッセージが表示される
    await waitFor(() => {
      expect(
        screen.getByText('登録に失敗しました。しばらくしてから再度お試しください')
      ).toBeInTheDocument();
    });
  });

  it('送信中はボタンが無効化される', async () => {
    // Given: 登録処理中
    let resolveSignUp: (value: { error: null }) => void;
    mockSignUp.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve;
        })
    );
    const user = userEvent.setup();
    render(<SignupForm />);

    // When: 送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: ボタンが無効化される
    await waitFor(() => {
      expect(screen.getByText('登録中...')).toBeInTheDocument();
    });

    resolveSignUp!({ error: null });
  });

  it('signUpが正しいパラメータで呼ばれる', async () => {
    // Given: SignupForm
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<SignupForm />);

    // When: 送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );
    await user.type(screen.getByLabelText('パスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen.getByRole('button', { name: '新規登録' }).closest('form');
    fireEvent.submit(form!);

    // Then: 正しいパラメータで呼ばれる
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: 'http://localhost:3000/auth/callback',
        },
      });
    });
  });
});
