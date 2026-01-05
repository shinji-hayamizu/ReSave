'use client';

import { useState } from 'react';

import { Edit, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { CreateCardDialog } from '@/components/cards/create-card-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateCard } from '@/hooks/useCards';
import { cn } from '@/lib/utils';

interface QuickInputFormProps {
  className?: string;
}

const MAX_FRONT_LENGTH = 500;
const MAX_BACK_LENGTH = 2000;

export function QuickInputForm({ className }: QuickInputFormProps) {
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
        <div className="bg-card rounded-xl shadow-sm px-4 pt-2 pb-4">
          <div className="grid grid-cols-[1fr_auto] gap-0">
            <Input
              className="rounded-r-none border-r-0 mb-1"
              placeholder="覚えたいこと"
              maxLength={MAX_FRONT_LENGTH}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              disabled={createCard.isPending}
            />
            <div className="row-span-2 flex flex-col gap-1">
              <Button
                type="submit"
                size="icon"
                className={cn(
                  'flex-1 rounded-l-none rounded-br-none h-auto',
                  isSubmitDisabled && 'opacity-50'
                )}
                disabled={isSubmitDisabled}
                title="保存"
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="flex-1 rounded-l-none rounded-tr-none border-t-0 h-auto"
                title="詳細入力"
                onClick={handleOpenDialog}
              >
                <Edit className="h-5 w-5" />
              </Button>
            </div>
            <Input
              className="rounded-r-none border-r-0"
              placeholder="答え（任意）"
              maxLength={MAX_BACK_LENGTH}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              disabled={createCard.isPending}
            />
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
      />
    </>
  );
}
