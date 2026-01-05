'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CardInputForm, type CardInputFormValues } from '@/components/cards/card-input-form';
import { useCreateCard } from '@/hooks/useCards';

interface CreateCardDialogProps {
  trigger?: React.ReactNode;
}

export function CreateCardDialog({ trigger }: CreateCardDialogProps) {
  const [open, setOpen] = useState(false);
  const createCard = useCreateCard();

  const handleSubmit = async (data: CardInputFormValues) => {
    try {
      await createCard.mutateAsync({
        front: data.front,
        back: data.back || undefined,
        tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
      });
      toast.success('カードを作成しました');
      setOpen(false);
    } catch {
      toast.error('カードの作成に失敗しました');
    }
  };

  const defaultTrigger = (
    <Button size="sm">
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">新規カード</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新規カード作成</DialogTitle>
        </DialogHeader>
        <CardInputForm
          mode="create"
          onSubmit={handleSubmit}
          isSubmitting={createCard.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}
