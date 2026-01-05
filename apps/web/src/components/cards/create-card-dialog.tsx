'use client';

import { useState, useEffect } from 'react';
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
  defaultValues?: {
    front?: string;
    back?: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateCardDialog({
  trigger,
  defaultValues,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateCardDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createCard = useCreateCard();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

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

  const dialogContent = (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>新規カード作成</DialogTitle>
      </DialogHeader>
      <CardInputForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createCard.isPending}
        defaultValues={defaultValues}
        key={open ? 'open' : 'closed'}
      />
    </DialogContent>
  );

  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}
