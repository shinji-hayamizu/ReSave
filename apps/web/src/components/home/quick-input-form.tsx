'use client';

import { useState } from 'react';

import { Edit, Plus } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';

import { CreateCardDialog } from '@/components/cards/create-card-dialog';
import { Button } from '@/components/ui/button';
import { useCreateCard } from '@/hooks/useCards';
import { cn } from '@/lib/utils';

interface QuickInputFormProps {
  className?: string;
  onCardCreated?: () => void;
}

const MAX_FRONT_LENGTH = 500;
const MAX_BACK_LENGTH = 2000;

export function QuickInputForm({ className, onCardCreated }: QuickInputFormProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const createCard = useCreateCard();

  const handleSubmit = async (e: React.FormEvent) => {
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
  };

  const isSubmitDisabled = createCard.isPending || !front.trim();

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setFront('');
      setBack('');
    }
  };

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
              disabled={createCard.isPending}
            />
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
              disabled={createCard.isPending}
            />
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
}
