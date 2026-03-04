'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Rating } from '@/components/ui/rating-buttons';
import { RatingButtons } from '@/components/ui/rating-buttons';
import { StudyCard } from '@/components/ui/study-card';
import { TagBadge } from '@/components/ui/tag-badge';
import { cn } from '@/lib/utils';
import { useHomeDeleteCard, useHomeUpdateCard, useHomeSubmitAssessment } from '@/hooks/useHomeCards';
import type { Assessment } from '@/types/study-log';
import type { Tag } from '@/types/tag';

interface HomeStudyCardProps {
  id: string;
  front: string;
  back: string;
  tags?: Tag[];
  currentStep?: number;
  schedule?: number[];
  intervals?: { ok?: string; again?: string };
  showAgain?: boolean;
  onAssessmentComplete?: () => void;
  onEdit?: () => void;
  className?: string;
}

const ratingToAssessment: Record<Rating, Assessment> = {
  ok: 'ok',
  learned: 'remembered',
  again: 'again',
};

const REMOVE_ANIMATION_DURATION_MS = 300;

export const HomeStudyCard = memo(function HomeStudyCard({
  id,
  front,
  back,
  tags = [],
  currentStep,
  schedule,
  intervals,
  showAgain = true,
  onAssessmentComplete,
  onEdit,
  className,
}: HomeStudyCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const submitAssessment = useHomeSubmitAssessment();
  const updateCard = useHomeUpdateCard();
  const deleteCard = useHomeDeleteCard();
  const rateTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (rateTimerRef.current) clearTimeout(rateTimerRef.current);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    };
  }, []);

  const handleRate = useCallback(
    async (rating: Rating) => {
      setIsRemoving(true);

      rateTimerRef.current = setTimeout(async () => {
        try {
          await submitAssessment.mutateAsync({
            cardId: id,
            assessment: ratingToAssessment[rating],
          });
          onAssessmentComplete?.();
        } catch {
          setIsRemoving(false);
          toast.error('評価の記録に失敗しました');
        }
      }, REMOVE_ANIMATION_DURATION_MS);
    },
    [id, submitAssessment, onAssessmentComplete]
  );

  const handleSave = useCallback(
    async (data: { front?: string; back?: string }) => {
      try {
        await updateCard.mutateAsync({
          id,
          input: data,
        });
        toast.success('カードを更新しました');
      } catch {
        toast.error('カードの更新に失敗しました');
      }
    },
    [id, updateCard]
  );

  const handleDeleteClick = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsRemoving(true);

    deleteTimerRef.current = setTimeout(async () => {
      try {
        await deleteCard.mutateAsync(id);
        toast.success('カードを削除しました');
      } catch {
        setIsRemoving(false);
        toast.error('カードの削除に失敗しました');
      }
    }, REMOVE_ANIMATION_DURATION_MS);
  }, [id, deleteCard]);

  return (
    <div
      data-testid="study-card"
      className={cn(
        'grid transition-all ease-out',
        isRemoving
          ? 'grid-rows-[0fr] opacity-0'
          : 'grid-rows-[1fr] opacity-100'
      )}
      style={{ transitionDuration: `${REMOVE_ANIMATION_DURATION_MS}ms` }}
    >
      <div className="overflow-hidden">
        <StudyCard
          answer={back}
          className={className}
          currentStep={currentStep}
          question={front}
          ratingButtons={
            <RatingButtons
              disabled={submitAssessment.isPending || isRemoving}
              intervals={intervals}
              showAgain={showAgain}
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
          totalSteps={schedule?.length}
          onDelete={handleDeleteClick}
          onEdit={onEdit}
          onSave={handleSave}
        />
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>カードを削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。カードに関連する学習履歴も削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteConfirm}
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});
