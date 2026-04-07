import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CreateCardSheet } from '@/components/home/create-card-sheet';

vi.mock('@/hooks/useHomeCards', () => ({
  useHomeCreateCard: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockMutateAsync = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('CreateCardSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: '1', front: 'test', back: '' });
  });

  it('isOpen=falseのときシートが非表示状態になる', () => {
    // Given: isOpen=falseのシート
    const handleClose = vi.fn();

    // When: レンダリング
    render(
      <CreateCardSheet isOpen={false} onClose={handleClose} />,
      { wrapper: createWrapper() }
    );

    // Then: translate-y-fullクラスで非表示状態
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.className).toContain('translate-y-full');
  });

  it('isOpen=trueのときシートが表示される', () => {
    // Given: isOpen=trueのシート
    const handleClose = vi.fn();

    // When: レンダリング
    render(
      <CreateCardSheet isOpen={true} onClose={handleClose} />,
      { wrapper: createWrapper() }
    );

    // Then: translate-y-0クラスで表示状態
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('translate-y-0');
    expect(screen.getByText('新規カード作成')).toBeInTheDocument();
  });

  it('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
    // Given: 開いているシート
    const handleClose = vi.fn();
    render(
      <CreateCardSheet isOpen={true} onClose={handleClose} />,
      { wrapper: createWrapper() }
    );

    // When: 閉じるボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    // Then: onCloseが呼ばれる
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('キャンセルボタンをクリックするとonCloseが呼ばれる', () => {
    // Given: 開いているシート
    const handleClose = vi.fn();
    render(
      <CreateCardSheet isOpen={true} onClose={handleClose} />,
      { wrapper: createWrapper() }
    );

    // When: キャンセルボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));

    // Then: onCloseが呼ばれる
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('frontが空のとき保存ボタンが無効になる', () => {
    // Given: 開いているシート
    const handleClose = vi.fn();
    render(
      <CreateCardSheet isOpen={true} onClose={handleClose} />,
      { wrapper: createWrapper() }
    );

    // When: frontが空の状態
    // Then: 保存ボタンがdisabled
    expect(screen.getByRole('button', { name: '保存' })).toBeDisabled();
  });

  it('frontを入力すると保存ボタンが有効になる', () => {
    // Given: 開いているシート
    const handleClose = vi.fn();
    render(
      <CreateCardSheet isOpen={true} onClose={handleClose} />,
      { wrapper: createWrapper() }
    );

    // When: frontにテキストを入力
    fireEvent.change(screen.getByPlaceholderText('例: 日本の首都は？'), {
      target: { value: 'テスト問題' },
    });

    // Then: 保存ボタンが有効になる
    expect(screen.getByRole('button', { name: '保存' })).not.toBeDisabled();
  });

  it('フォーム送信するとカードが作成されシートが閉じる', async () => {
    // Given: frontにテキストが入力されたシート
    const handleClose = vi.fn();
    const handleCardCreated = vi.fn();
    render(
      <CreateCardSheet
        isOpen={true}
        onCardCreated={handleCardCreated}
        onClose={handleClose}
      />,
      { wrapper: createWrapper() }
    );

    fireEvent.change(screen.getByPlaceholderText('例: 日本の首都は？'), {
      target: { value: 'テスト問題' },
    });
    fireEvent.change(screen.getByPlaceholderText('例: 東京'), {
      target: { value: 'テスト回答' },
    });

    // When: 保存ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    // Then: mutateAsyncが呼ばれ、onCardCreatedとonCloseが呼ばれる
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        front: 'テスト問題',
        back: 'テスト回答',
      });
      expect(handleCardCreated).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('Escapeキーを押すとonCloseが呼ばれる', () => {
    // Given: 開いているシート
    const handleClose = vi.fn();
    render(
      <CreateCardSheet isOpen={true} onClose={handleClose} />,
      { wrapper: createWrapper() }
    );

    // When: Escapeキーを押す
    fireEvent.keyDown(document, { key: 'Escape' });

    // Then: onCloseが呼ばれる
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
