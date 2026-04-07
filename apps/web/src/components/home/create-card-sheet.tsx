'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { X } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useHomeCreateCard } from '@/hooks/useHomeCards';
import { cn } from '@/lib/utils';

const MAX_FRONT_LENGTH = 500;
const MAX_BACK_LENGTH = 2000;

interface CreateCardSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCardCreated?: () => void;
}

export const CreateCardSheet = memo(function CreateCardSheet({
  isOpen,
  onClose,
  onCardCreated,
}: CreateCardSheetProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const createCard = useHomeCreateCard();
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const timerId = setTimeout(() => {
        frontRef.current?.focus();
      }, 300);
      return () => clearTimeout(timerId);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setFront('');
    setBack('');
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

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
      handleClose();
    } catch {
      toast.error('カードの追加に失敗しました');
    }
  }, [front, back, createCard, onCardCreated, handleClose]);

  const isSubmitDisabled = createCard.isPending || !front.trim();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={handleClose}
      />

      <div
        ref={sheetRef}
        aria-labelledby="sheet-title"
        aria-modal="true"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'rounded-t-2xl bg-background shadow-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        role="dialog"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/30" />

        <div className="flex items-center justify-between px-4 pb-2 pt-3">
          <h2 className="text-base font-semibold" id="sheet-title">
            新規カード作成
          </h2>
          <button
            aria-label="閉じる"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            type="button"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="px-4 pb-6" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="sheet-front">
                覚えたいこと<span className="text-destructive">*</span>
              </label>
              <TextareaAutosize
                ref={frontRef}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                disabled={createCard.isPending}
                id="sheet-front"
                maxLength={MAX_FRONT_LENGTH}
                maxRows={5}
                minRows={2}
                placeholder="例: 日本の首都は？"
                value={front}
                onChange={(e) => setFront(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="sheet-back">
                答え（任意）
              </label>
              <TextareaAutosize
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                disabled={createCard.isPending}
                id="sheet-back"
                maxLength={MAX_BACK_LENGTH}
                maxRows={5}
                minRows={2}
                placeholder="例: 東京"
                value={back}
                onChange={(e) => setBack(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button
              className="flex-1"
              disabled={createCard.isPending}
              type="button"
              variant="outline"
              onClick={handleClose}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={isSubmitDisabled}
              type="submit"
            >
              保存
            </Button>
          </div>
        </form>
      </div>
    </>
  );
});
