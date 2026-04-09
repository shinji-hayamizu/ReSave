'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { FileQuestion, RotateCcw } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { EditCardDialog } from '@/components/cards/edit-card-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StudyCard } from '@/components/ui/study-card';
import { TagBadge } from '@/components/ui/tag-badge';
import { useHomeResetCard, useHomeUpdateCard } from '@/hooks/useHomeCards';
import { cn } from '@/lib/utils';
import type { CardWithTags } from '@/types/card';

const VIRTUALIZATION_THRESHOLD = 50;
const ESTIMATED_CARD_HEIGHT = 180;

interface CardListProps {
  cards: CardWithTags[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const CardListSkeleton = memo(function CardListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-card rounded-xl shadow-sm p-4 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
});

interface ResetButtonProps {
  onReset: () => void;
  disabled?: boolean;
}

const ResetButton = memo(function ResetButton({ onReset, disabled }: ResetButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium',
        'transition-colors disabled:opacity-50 disabled:pointer-events-none',
        'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white'
      )}
      onClick={onReset}
    >
      <RotateCcw className="h-4 w-4" />
      <span className="font-semibold">覚え直し</span>
    </button>
  );
});

const CardItem = memo(function CardItem({
  card,
  onReset,
  onEdit,
  onSave,
  isResetting,
}: {
  card: CardWithTags;
  onReset: (card: CardWithTags) => void;
  onEdit: (card: CardWithTags) => void;
  onSave: (id: string, data: { front?: string; back?: string }) => void;
  isResetting: boolean;
}) {
  const tags = useMemo(() => {
    if (card.tags.length === 0) {
      return undefined;
    }
    return (
      <>
        {card.tags.map((tag) => (
          <TagBadge key={tag.id}>{tag.name}</TagBadge>
        ))}
      </>
    );
  }, [card.tags]);

  const handleReset = useCallback(() => {
    onReset(card);
  }, [card, onReset]);

  const handleEdit = useCallback(() => {
    onEdit(card);
  }, [card, onEdit]);

  const handleSave = useCallback(
    (data: { front?: string; back?: string }) => {
      onSave(card.id, data);
    },
    [card.id, onSave]
  );

  return (
    <StudyCard
      answer={card.back}
      currentStep={card.currentStep}
      question={card.front}
      sourceUrl={card.sourceUrl}
      ratingButtons={<ResetButton disabled={isResetting} onReset={handleReset} />}
      tags={tags}
      totalSteps={card.schedule.length}
      onEdit={handleEdit}
      onSave={handleSave}
    />
  );
});

const VirtualizedCardList = memo(function VirtualizedCardList({
  cards,
  className,
  onReset,
  onEdit,
  onSave,
  isResetting,
}: {
  cards: CardWithTags[];
  className?: string;
  onReset: (card: CardWithTags) => void;
  onEdit: (card: CardWithTags) => void;
  onSave: (id: string, data: { front?: string; back?: string }) => void;
  isResetting: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const estimateSize = useCallback(() => ESTIMATED_CARD_HEIGHT, []);

  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 5,
  });

  return (
    <div className={className} data-testid="card-list">
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
      >
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const card = cards[virtualItem.index];
            return (
              <div
                key={card.id}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className="absolute left-0 top-0 w-full pb-4"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <CardItem card={card} isResetting={isResetting} onEdit={onEdit} onReset={onReset} onSave={onSave} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export const CardList = memo(function CardList({
  cards,
  isLoading,
  emptyMessage = 'カードがありません',
  className,
}: CardListProps) {
  const resetCard = useHomeResetCard();
  const updateCard = useHomeUpdateCard();
  const shouldVirtualize = (cards?.length ?? 0) > VIRTUALIZATION_THRESHOLD;
  const [editingCard, setEditingCard] = useState<CardWithTags | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleReset = useCallback(
    async (card: CardWithTags) => {
      try {
        await resetCard.mutateAsync({ id: card.id, card });
        toast.success('カードを未学習に戻しました');
      } catch {
        toast.error('カードのリセットに失敗しました');
      }
    },
    [resetCard]
  );

  const handleEdit = useCallback((card: CardWithTags) => {
    setEditingCard(card);
    setIsEditDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    async (id: string, data: { front?: string; back?: string }) => {
      try {
        await updateCard.mutateAsync({ id, input: data });
        toast.success('カードを更新しました');
      } catch {
        toast.error('カードの更新に失敗しました');
      }
    },
    [updateCard]
  );

  const handleEditDialogClose = useCallback((open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingCard(null);
    }
  }, []);

  if (isLoading) {
    return <CardListSkeleton />;
  }

  if (!cards || cards.length === 0) {
    return (
      <EmptyState
        className={className}
        description={emptyMessage}
        icon={<FileQuestion />}
        title="カードなし"
      />
    );
  }

  if (shouldVirtualize) {
    return (
      <>
        <VirtualizedCardList
          cards={cards}
          className={className}
          isResetting={resetCard.isPending}
          onEdit={handleEdit}
          onReset={handleReset}
          onSave={handleSave}
        />
        <EditCardDialog
          card={editingCard}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
        />
      </>
    );
  }

  return (
    <>
      <div className={className} data-testid="card-list">
        <div className="space-y-4">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isResetting={resetCard.isPending}
              onEdit={handleEdit}
              onReset={handleReset}
              onSave={handleSave}
            />
          ))}
        </div>
      </div>
      <EditCardDialog
        card={editingCard}
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
      />
    </>
  );
});
