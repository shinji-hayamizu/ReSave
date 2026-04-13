import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { CardWithTags, CompletedCardsPage } from '@/types/card';

const mockUseCompletedCards = vi.fn();

vi.mock('@/hooks/useCompletedCards', () => ({
  useCompletedCards: () => mockUseCompletedCards(),
}));

vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => ({ current: null }),
}));

vi.mock('@/components/home', () => ({
  CompletedCard: ({ card }: { card: CardWithTags }) => (
    <div data-testid="completed-card">{card.id}</div>
  ),
  LoadMoreIndicator: () => null,
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
    sourceUrl: null,
    schedule: [1, 3, 7, 14, 30, 180],
    currentStep: 6,
    nextReviewAt: null,
    status: 'completed',
    completedAt: '2026-04-02T10:00:00Z',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    tags: [],
    ...overrides,
  };
}

function createInfiniteData(cards: CardWithTags[], hasMore = false) {
  return {
    pages: [{
      cards,
      pagination: { total: cards.length, limit: 10, offset: 0, hasMore },
    } satisfies CompletedCardsPage],
    pageParams: [0],
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
    mockUseCompletedCards.mockReturnValue({
      data: createInfiniteData([]),
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    expect(screen.getByText('完了')).toBeInTheDocument();
    expect(screen.getByText('学習が完了したカード')).toBeInTheDocument();
  });

  it('読み込み中の場合: スケルトンが表示される', async () => {
    mockUseCompletedCards.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('loading-bar')).not.toBeInTheDocument();
  });

  it('リフェッチ中の場合: ローディングバーが表示される', async () => {
    mockUseCompletedCards.mockReturnValue({
      data: createInfiniteData([]),
      isLoading: false,
      isFetching: true,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    expect(screen.getByTestId('loading-bar')).toBeInTheDocument();
  });

  it('リフェッチ中でない場合: ローディングバーが表示されない', async () => {
    mockUseCompletedCards.mockReturnValue({
      data: createInfiniteData([]),
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    expect(screen.queryByTestId('loading-bar')).not.toBeInTheDocument();
  });

  it('完了カードがない場合: 空状態が表示される', async () => {
    mockUseCompletedCards.mockReturnValue({
      data: createInfiniteData([]),
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('完了済みカードなし')).toBeInTheDocument();
    });
  });

  it('dataがundefinedの場合: 空状態が表示される', async () => {
    mockUseCompletedCards.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('完了カードがある場合: CompletedCardが件数分表示される', async () => {
    const card1 = createCard({ id: 'c1' });
    const card2 = createCard({ id: 'c2' });
    mockUseCompletedCards.mockReturnValue({
      data: createInfiniteData([card1, card2]),
      isLoading: false,
      isFetching: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByTestId('completed-card')).toHaveLength(2);
      expect(screen.getByTestId('card-list')).toBeInTheDocument();
    });
  });

  it('次ページ読み込み中の場合: ローディングバーは表示されない', async () => {
    mockUseCompletedCards.mockReturnValue({
      data: createInfiniteData([createCard()], true),
      isLoading: false,
      isFetching: true,
      hasNextPage: true,
      isFetchingNextPage: true,
      fetchNextPage: vi.fn(),
    });

    await renderPage();

    expect(screen.queryByTestId('loading-bar')).not.toBeInTheDocument();
  });
});
