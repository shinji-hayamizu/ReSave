'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { FileQuestion } from 'lucide-react';
import { memo, useCallback, useMemo, useRef } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StudyCard } from '@/components/ui/study-card';
import { TagBadge } from '@/components/ui/tag-badge';
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

const CardItem = memo(function CardItem({ card }: { card: CardWithTags }) {
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

  return (
    <StudyCard
      answer={card.back}
      question={card.front}
      tags={tags}
    />
  );
});

function VirtualizedCardList({
  cards,
  className,
}: {
  cards: CardWithTags[];
  className?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => ESTIMATED_CARD_HEIGHT, []),
    overscan: 5,
  });

  return (
    <div className={className}>
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
                <CardItem card={card} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const CardList = memo(function CardList({
  cards,
  isLoading,
  emptyMessage = 'カードがありません',
  className,
}: CardListProps) {
  const shouldVirtualize = (cards?.length ?? 0) > VIRTUALIZATION_THRESHOLD;

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
    return <VirtualizedCardList cards={cards} className={className} />;
  }

  return (
    <div className={className}>
      <div className="space-y-4">
        {cards.map((card) => (
          <CardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
});
