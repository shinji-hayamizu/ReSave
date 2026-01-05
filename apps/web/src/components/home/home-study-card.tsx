'use client';

import { memo, useCallback } from 'react';
import { toast } from 'sonner';

import type { Rating } from '@/components/ui/rating-buttons';
import { RatingButtons } from '@/components/ui/rating-buttons';
import { StudyCard } from '@/components/ui/study-card';
import { TagBadge } from '@/components/ui/tag-badge';
import { useSubmitAssessment } from '@/hooks/useStudy';
import type { Assessment } from '@/types/study-log';
import type { Tag } from '@/types/tag';

interface HomeStudyCardProps {
  id: string;
  front: string;
  back: string;
  tags?: Tag[];
  intervals?: { ok?: string; again?: string };
  onAssessmentComplete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const ratingToAssessment: Record<Rating, Assessment> = {
  ok: 'ok',
  learned: 'remembered',
  again: 'again',
};

export const HomeStudyCard = memo(function HomeStudyCard({
  id,
  front,
  back,
  tags = [],
  intervals,
  onAssessmentComplete,
  onEdit,
  className,
}: HomeStudyCardProps) {
  const submitAssessment = useSubmitAssessment();

  const handleRate = useCallback(
    async (rating: Rating) => {
      try {
        await submitAssessment.mutateAsync({
          cardId: id,
          assessment: ratingToAssessment[rating],
        });
        onAssessmentComplete?.();
      } catch {
        toast.error('評価の記録に失敗しました');
      }
    },
    [id, submitAssessment, onAssessmentComplete]
  );

  return (
    <StudyCard
      answer={back}
      className={className}
      question={front}
      ratingButtons={
        <RatingButtons
          disabled={submitAssessment.isPending}
          intervals={intervals}
          onRate={handleRate}
        />
      }
      tags={
        tags.length > 0 ? (
          <>
            {tags.map((tag) => (
              <TagBadge key={tag.id}>{tag.name}</TagBadge>
            ))}
          </>
        ) : undefined
      }
      onEdit={onEdit}
    />
  );
});
