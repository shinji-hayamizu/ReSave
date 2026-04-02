import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { CardWithTags } from '@/types/card';

const mockUseTodayCompletedCards = vi.fn();

vi.mock('@/hooks/useCards', () => ({
  useTodayCompletedCards: () => mockUseTodayCompletedCards(),
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
    status: 'completed',
    completedAt: '2025-01-01T00:00:00Z',
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
    // Given: データ読み込み完了（完了カードなし）
    mockUseTodayCompletedCards.mockReturnValue({
      data: [],
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
    mockUseTodayCompletedCards.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: スケルトンが表示される
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('完了カードがない場合: 空状態が表示される', async () => {
    // Given: 完了カードなし
    mockUseTodayCompletedCards.mockReturnValue({
      data: [],
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

  it('dataがundefinedの場合: 空状態が表示される', async () => {
    // Given: データがundefined（初期状態）
    mockUseTodayCompletedCards.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: 空状態が表示される
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('完了カードがある場合: CardListに完了カードが渡される', async () => {
    // Given: 完了カード2件
    const completedCard1 = createCard({ id: 'c1' });
    const completedCard2 = createCard({ id: 'c2' });
    mockUseTodayCompletedCards.mockReturnValue({
      data: [completedCard1, completedCard2],
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: CardListに完了カード2件が渡される
    await waitFor(() => {
      expect(screen.getByTestId('card-list')).toHaveTextContent('2 cards');
    });
  });
});
