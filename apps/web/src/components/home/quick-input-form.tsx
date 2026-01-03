'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCard } from '@/hooks/useCards';

interface QuickInputFormProps {
  className?: string;
}

export function QuickInputForm({ className }: QuickInputFormProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const createCard = useCreateCard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!front.trim() || !back.trim()) {
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

  return (
    <form className={className} onSubmit={handleSubmit}>
      <div className="bg-card rounded-xl shadow-sm p-4 space-y-3">
        <Input
          placeholder="問題を入力..."
          value={front}
          onChange={(e) => setFront(e.target.value)}
          disabled={createCard.isPending}
        />
        <Textarea
          placeholder="答えを入力..."
          value={back}
          onChange={(e) => setBack(e.target.value)}
          disabled={createCard.isPending}
          rows={2}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={createCard.isPending || !front.trim() || !back.trim()}
          >
            <Plus className="h-4 w-4" />
            カードを追加
          </Button>
        </div>
      </div>
    </form>
  );
}
