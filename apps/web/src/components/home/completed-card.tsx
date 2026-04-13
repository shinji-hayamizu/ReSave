'use client';

import { Check, RotateCcw } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import { StudyCard } from '@/components/ui/study-card';
import { TagBadge } from '@/components/ui/tag-badge';
import { cn } from '@/lib/utils';
import { useHomeResetCard } from '@/hooks/useHomeCards';
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
  const resetCard = useHomeResetCard();

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

  const handleReset = useCallback(async () => {
    try {
      await resetCard.mutateAsync({ id: card.id, card });
      toast.success('カードを未学習に戻しました');
    } catch {
      toast.error('カードのリセットに失敗しました');
    }
  }, [card, resetCard]);

  const resetButton = useMemo(() => (
    <button
      type="button"
      disabled={resetCard.isPending}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium',
        'transition-colors disabled:opacity-50 disabled:pointer-events-none',
        'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white'
      )}
      onClick={handleReset}
    >
      <RotateCcw className="h-4 w-4" />
      <span className="font-semibold">覚え直し</span>
    </button>
  ), [handleReset, resetCard.isPending]);

  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden">
      <StudyCard
        answer={card.back}
        currentStep={card.currentStep}
        question={card.front}
        ratingButtons={resetButton}
        tags={tags}
        totalSteps={card.schedule.length}
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
