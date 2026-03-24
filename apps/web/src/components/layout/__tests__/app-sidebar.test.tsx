import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';

const mockToggleSidebar = vi.fn();
const mockSetOpenMobile = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
}));

vi.mock('@/components/ui/sidebar', () => ({
  useSidebar: vi.fn(() => ({
    toggleSidebar: mockToggleSidebar,
    setOpenMobile: mockSetOpenMobile,
    isMobile: false,
    isTablet: false,
  })),
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <nav data-testid="sidebar">{children}</nav>
  ),
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <ul>{children}</ul>,
  SidebarMenuButton: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) =>
    asChild ? <>{children}</> : <button type="button">{children}</button>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <li>{children}</li>,
}));

vi.mock('@/components/icons/resave-icon', () => ({
  ReSaveIcon: () => <svg data-testid="resave-icon" />,
}));

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSidebar).mockReturnValue({
      toggleSidebar: mockToggleSidebar,
      setOpenMobile: mockSetOpenMobile,
      isMobile: false,
      isTablet: false,
    } as unknown as ReturnType<typeof useSidebar>);
  });

  it('ナビゲーションリンクが全件表示される', () => {
    // Given: AppSidebarコンポーネント

    // When: レンダリング
    render(<AppSidebar />);

    // Then: 全ナビリンクが表示される
    expect(screen.getByRole('link', { name: /ホーム/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /完了/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /タグ/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /設定/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /About/ })).toBeInTheDocument();
  });

  it('PC環境でナビリンクをクリックしても setOpenMobile は呼ばれない', () => {
    // Given: PC環境（isMobile=false, isTablet=false）
    vi.mocked(useSidebar).mockReturnValue({
      toggleSidebar: mockToggleSidebar,
      setOpenMobile: mockSetOpenMobile,
      isMobile: false,
      isTablet: false,
    } as unknown as ReturnType<typeof useSidebar>);
    render(<AppSidebar />);

    // When: ナビリンクをクリック
    fireEvent.click(screen.getByRole('link', { name: /ホーム/ }));

    // Then: setOpenMobile は呼ばれない
    expect(mockSetOpenMobile).not.toHaveBeenCalled();
  });

  it('モバイル環境でナビリンクをクリックすると setOpenMobile(false) が呼ばれる', () => {
    // Given: モバイル環境（isMobile=true）
    vi.mocked(useSidebar).mockReturnValue({
      toggleSidebar: mockToggleSidebar,
      setOpenMobile: mockSetOpenMobile,
      isMobile: true,
      isTablet: false,
    } as unknown as ReturnType<typeof useSidebar>);
    render(<AppSidebar />);

    // When: ナビリンクをクリック
    fireEvent.click(screen.getByRole('link', { name: /ホーム/ }));

    // Then: setOpenMobile(false) が呼ばれてサイドバーが閉じる
    expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
  });

  it('タブレット環境でナビリンクをクリックすると setOpenMobile(false) が呼ばれる', () => {
    // Given: タブレット環境（isTablet=true）
    vi.mocked(useSidebar).mockReturnValue({
      toggleSidebar: mockToggleSidebar,
      setOpenMobile: mockSetOpenMobile,
      isMobile: false,
      isTablet: true,
    } as unknown as ReturnType<typeof useSidebar>);
    render(<AppSidebar />);

    // When: ナビリンクをクリック
    fireEvent.click(screen.getByRole('link', { name: /完了/ }));

    // Then: setOpenMobile(false) が呼ばれてサイドバーが閉じる
    expect(mockSetOpenMobile).toHaveBeenCalledWith(false);
  });

  it('Toggle sidebarボタンをクリックするとtoggleSidebarが呼ばれる', () => {
    // Given: AppSidebarコンポーネント
    render(<AppSidebar />);

    // When: Toggle sidebarボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'Toggle sidebar' }));

    // Then: toggleSidebarが呼ばれる
    expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
  });
});
