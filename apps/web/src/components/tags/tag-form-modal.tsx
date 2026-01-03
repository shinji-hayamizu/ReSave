'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { ColorPalette, type TagColorName } from './color-palette';

const MAX_TAG_NAME_LENGTH = 30;

interface TagFormModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  defaultValues?: {
    name: string;
    color: string;
  };
  onSubmit: (data: { name: string; color: string }) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function TagFormModal({
  isOpen,
  mode,
  defaultValues,
  onSubmit,
  onClose,
  isSubmitting = false,
}: TagFormModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<TagColorName>('blue');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(defaultValues?.name ?? '');
      setColor((defaultValues?.color as TagColorName) ?? 'blue');
      setError('');
    }
  }, [isOpen, defaultValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('タグ名を入力してください');
      return;
    }

    if (trimmedName.length > MAX_TAG_NAME_LENGTH) {
      setError('タグ名は' + MAX_TAG_NAME_LENGTH + '文字以内で入力してください');
      return;
    }

    setError('');
    await onSubmit({ name: trimmedName, color });
  };

  const charCount = name.length;
  const isNearLimit = charCount >= MAX_TAG_NAME_LENGTH - 5;
  const isOverLimit = charCount > MAX_TAG_NAME_LENGTH;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'タグを追加' : 'タグを編集'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tag-name">タグ名</Label>
            <div className="relative">
              <Input
                id="tag-name"
                type="text"
                placeholder="タグ名を入力"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                maxLength={MAX_TAG_NAME_LENGTH + 10}
                className={error ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              <span
                className={'absolute bottom-2 right-3 text-xs ' + (
                  isOverLimit
                    ? 'text-destructive'
                    : isNearLimit
                      ? 'text-yellow-600'
                      : 'text-muted-foreground'
                )}
              >
                {charCount}/{MAX_TAG_NAME_LENGTH}
              </span>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>色</Label>
            <ColorPalette value={color} onChange={setColor} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
