'use client';

import { useState, useMemo, useCallback } from 'react';
import { FileQuestion } from 'lucide-react';

import { EditCardDialog } from '@/components/cards/edit-card-dialog';
import {
  CardList,
  CardTabs,
  type CardTabValue,
  HomeStudyCard,
  QuickInputForm,
} from '@/components/home';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodayCards } from '@/hooks/useCards';
import type { CardWithTags } from '@/types/card';

const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 180];

function getNextInterval(reviewLevel: number): string {
  const nextLevel = Math.min(reviewLevel + 1, REVIEW_INTERVALS.length - 1);
  const days = REVIEW_INTERVALS[nextLevel];
  return `${days}日後`;
}

function StudyCardsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <div key={i} className="bg-card rounded-xl shadow-sm p-4 space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<CardTabValue>('due');
  const [editingCard, setEditingCard] = useState<CardWithTags | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { data: todayCards, isLoading } = useTodayCards();

  const handleEdit = useCallback((card: CardWithTags) => {
    setEditingCard(card);
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogClose = useCallback((open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingCard(null);
    }
  }, []);

  const categorizedCards = useMemo(() => {
    if (!todayCards) {
      return { due: [], learning: [], completed: [] };
    }

    const due: typeof todayCards = [];
    const learning: typeof todayCards = [];
    const completed: typeof todayCards = [];

    for (const card of todayCards) {
      if (card.nextReviewAt === null && card.reviewLevel === 0) {
        due.push(card);
      } else if (card.nextReviewAt === null) {
        completed.push(card);
      } else if (card.reviewLevel === 0) {
        due.push(card);
      } else {
        learning.push(card);
      }
    }

    return { due, learning, completed };
  }, [todayCards]);

  const counts = {
    due: categorizedCards.due.length,
    learning: categorizedCards.learning.length,
    completed: categorizedCards.completed.length,
  };

  const activeCards = categorizedCards[activeTab];

  return (
    <div className="py-4 md:py-6 space-y-6">
        <QuickInputForm />

        <CardTabs counts={counts} value={activeTab} onChange={setActiveTab} />

        {isLoading ? (
          <StudyCardsSkeleton />
        ) : activeCards.length === 0 ? (
          <EmptyState
            description={
              activeTab === 'due'
                ? '新しいカードを追加して学習を始めましょう'
                : activeTab === 'learning'
                  ? '復習中のカードはありません'
                  : '完了したカードはありません'
            }
            icon={<FileQuestion />}
            title="カードなし"
          />
        ) : activeTab === 'completed' ? (
          <CardList cards={activeCards} />
        ) : (
          <div className="space-y-4">
            {activeCards.map((card) => (
              <HomeStudyCard
                key={card.id}
                back={card.back}
                front={card.front}
                id={card.id}
                intervals={{
                  ok: getNextInterval(card.reviewLevel),
                  again: '1日後',
                }}
                tags={card.tags}
                onEdit={() => handleEdit(card)}
              />
            ))}
          </div>
        )}

        <EditCardDialog
          card={editingCard}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
        />
    </div>
  );
}
