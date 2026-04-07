'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface CreateCardDialogProps {
  trigger?: React.ReactNode;
  defaultValues?: {
    front?: string;
    back?: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCardCreated?: () => void;
}

export function CreateCardDialog({
  trigger,
  defaultValues,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onCardCreated,
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
      onCardCreated?.();
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
    <DialogContent
      className={cn(
        'flex flex-col gap-0 p-0 overflow-hidden',
        'h-[100dvh] max-h-[100dvh] rounded-none',
        'sm:h-auto sm:max-h-[85vh] sm:rounded-lg',
        'sm:max-w-lg'
      )}
    >
      <DialogHeader className="flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b bg-background">
        <DialogTitle className="text-lg font-semibold">
          カード作成
        </DialogTitle>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <CardInputForm
          mode="create"
          formId="create-card-form"
          onSubmit={handleSubmit}
          isSubmitting={createCard.isPending}
          defaultValues={defaultValues}
          key={open ? 'open' : 'closed'}
        />
      </div>

      <div className="flex-shrink-0 border-t bg-background p-3 sm:px-6 sm:py-4 pb-[max(12px,env(safe-area-inset-bottom))] sm:pb-4">
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            form="create-card-form"
            className="flex-1"
            disabled={createCard.isPending}
          >
            {createCard.isPending ? (
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
