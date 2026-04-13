import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EditCardDialog } from '@/components/cards/edit-card-dialog';
import type { CardWithTags } from '@/types/card';

const mockMutateAsync = vi.fn();

vi.mock('@/hooks/useCards', () => ({
  useUpdateCard: vi.fn(() => ({
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

vi.mock('@/components/cards/tag-selector', () => ({
  TagSelector: vi.fn(({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) => (
    <div data-testid="tag-selector">
      <span data-testid="tag-selector-value">{JSON.stringify(value)}</span>
      <button
        type="button"
        data-testid="clear-tags"
        onClick={() => onChange([])}
      >
        全タグ削除
      </button>
    </div>
  )),
}));

function createMockCard(overrides: Partial<CardWithTags> = {}): CardWithTags {
  return {
    id: 'card-1',
    userId: 'user-1',
    front: 'テスト表面',
    back: 'テスト裏面',
    sourceUrl: null,
    schedule: [1, 3, 7, 14, 30, 180],
    currentStep: 0,
    nextReviewAt: null,
    status: 'new',
    completedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    tags: [],
    ...overrides,
  };
}

describe('EditCardDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  describe('タグ全削除', () => {
    it('全タグを削除して保存すると tagIds: [] が渡される', async () => {
      // Given: 2つのタグ付きカード
      const card = createMockCard({
        tags: [
          { id: 'tag-1', userId: 'user-1', name: 'React', color: 'blue', createdAt: '2026-01-01T00:00:00Z' },
          { id: 'tag-2', userId: 'user-1', name: 'TypeScript', color: 'purple', createdAt: '2026-01-01T00:00:00Z' },
        ],
      });
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      // When: ダイアログを開いて全タグを削除し保存
      render(<EditCardDialog card={card} open={true} onOpenChange={onOpenChange} />);
      await user.click(screen.getByTestId('clear-tags'));

      const saveButtons = screen.getAllByRole('button', { name: /保存/ });
      await user.click(saveButtons[0]);

      // Then: tagIds に空配列が渡される（undefined ではない）
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            id: card.id,
            input: expect.objectContaining({
              tagIds: [],
            }),
          })
        );
      });
    });

    it('タグなしカードを保存すると tagIds: [] が渡される', async () => {
      // Given: タグなしカード
      const card = createMockCard({ tags: [] });
      const user = userEvent.setup();

      // When: そのまま保存
      render(<EditCardDialog card={card} open={true} onOpenChange={vi.fn()} />);
      const saveButtons = screen.getAllByRole('button', { name: /保存/ });
      await user.click(saveButtons[0]);

      // Then: tagIds に空配列が渡される（undefined ではない）
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              tagIds: [],
            }),
          })
        );
      });
    });

    it('タグを保持して保存すると tagIds にタグIDが渡される', async () => {
      // Given: 1つのタグ付きカード
      const card = createMockCard({
        tags: [
          { id: 'tag-1', userId: 'user-1', name: 'React', color: 'blue', createdAt: '2026-01-01T00:00:00Z' },
        ],
      });
      const user = userEvent.setup();

      // When: タグをそのままにして保存
      render(<EditCardDialog card={card} open={true} onOpenChange={vi.fn()} />);
      const saveButtons = screen.getAllByRole('button', { name: /保存/ });
      await user.click(saveButtons[0]);

      // Then: tagIds にタグIDが渡される
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            input: expect.objectContaining({
              tagIds: ['tag-1'],
            }),
          })
        );
      });
    });
  });

  describe('ダイアログの表示', () => {
    it('open=trueのときダイアログが表示される', () => {
      // Given: カードとopen状態
      const card = createMockCard();

      // When: open=trueでレンダリング
      render(<EditCardDialog card={card} open={true} onOpenChange={vi.fn()} />);

      // Then: タイトルが表示される
      expect(screen.getByText('カードを編集')).toBeInTheDocument();
    });

    it('card=nullのときフォームが表示されない', () => {
      // Given: card=null
      // When: レンダリング
      render(<EditCardDialog card={null} open={true} onOpenChange={vi.fn()} />);

      // Then: フォームが表示されない（TagSelectorが表示されない）
      expect(screen.queryByTestId('tag-selector')).not.toBeInTheDocument();
    });
  });
});
