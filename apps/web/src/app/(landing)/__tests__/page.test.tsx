import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import LandingPage from '../page';

vi.mock('@/components/icons/resave-icon', () => ({
  ReSaveIcon: ({ size }: { size?: number }) => <svg data-testid="resave-icon" data-size={size} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    asChild,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: unknown;
  }) => (asChild ? <>{children}</> : <button type="button" {...props}>{children}</button>),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('LandingPage', () => {
  it('ヒーローセクションのキャッチコピーが表示される', () => {
    // Given: LandingPageコンポーネント

    // When: レンダリング
    render(<LandingPage />);

    // Then: メインキャッチコピーが表示される
    expect(screen.getByText(/忘却曲線に基づいた/)).toBeInTheDocument();
    expect(screen.getByText(/記憶に残る学習カード/)).toBeInTheDocument();
  });

  it('無料で始めるリンクが /signup を指している', () => {
    // Given: LandingPageコンポーネント

    // When: レンダリング
    render(<LandingPage />);

    // Then: 無料で始めるリンクが /signup を指している
    const signupLinks = screen.getAllByRole('link', { name: /無料で始める/ });
    expect(signupLinks[0]).toHaveAttribute('href', '/signup');
  });

  it('ログインリンクが /login を指している', () => {
    // Given: LandingPageコンポーネント

    // When: レンダリング
    render(<LandingPage />);

    // Then: ログインリンクが /login を指している
    const loginLinks = screen.getAllByRole('link', { name: /ログイン/ });
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });

  it('特徴セクションが3件表示される', () => {
    // Given: LandingPageコンポーネント

    // When: レンダリング
    render(<LandingPage />);

    // Then: 3つの特徴が表示される
    expect(screen.getByText('科学的な復習タイミング')).toBeInTheDocument();
    expect(screen.getByText('URLも一緒に保存')).toBeInTheDocument();
    expect(screen.getByText('シンプルな操作性')).toBeInTheDocument();
  });

  it('使い方セクションの3ステップが表示される', () => {
    // Given: LandingPageコンポーネント

    // When: レンダリング
    render(<LandingPage />);

    // Then: 3ステップが表示される
    expect(screen.getByText('カードを作成する')).toBeInTheDocument();
    expect(screen.getByText('毎日の復習をこなす')).toBeInTheDocument();
    expect(screen.getByText('記憶に定着させる')).toBeInTheDocument();
  });

  it('CTAセクションに無料登録するリンクが表示される', () => {
    // Given: LandingPageコンポーネント

    // When: レンダリング
    render(<LandingPage />);

    // Then: 無料登録するリンクが /signup を指している
    const ctaLink = screen.getByRole('link', { name: '無料登録する' });
    expect(ctaLink).toHaveAttribute('href', '/signup');
  });
});
