import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CardWithTags, HomeCardsPage } from '@/types/card';
import type { InfiniteData } from '@tanstack/react-query';

const mockUseHomeDueCards = vi.fn();
const mockUseHomeLearningCards = vi.fn();
const mockGetTotalFromInfiniteData = vi.fn();

vi.mock('@/hooks/useHomeCards', () => ({
  useHomeDueCards: () => mockUseHomeDueCards(),
  useHomeLearningCards: () => mockUseHomeLearningCards(),
  getTotalFromInfiniteData: (data: InfiniteData<HomeCardsPage> | undefined) => mockGetTotalFromInfiniteData(data),
}));

vi.mock('@/hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: () => { return { current: null }; },
}));

vi.mock('@/components/home', () => ({
  CardTabs: ({
    value,
    onChange,
    counts,
  }: {
    value: string;
    onChange: (v: string) => void;
    counts: { due: number; learning: number };
  }) => (
    <div data-testid="card-tabs" data-value={value}>
      <button data-testid="tab-due" type="button" onClick={() => onChange('due')}>
        due({counts.due})
      </button>
      <button data-testid="tab-learning" type="button" onClick={() => onChange('learning')}>
        learning({counts.learning})
      </button>
    </div>
  ),
  HomeStudyCard: ({ front }: { front: string }) => (
    <div data-testid="study-card">{front}</div>
  ),
  QuickInputForm: () => <div data-testid="quick-input" />,
  LoadMoreIndicator: () => null,
}));

vi.mock('@/components/cards/edit-card-dialog', () => ({
  EditCardDialog: () => null,
}));

vi.mock('@/components/ui/empty-state', () => ({
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
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

function createInfiniteData(cards: CardWithTags[], total?: number): InfiniteData<HomeCardsPage> {
  return {
    pages: [{
      cards,
      todayStudiedCardIds: [],
      fetchedAt: new Date().toISOString(),
      pagination: {
        total: total ?? cards.length,
        limit: 10,
        offset: 0,
        hasMore: false,
      },
    }],
    pageParams: [0],
  };
}

function createInfiniteQueryResult(cards: CardWithTags[], overrides: Record<string, unknown> = {}) {
  const data = createInfiniteData(cards);
  return {
    data,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  };
}

function createLoadingQueryResult() {
  return {
    data: undefined,
    isLoading: true,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

async function renderPage() {
  const { DashboardContent } = await import('../_components/dashboard-content');
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}

describe('DashboardPage 初期タブ選択', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockGetTotalFromInfiniteData.mockImplementation((data: InfiniteData<HomeCardsPage> | undefined) => {
      if (!data || data.pages.length === 0) return 0;
      return data.pages[0].pagination.total;
    });
  });

  it('復習中カードがある場合: learningタブが初期表示される', async () => {
    const todayCard = createCard({
      id: 'today-1',
      status: 'active',
      front: 'review card',
      nextReviewAt: new Date(Date.now() - 60000).toISOString(),
    });
    mockUseHomeDueCards.mockReturnValue(createInfiniteQueryResult([]));
    mockUseHomeLearningCards.mockReturnValue(createInfiniteQueryResult([todayCard]));

    await renderPage();

    await waitFor(() => {
      const tabs = screen.getByTestId('card-tabs');
      expect(tabs.getAttribute('data-value')).toBe('learning');
    });
  });

  it('復習中カードがない場合: dueタブが初期表示される', async () => {
    const newCard = createCard({ id: 'new-1', status: 'new', front: 'new card' });
    mockUseHomeDueCards.mockReturnValue(createInfiniteQueryResult([newCard]));
    mockUseHomeLearningCards.mockReturnValue(createInfiniteQueryResult([]));

    await renderPage();

    await waitFor(() => {
      const tabs = screen.getByTestId('card-tabs');
      expect(tabs.getAttribute('data-value')).toBe('due');
    });
  });

  it('全カードが0件の場合: dueタブが初期表示される', async () => {
    mockUseHomeDueCards.mockReturnValue(createInfiniteQueryResult([]));
    mockUseHomeLearningCards.mockReturnValue(createInfiniteQueryResult([]));

    await renderPage();

    await waitFor(() => {
      const tabs = screen.getByTestId('card-tabs');
      expect(tabs.getAttribute('data-value')).toBe('due');
    });
  });

  it('データ読み込み中: スケルトンが表示される', async () => {
    mockUseHomeDueCards.mockReturnValue(createLoadingQueryResult());
    mockUseHomeLearningCards.mockReturnValue(createLoadingQueryResult());

    await renderPage();

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('データ読み込み中: スケルトンが表示される（activeTabはdue）', async () => {
    mockUseHomeDueCards.mockReturnValue(createLoadingQueryResult());
    mockUseHomeLearningCards.mockReturnValue(createLoadingQueryResult());

    await renderPage();

    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    const tabs = screen.getByTestId('card-tabs');
    expect(tabs.getAttribute('data-value')).toBe('due');
  });

  it('復習中タブ表示中に復習中カードが0枚になった場合: dueタブに自動切替される', async () => {
    const todayCard = createCard({
      id: 'today-1',
      status: 'active',
      nextReviewAt: new Date(Date.now() - 60000).toISOString(),
    });
    mockUseHomeDueCards.mockReturnValue(createInfiniteQueryResult([]));
    mockUseHomeLearningCards.mockReturnValue(createInfiniteQueryResult([todayCard]));

    const { rerender } = await renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('card-tabs').getAttribute('data-value')).toBe('learning');
    });

    mockUseHomeDueCards.mockReturnValue(createInfiniteQueryResult([]));
    mockUseHomeLearningCards.mockReturnValue(createInfiniteQueryResult([]));

    const { DashboardContent } = await import('../_components/dashboard-content');
    const queryClient = createQueryClient();
    rerender(
      <QueryClientProvider client={queryClient}>
        <DashboardContent />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('card-tabs').getAttribute('data-value')).toBe('due');
    });
  });
});
