'use client';

import { memo, useCallback, useState } from 'react';

import { Edit, Plus, X } from 'lucide-react';
import type { TextareaAutosizeProps } from 'react-textarea-autosize';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';

import { CreateCardDialog } from '@/components/cards/create-card-dialog';
import { Button } from '@/components/ui/button';
import { useHomeCreateCard } from '@/hooks/useHomeCards';
import { cn } from '@/lib/utils';

interface QuickInputFormProps {
  className?: string;
  onCardCreated?: () => void;
}

const MAX_FRONT_LENGTH = 500;
const MAX_BACK_LENGTH = 2000;

export const QuickInputForm = memo(function QuickInputForm({ className, onCardCreated }: QuickInputFormProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const createCard = useHomeCreateCard();

  const handleFrontKeyDown: TextareaAutosizeProps['onKeyDown'] = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitDisabled) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  const handleBackKeyDown: TextareaAutosizeProps['onKeyDown'] = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitDisabled) {
        e.currentTarget.form?.requestSubmit();
      }
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!front.trim()) {
      return;
    }

    try {
      await createCard.mutateAsync({
        front: front.trim(),
        back: back.trim(),
      });
      toast.success('カードを追加しました');
      setFront('');
      setBack('');
      onCardCreated?.();
    } catch {
      toast.error('カードの追加に失敗しました');
    }
  }, [front, back, createCard, onCardCreated]);

  const isSubmitDisabled = createCard.isPending || !front.trim();

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFront('');
      setBack('');
    }
  }, []);

  return (
    <>
      <form className={className} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-stretch">
            <TextareaAutosize
              className="flex-1 rounded-md rounded-r-none border border-r-0 border-input bg-transparent px-3 py-1.5 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none min-h-[32px]"
              placeholder="覚えたいこと"
              maxLength={MAX_FRONT_LENGTH}
              minRows={1}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              onKeyDown={handleFrontKeyDown}
              disabled={createCard.isPending}
            />
            {front && (
              <button
                type="button"
                className="w-10 h-auto border border-l-0 border-input bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center"
                onClick={() => setFront('')}
                title="クリア"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              type="submit"
              size="icon"
              className={cn(
                'rounded-l-none w-10 h-auto',
                isSubmitDisabled && 'opacity-50'
              )}
              disabled={isSubmitDisabled}
              title="保存"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-stretch">
            <TextareaAutosize
              className="flex-1 rounded-md rounded-r-none border border-r-0 border-input bg-transparent px-3 py-1.5 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none min-h-[32px]"
              placeholder="答え（任意）"
              maxLength={MAX_BACK_LENGTH}
              minRows={1}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onKeyDown={handleBackKeyDown}
              disabled={createCard.isPending}
            />
            {back && (
              <button
                type="button"
                className="w-10 h-auto border border-l-0 border-input bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center"
                onClick={() => setBack('')}
                title="クリア"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="rounded-l-none w-10 h-auto"
              title="詳細入力"
              onClick={handleOpenDialog}
            >
              <Edit className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </form>
      <CreateCardDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        defaultValues={{
          front: front.trim(),
          back: back.trim(),
        }}
        onCardCreated={onCardCreated}
      />
    </>
  );
});
