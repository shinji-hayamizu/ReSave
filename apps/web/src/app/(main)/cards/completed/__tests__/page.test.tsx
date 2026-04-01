import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { CardWithTags } from '@/types/card';

const mockUseHomeCards = vi.fn();

vi.mock('@/hooks/useHomeCards', () => ({
  useHomeCards: () => mockUseHomeCards(),
}));

vi.mock('@/components/home', () => ({
  CardList: ({ cards }: { cards: CardWithTags[] }) => (
    <div data-testid="card-list">{cards.length} cards</div>
  ),
}));

vi.mock('@/components/layout/page-header', () => ({
  PageHeader: ({ title, description }: { title: string; description?: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  ),
}));

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
}));

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

function createCard(overrides: Partial<CardWithTags> = {}): CardWithTags {
  return {
    id: 'card-1',
    userId: 'user-1',
    front: 'front',
    back: 'back',
    schedule: [1, 3, 7, 14, 30, 180],
    currentStep: 0,
    nextReviewAt: null,
    status: 'new',
    completedAt: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    tags: [],
    ...overrides,
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

async function renderPage() {
  const CompletedCardsPage = (await import('../page')).default;
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <CompletedCardsPage />
    </QueryClientProvider>
  );
}

describe('CompletedCardsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('ページヘッダーに「完了」タイトルが表示される', async () => {
    // Given: データ読み込み完了
    mockUseHomeCards.mockReturnValue({
      data: { cards: [], todayStudiedCardIds: [] },
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: ヘッダーに「完了」が表示される
    expect(screen.getByText('完了')).toBeInTheDocument();
    expect(screen.getByText('学習が完了したカード')).toBeInTheDocument();
  });

  it('読み込み中の場合: スケルトンが表示される', async () => {
    // Given: データ読み込み中
    mockUseHomeCards.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: スケルトンが表示される
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('完了カードがない場合: 空状態が表示される', async () => {
    // Given: 完了カードなし（activeカードのみ）
    const activeCard = createCard({ id: 'a1', status: 'active' });
    mockUseHomeCards.mockReturnValue({
      data: { cards: [activeCard], todayStudiedCardIds: [] },
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: 空状態が表示される
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('完了済みカードなし')).toBeInTheDocument();
    });
  });

  it('完了カードがある場合: CardListに完了カードのみ渡される', async () => {
    // Given: 完了カード2件、activeカード1件
    const completedCard1 = createCard({ id: 'c1', status: 'completed' });
    const completedCard2 = createCard({ id: 'c2', status: 'completed' });
    const activeCard = createCard({ id: 'a1', status: 'active' });
    mockUseHomeCards.mockReturnValue({
      data: { cards: [completedCard1, completedCard2, activeCard], todayStudiedCardIds: [] },
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: CardListに完了カード2件のみ渡される
    await waitFor(() => {
      expect(screen.getByTestId('card-list')).toHaveTextContent('2 cards');
    });
  });

  it('newカードは完了カードに含まれない', async () => {
    // Given: newカードのみ
    const newCard = createCard({ id: 'n1', status: 'new' });
    mockUseHomeCards.mockReturnValue({
      data: { cards: [newCard], todayStudiedCardIds: [] },
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: 空状態が表示される
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });
});
