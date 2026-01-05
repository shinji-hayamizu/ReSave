'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CardInputForm, type CardInputFormValues } from '@/components/cards/card-input-form';
import { useUpdateCard } from '@/hooks/useCards';
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
          tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
        },
      });
      toast.success('カードを更新しました');
      onOpenChange(false);
    } catch {
      toast.error('カードの更新に失敗しました');
    }
  };

  if (!card) return null;

  const defaultValues: Partial<CardInputFormValues> = {
    front: card.front,
    back: card.back || '',
    tagIds: card.tags.map((tag) => tag.id),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>カードを編集</DialogTitle>
        </DialogHeader>
        <CardInputForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isSubmitting={updateCard.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
