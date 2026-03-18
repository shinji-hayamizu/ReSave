import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CardWithTags, HomeCardsData } from '@/types/card';

const mockUseHomeCards = vi.fn();

vi.mock('@/hooks/useHomeCards', () => ({
  useHomeCards: () => mockUseHomeCards(),
}));

vi.mock('@/components/home', () => ({
  CardList: ({ cards }: { cards: CardWithTags[] }) => (
    <div data-testid="card-list">{cards.length} cards</div>
  ),
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

function createHomeCardsData(cards: CardWithTags[], todayStudiedCardIds: string[] = []): HomeCardsData {
  return { cards, todayStudiedCardIds };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

async function renderPage() {
  const DashboardPage = (await import('../page')).default;
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
}

describe('DashboardPage 初期タブ選択', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('復習中カードがある場合: learningタブが初期表示される', async () => {
    // Given: 復習中カードが1件（active + nextReviewAt <= now）
    const todayCard = createCard({
      id: 'today-1',
      status: 'active',
      front: 'review card',
      nextReviewAt: new Date(Date.now() - 60000).toISOString(),
    });
    mockUseHomeCards.mockReturnValue({
      data: createHomeCardsData([todayCard]),
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: learningタブが選択される
    await waitFor(() => {
      const tabs = screen.getByTestId('card-tabs');
      expect(tabs.getAttribute('data-value')).toBe('learning');
    });
  });

  it('復習中カードがない場合: dueタブが初期表示される', async () => {
    // Given: 未学習カードが1件、復習中カードが0件
    const newCard = createCard({ id: 'new-1', status: 'new', front: 'new card' });
    mockUseHomeCards.mockReturnValue({
      data: createHomeCardsData([newCard]),
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: dueタブが選択される
    await waitFor(() => {
      const tabs = screen.getByTestId('card-tabs');
      expect(tabs.getAttribute('data-value')).toBe('due');
    });
  });

  it('全カードが0件の場合: dueタブが初期表示される', async () => {
    // Given: すべてのカードが0件
    mockUseHomeCards.mockReturnValue({
      data: createHomeCardsData([]),
      isLoading: false,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: dueタブが選択される
    await waitFor(() => {
      const tabs = screen.getByTestId('card-tabs');
      expect(tabs.getAttribute('data-value')).toBe('due');
    });
  });

  it('データ読み込み中: スケルトンが表示される', async () => {
    // Given: データがまだ読み込み中
    mockUseHomeCards.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    // When: ページをレンダリング
    await renderPage();

    // Then: スケルトンが表示される
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('復習中タブ表示中に復習中カードが0枚になった場合: dueタブに自動切替される', async () => {
    // Given: 復習中カードが1件ある状態で初期表示
    const todayCard = createCard({
      id: 'today-1',
      status: 'active',
      nextReviewAt: new Date(Date.now() - 60000).toISOString(),
    });
    mockUseHomeCards.mockReturnValue({
      data: createHomeCardsData([todayCard]),
      isLoading: false,
    });

    const { rerender } = await renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('card-tabs').getAttribute('data-value')).toBe('learning');
    });

    // When: 復習中カードが0枚になった（全て復習完了）
    mockUseHomeCards.mockReturnValue({
      data: createHomeCardsData([]),
      isLoading: false,
    });

    const DashboardPage = (await import('../page')).default;
    const queryClient = createQueryClient();
    rerender(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Then: dueタブに自動切替される
    await waitFor(() => {
      expect(screen.getByTestId('card-tabs').getAttribute('data-value')).toBe('due');
    });
  });
});
