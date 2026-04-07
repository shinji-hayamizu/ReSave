import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MobileCardCreate } from '@/components/home/mobile-card-create';

vi.mock('@/hooks/useHomeCards', () => ({
  useHomeCreateCard: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: '1', front: 'test', back: '' }),
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('MobileCardCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FABボタンが表示される', () => {
    // Given: MobileCardCreateコンポーネント

    // When: レンダリング
    render(<MobileCardCreate />, { wrapper: createWrapper() });

    // Then: FABボタンが表示される
    expect(screen.getByRole('button', { name: '新規カード作成' })).toBeInTheDocument();
  });

  it('FABをクリックするとシートが開く', () => {
    // Given: レンダリング済みのMobileCardCreate
    render(<MobileCardCreate />, { wrapper: createWrapper() });

    // When: FABボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '新規カード作成' }));

    // Then: シートが表示状態になる（translate-y-0）
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('translate-y-0');
  });

  it('シートの閉じるボタンでシートが閉じる', () => {
    // Given: シートが開いている状態
    render(<MobileCardCreate />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: '新規カード作成' }));

    // When: 閉じるボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    // Then: シートが非表示状態になる（translate-y-full）
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(dialog.className).toContain('translate-y-full');
  });

  it('FABをクリックすると+アイコンが回転する', () => {
    // Given: レンダリング済みのMobileCardCreate
    render(<MobileCardCreate />, { wrapper: createWrapper() });

    // When: FABボタンをクリック
    const fab = screen.getByRole('button', { name: '新規カード作成' });
    fireEvent.click(fab);

    // Then: rotate-45クラスが適用される
    expect(fab.className).toContain('rotate-45');
  });
});
