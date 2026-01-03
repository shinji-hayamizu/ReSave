'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { CardInputForm } from '@/components/cards/card-input-form';
import type { CardInputFormValues } from '@/components/cards/card-input-form';
import { useCreateCard } from '@/hooks/useCards';

export default function NewCardPage() {
  const router = useRouter();
  const createCard = useCreateCard();

  async function handleSubmit(data: CardInputFormValues) {
    try {
      await createCard.mutateAsync({
        front: data.front,
        back: data.back,
        tagIds: data.tagIds,
      });
      toast.success('カードを作成しました');
      router.push('/');
    } catch (error) {
      toast.error('カードの作成に失敗しました');
    }
  }

  return (
    <div className="container max-w-2xl py-4 px-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>戻る</span>
      </Link>

      <h1 className="text-xl font-bold mb-4">カード作成</h1>

      <CardInputForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createCard.isPending}
      />
    </div>
  );
}
