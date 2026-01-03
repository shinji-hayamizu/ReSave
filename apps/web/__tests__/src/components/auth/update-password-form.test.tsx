import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdatePasswordForm } from '@/components/auth/update-password-form';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe('UpdatePasswordForm', () => {
  const mockUpdateUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        updateUser: mockUpdateUser,
      },
    });
  });

  it('フォームをレンダリングする', () => {
    // Given: UpdatePasswordForm

    // When: レンダリング
    render(<UpdatePasswordForm />);

    // Then: フォーム要素が表示される
    expect(screen.getByLabelText('新しいパスワード')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード（確認）')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'パスワードを更新' })
    ).toBeInTheDocument();
  });

  it('タイトルと説明が表示される', () => {
    // Given: UpdatePasswordForm

    // When: レンダリング
    render(<UpdatePasswordForm />);

    // Then: タイトルと説明が表示される
    expect(screen.getByText('新しいパスワードを設定')).toBeInTheDocument();
    expect(
      screen.getByText('新しいパスワードを入力してください')
    ).toBeInTheDocument();
  });

  it('パスワード要件の説明が表示される', () => {
    // Given: UpdatePasswordForm

    // When: レンダリング
    render(<UpdatePasswordForm />);

    // Then: パスワード要件が表示される
    expect(screen.getByText('8文字以上、英字と数字を含む')).toBeInTheDocument();
  });

  it('パスワードが空の場合にバリデーションエラーを表示する', async () => {
    // Given: UpdatePasswordForm
    const user = userEvent.setup();

    // When: 空のまま送信
    render(<UpdatePasswordForm />);
    await user.click(screen.getByRole('button', { name: 'パスワードを更新' }));

    // Then: バリデーションエラーが表示される（passwordSchemaは.min(8)を使用）
    await waitFor(() => {
      expect(
        screen.getByText('パスワードは8文字以上で入力してください')
      ).toBeInTheDocument();
    });
  });

  it('パスワードが短い場合にバリデーションエラーを表示する', async () => {
    // Given: 短いパスワード
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText('新しいパスワード'), 'short1');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'short1');

    // When: 送信
    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
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
    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText('新しいパスワード'), '12345678');
    await user.type(screen.getByLabelText('パスワード（確認）'), '12345678');

    // When: 送信
    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
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
    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText('新しいパスワード'), 'abcdefgh');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'abcdefgh');

    // When: 送信
    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
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
    render(<UpdatePasswordForm />);
    await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'different123');

    // When: 送信
    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: バリデーションエラーが表示される
    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    });
  });

  it('更新成功時に完了画面を表示する', async () => {
    // Given: 更新が成功する
    mockUpdateUser.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    // When: 有効なパスワードで送信
    await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: 完了画面が表示される
    await waitFor(() => {
      expect(
        screen.getByText('パスワードを更新しました')
      ).toBeInTheDocument();
      expect(
        screen.getByText('自動的にホームページへ移動します...')
      ).toBeInTheDocument();
    });
  });

  it('完了画面にホームへのリンクが表示される', async () => {
    // Given: 更新が成功する
    mockUpdateUser.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    // When: 有効なパスワードで送信
    await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: ホームへのリンクが表示される
    await waitFor(() => {
      expect(screen.getByText('今すぐホームへ移動')).toHaveAttribute(
        'href',
        '/'
      );
    });
  });


  it('更新失敗時にエラーメッセージを表示する', async () => {
    // Given: 更新が失敗する
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Update failed' },
    });
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    // When: 送信
    await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: エラーメッセージが表示される
    await waitFor(() => {
      expect(
        screen.getByText('パスワードの更新に失敗しました。再度お試しください')
      ).toBeInTheDocument();
    });
  });

  it('送信中はボタンが無効化される', async () => {
    // Given: 更新処理中
    let resolveUpdate: (value: { error: null }) => void;
    mockUpdateUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    // When: 送信
    await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: ボタンが無効化される
    await waitFor(() => {
      expect(screen.getByText('更新中...')).toBeInTheDocument();
    });

    resolveUpdate!({ error: null });
  });

  it('updateUserが正しいパラメータで呼ばれる', async () => {
    // Given: UpdatePasswordForm
    mockUpdateUser.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);

    // When: 送信
    await user.type(screen.getByLabelText('新しいパスワード'), 'password123');
    await user.type(screen.getByLabelText('パスワード（確認）'), 'password123');

    const form = screen
      .getByRole('button', { name: 'パスワードを更新' })
      .closest('form');
    fireEvent.submit(form!);

    // Then: 正しいパラメータで呼ばれる
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'password123',
      });
    });
  });
});
