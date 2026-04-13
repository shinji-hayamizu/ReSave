'use client';

import { useMemo } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardInputForm, type CardInputFormValues } from '@/components/cards/card-input-form';
import { useUpdateCard } from '@/hooks/useCards';
import { cn } from '@/lib/utils';
import type { CardWithTags } from '@/types/card';

interface EditCardDialogProps {
  card: CardWithTags | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCardDialog({ card, open, onOpenChange }: EditCardDialogProps) {
  const updateCard = useUpdateCard();

  const handleSubmit = async (data: CardInputFormValues) => {
    if (!card) return;

    try {
      await updateCard.mutateAsync({
        id: card.id,
        input: {
          front: data.front,
          back: data.back || undefined,
          sourceUrl: data.sourceUrl,
          tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
        },
      });
      toast.success('カードを更新しました');
      onOpenChange(false);
    } catch {
      toast.error('カードの更新に失敗しました');
    }
  };

  const defaultValues = useMemo<Partial<CardInputFormValues> | undefined>(
    () =>
      card
        ? {
            front: card.front,
            back: card.back || '',
            sourceUrl: card.sourceUrl || '',
            tagIds: card.tags.map((tag) => tag.id),
          }
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card?.id, card?.front, card?.back, card?.sourceUrl, card?.tags]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex flex-col gap-0 p-0',
          'max-h-[90vh] sm:max-h-[85vh]',
          'sm:max-w-lg'
        )}
      >
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 z-10 flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-semibold">
              カードを編集
            </DialogTitle>
            {/* Desktop Save Button in Header */}
            <Button
              type="submit"
              form="edit-card-form"
              size="sm"
              className="hidden sm:inline-flex gap-1.5"
              disabled={updateCard.isPending}
            >
              {updateCard.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>保存</span>
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {card && (
            <CardInputForm
              mode="edit"
              formId="edit-card-form"
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isSubmitting={updateCard.isPending}
            />
          )}
        </div>

        {/* Mobile Sticky Footer */}
        <div className="sm:hidden sticky bottom-0 flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              form="edit-card-form"
              className="flex-1"
              disabled={updateCard.isPending}
            >
              {updateCard.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
