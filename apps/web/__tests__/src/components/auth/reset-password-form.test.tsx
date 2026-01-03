import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

describe('ResetPasswordForm', () => {
  const mockResetPasswordForEmail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000' },
      writable: true,
    });

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    });
  });

  it('フォームをレンダリングする', () => {
    // Given: ResetPasswordForm

    // When: レンダリング
    render(<ResetPasswordForm />);

    // Then: フォーム要素が表示される
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'リセットリンクを送信' })
    ).toBeInTheDocument();
  });

  it('タイトルと説明が表示される', () => {
    // Given: ResetPasswordForm

    // When: レンダリング
    render(<ResetPasswordForm />);

    // Then: タイトルと説明が表示される
    expect(screen.getByText('パスワードリセット')).toBeInTheDocument();
    expect(
      screen.getByText('登録済みのメールアドレスを入力してください')
    ).toBeInTheDocument();
  });

  it('ログインに戻るリンクが表示される', () => {
    // Given: ResetPasswordForm

    // When: レンダリング
    render(<ResetPasswordForm />);

    // Then: ログインに戻るリンクが表示される
    expect(screen.getByText('ログインに戻る')).toHaveAttribute('href', '/login');
  });

  it('メールアドレスが空の場合にバリデーションエラーを表示する', async () => {
    // Given: ResetPasswordForm
    const user = userEvent.setup();

    // When: 空のまま送信
    render(<ResetPasswordForm />);
    await user.click(
      screen.getByRole('button', { name: 'リセットリンクを送信' })
    );

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('メールアドレスを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('不正なメールアドレスの場合にバリデーションエラーを表示する', async () => {
    // Given: 不正なメールアドレス
    const user = userEvent.setup();
    render(<ResetPasswordForm />);
    await user.type(screen.getByLabelText('メールアドレス'), 'invalid-email');

    // When: 送信
    const form = screen
      .getByRole('button', { name: 'リセットリンクを送信' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(
        screen.getByText('有効なメールアドレスを入力してください')
      ).toBeInTheDocument();
    });
  });

  it('送信成功時に完了画面を表示する', async () => {
    // Given: 送信が成功する
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    // When: 有効なメールアドレスで送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );

    const form = screen
      .getByRole('button', { name: 'リセットリンクを送信' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: 完了画面が表示される
    await waitFor(() => {
      expect(screen.getByText('メールを送信しました')).toBeInTheDocument();
      expect(
        screen.getByText(/パスワードリセット用のメールを送信しました/)
      ).toBeInTheDocument();
    });
  });

  it('完了画面にログインに戻るリンクが表示される', async () => {
    // Given: 送信が成功する
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    // When: 有効なメールアドレスで送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );

    const form = screen
      .getByRole('button', { name: 'リセットリンクを送信' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: ログインに戻るリンクが表示される
    await waitFor(() => {
      expect(screen.getByText('ログインに戻る')).toHaveAttribute(
        'href',
        '/login'
      );
    });
  });

  it('送信中はボタンが無効化される', async () => {
    // Given: 送信処理中
    let resolveReset: (value: { error: null }) => void;
    mockResetPasswordForEmail.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveReset = resolve;
        })
    );
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    // When: 送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );

    const form = screen
      .getByRole('button', { name: 'リセットリンクを送信' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: ボタンが無効化される
    await waitFor(() => {
      expect(screen.getByText('送信中...')).toBeInTheDocument();
    });

    resolveReset!({ error: null });
  });

  it('resetPasswordForEmailが正しいパラメータで呼ばれる', async () => {
    // Given: ResetPasswordForm
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<ResetPasswordForm />);

    // When: 送信
    await user.type(
      screen.getByLabelText('メールアドレス'),
      'test@example.com'
    );

    const form = screen
      .getByRole('button', { name: 'リセットリンクを送信' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: 正しいパラメータで呼ばれる
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'http://localhost:3000/auth/callback?next=/update-password',
        }
      );
    });
  });
});
