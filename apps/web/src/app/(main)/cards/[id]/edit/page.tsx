'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { CardInputForm } from '@/components/cards/card-input-form';
import type { CardInputFormValues } from '@/components/cards/card-input-form';
import { DeleteCardDialog } from '@/components/cards/delete-card-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCard, useUpdateCard, useDeleteCard } from '@/hooks/useCards';

interface EditCardPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCardPage({ params }: EditCardPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: card, isLoading, error } = useCard(id);
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  async function handleSubmit(data: CardInputFormValues) {
    try {
      await updateCard.mutateAsync({
        id,
        input: {
          front: data.front,
          back: data.back,
          tagIds: data.tagIds,
        },
      });
      toast.success('カードを更新しました');
      router.push('/');
    } catch {
      toast.error('カードの更新に失敗しました');
    }
  }

  async function handleDelete() {
    try {
      await deleteCard.mutateAsync(id);
      toast.success('カードを削除しました');
      router.push('/');
    } catch {
      toast.error('カードの削除に失敗しました');
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-4 px-4">
        <Skeleton className="h-6 w-16 mb-4" />
        <Skeleton className="h-8 w-32 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="container max-w-2xl py-4 px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>戻る</span>
        </Link>
        <div className="text-center py-8">
          <p className="text-muted-foreground">カードが見つかりませんでした</p>
        </div>
      </div>
    );
  }

  const defaultValues: Partial<CardInputFormValues> = {
    front: card.front,
    back: card.back,
    tagIds: card.tags?.map((tag) => tag.id) ?? [],
    sourceUrl: '',
    repeatMode: 'spaced',
  };

  return (
    <div className="container max-w-2xl py-4 px-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>戻る</span>
      </Link>

      <h1 className="text-xl font-bold mb-4">カード編集</h1>

      <CardInputForm
        mode="edit"
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={updateCard.isPending}
      />

      {/* Danger Section */}
      <div className="mt-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <h2 className="text-sm font-medium text-destructive mb-2">危険な操作</h2>
        <p className="text-xs text-muted-foreground mb-3">
          この操作は取り消すことができません。
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleteCard.isPending}
        >
          {deleteCard.isPending ? '削除中...' : 'カードを削除'}
        </Button>
      </div>

      <DeleteCardDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        isDeleting={deleteCard.isPending}
      />
    </div>
  );
}
