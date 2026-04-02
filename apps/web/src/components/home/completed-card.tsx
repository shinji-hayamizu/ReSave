'use client';

import { Check } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { StudyCard } from '@/components/ui/study-card';
import { TagBadge } from '@/components/ui/tag-badge';
import { useHomeUpdateCard } from '@/hooks/useHomeCards';
import type { CardWithTags } from '@/types/card';

function formatCompletedDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
}

interface CompletedCardProps {
  card: CardWithTags;
}

export const CompletedCard = memo(function CompletedCard({ card }: CompletedCardProps) {
  const updateCard = useHomeUpdateCard();

  const tags = useMemo(() => {
    if (card.tags.length === 0) return undefined;
    return (
      <>
        {card.tags.map((tag) => (
          <TagBadge key={tag.id}>{tag.name}</TagBadge>
        ))}
      </>
    );
  }, [card.tags]);

  const handleSave = useCallback(
    async (data: { front?: string; back?: string }) => {
      try {
        await updateCard.mutateAsync({ id: card.id, input: data });
        toast.success('カードを更新しました');
      } catch {
        toast.error('カードの更新に失敗しました');
      }
    },
    [card.id, updateCard]
  );

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      <StudyCard
        answer={card.back}
        currentStep={card.currentStep}
        question={card.front}
        tags={tags}
        totalSteps={card.schedule.length}
        onSave={handleSave}
      />
      {card.completedAt && (
        <div className="px-4 py-2 flex items-center justify-end gap-1.5">
          <Check className="w-3 h-3 text-green-400" />
          <span className="text-xs text-gray-400">
            完了: {formatCompletedDate(card.completedAt)}
          </span>
        </div>
      )}
    </div>
  );
});
