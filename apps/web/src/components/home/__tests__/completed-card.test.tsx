import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CompletedCard } from '@/components/home/completed-card';
import type { CardWithTags } from '@/types/card';

const mockMutateAsync = vi.fn();

vi.mock('@/hooks/useHomeCards', () => ({
  useHomeResetCard: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockCard(overrides: Partial<CardWithTags> = {}): CardWithTags {
  return {
    id: 'card-1',
    userId: 'user-1',
    front: 'テスト表面',
    back: 'テスト裏面',
    sourceUrl: null,
    schedule: [1, 3, 7, 14, 30, 180],
    currentStep: 6,
    nextReviewAt: null,
    status: 'completed',
    completedAt: '2026-04-01T10:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    tags: [],
    ...overrides,
  };
}

describe('CompletedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('タグカラー表示', () => {
    it('タグに指定した色のクラスが適用される（green）', () => {
      // Given: green色のタグを持つカード
      const card = createMockCard({
        tags: [{ id: 'tag-1', userId: 'user-1', name: 'Next.js', color: 'green', createdAt: '2026-01-01T00:00:00Z' }],
      });

      // When: レンダリング
      render(<CompletedCard card={card} />);

      // Then: green色のクラスが適用される（bg-green-100）
      const badge = screen.getByText('Next.js');
      expect(badge.className).toContain('bg-green-100');
    });

    it('タグに指定した色のクラスが適用される（purple）', () => {
      // Given: purple色のタグを持つカード
      const card = createMockCard({
        tags: [{ id: 'tag-2', userId: 'user-1', name: 'TypeScript', color: 'purple', createdAt: '2026-01-01T00:00:00Z' }],
      });

      // When: レンダリング
      render(<CompletedCard card={card} />);

      // Then: violet色のクラスが適用される（bg-violet-100）
      const badge = screen.getByText('TypeScript');
      expect(badge.className).toContain('bg-violet-100');
    });

    it('複数タグがそれぞれ正しい色で表示される', () => {
      // Given: 複数色のタグを持つカード
      const card = createMockCard({
        tags: [
          { id: 'tag-1', userId: 'user-1', name: 'React', color: 'blue', createdAt: '2026-01-01T00:00:00Z' },
          { id: 'tag-2', userId: 'user-1', name: 'Design', color: 'pink', createdAt: '2026-01-01T00:00:00Z' },
        ],
      });

      // When: レンダリング
      render(<CompletedCard card={card} />);

      // Then: 各タグが正しい色で表示される
      expect(screen.getByText('React').className).toContain('bg-sky-100');
      expect(screen.getByText('Design').className).toContain('bg-pink-100');
    });

    it('タグなしの場合はタグが表示されない', () => {
      // Given: タグなしカード
      const card = createMockCard({ tags: [] });

      // When: レンダリング
      render(<CompletedCard card={card} />);

      // Then: タグバッジが表示されない
      expect(screen.queryByText('React')).not.toBeInTheDocument();
    });
  });

  describe('完了日表示', () => {
    it('completedAtがある場合は完了日が表示される', () => {
      // Given: 完了日時があるカード
      const card = createMockCard({ completedAt: '2026-04-01T10:00:00Z' });

      // When: レンダリング
      render(<CompletedCard card={card} />);

      // Then: 完了日が表示される
      expect(screen.getByText(/完了: 2026\/4\/1/)).toBeInTheDocument();
    });

    it('completedAtがnullの場合は完了日が表示されない', () => {
      // Given: 完了日時なしカード
      const card = createMockCard({ completedAt: null });

      // When: レンダリング
      render(<CompletedCard card={card} />);

      // Then: 完了日が表示されない
      expect(screen.queryByText(/完了:/)).not.toBeInTheDocument();
    });
  });

  describe('覚え直しボタン', () => {
    it('覚え直しボタンが表示される', () => {
      // Given: 完了カード
      const card = createMockCard();

      // When: レンダリング
      render(<CompletedCard card={card} />);

      // Then: 覚え直しボタンが表示される
      expect(screen.getByRole('button', { name: /覚え直し/ })).toBeInTheDocument();
    });

    it('覚え直しボタンをクリックするとresetCard.mutateAsyncが呼ばれる', async () => {
      // Given: 完了カード
      const card = createMockCard();
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({});

      // When: 覚え直しボタンをクリック
      render(<CompletedCard card={card} />);
      await user.click(screen.getByRole('button', { name: /覚え直し/ }));

      // Then: mutateAsyncが正しい引数で呼ばれる
      expect(mockMutateAsync).toHaveBeenCalledWith({ id: card.id, card });
    });
  });
});
