import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppHeader } from '@/components/layout/app-header';

const mockToggleSidebar = vi.fn();

vi.mock('@/components/ui/sidebar', () => ({
  useSidebar: () => ({
    toggleSidebar: mockToggleSidebar,
    isMobile: true,
    isTablet: false,
  }),
}));

vi.mock('@/components/cards/create-card-dialog', () => ({
  CreateCardDialog: () => <div data-testid="create-card-dialog">CreateCardDialog</div>,
}));

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('アプリ名「ReSave」を表示する', () => {
    // Given: AppHeaderコンポーネント

    // When: レンダリング
    render(<AppHeader />);

    // Then: アプリ名が表示される
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ReSave');
  });

  it('メニューボタンをクリックするとtoggleSidebarが呼ばれる', () => {
    // Given: AppHeaderコンポーネント
    render(<AppHeader />);

    // When: メニューボタンをクリック
    const menuButton = screen.getByRole('button', { name: 'Toggle menu' });
    fireEvent.click(menuButton);

    // Then: toggleSidebarが呼ばれる
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('CreateCardDialogを表示する', () => {
    // Given: AppHeaderコンポーネント

    // When: レンダリング
    render(<AppHeader />);

    // Then: CreateCardDialogが表示される
    expect(screen.getByTestId('create-card-dialog')).toBeInTheDocument();
  });

  it('headerタグでレンダリングされる', () => {
    // Given: AppHeaderコンポーネント

    // When: レンダリング
    render(<AppHeader />);

    // Then: header要素が存在する
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('stickyポジションのスタイルが適用される', () => {
    // Given: AppHeaderコンポーネント

    // When: レンダリング
    render(<AppHeader />);

    // Then: sticky classが適用される
    expect(screen.getByRole('banner')).toHaveClass('sticky', 'top-0');
  });
});
