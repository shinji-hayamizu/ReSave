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
import { useNewCards, useTodayCards, useTodayCompletedCards } from '@/hooks/useCards';
import type { CardWithTags } from '@/types/card';

/**
 * カードのscheduleとcurrentStepから次回の復習間隔を計算
 * 未学習カード(isNew=true): schedule[0]が適用される
 * 学習中カード(isNew=false): schedule[currentStep+1]が適用される
 */
function getNextInterval(schedule: number[], currentStep: number, isNew: boolean): string {
  const nextStep = isNew ? 0 : currentStep + 1;
  if (nextStep >= schedule.length) {
    return '完了';
  }
  const days = schedule[nextStep];
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
  const { data: newCards, isLoading: isLoadingNew } = useNewCards();
  const { data: todayCards, isLoading: isLoadingToday } = useTodayCards();
  const { data: completedCards, isLoading: isLoadingCompleted } = useTodayCompletedCards();

  const isLoading = isLoadingNew || isLoadingToday || isLoadingCompleted;

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

  const handleCardCreated = useCallback(() => {
    setActiveTab('due');
  }, []);

  const categorizedCards = useMemo(() => {
    // due: status='new'のカード（未学習）
    const due = newCards ?? [];
    // learning: status='active'で今日復習予定のカード（復習中）
    const learning = todayCards ?? [];
    // completed: status='completed'または今日学習したカード
    const completed = completedCards ?? [];

    return { due, learning, completed };
  }, [newCards, todayCards, completedCards]);

  const counts = {
    due: categorizedCards.due.length,
    learning: categorizedCards.learning.length,
    completed: categorizedCards.completed.length,
  };

  const activeCards = categorizedCards[activeTab];

  return (
    <div className="pt-1 pb-2 md:pt-2 md:pb-4">
        <div className="mb-2">
          <QuickInputForm onCardCreated={handleCardCreated} />
        </div>

        <CardTabs counts={counts} value={activeTab} onChange={setActiveTab} />

        {isLoading ? (
          <StudyCardsSkeleton />
        ) : activeCards.length === 0 ? (
          <EmptyState
            description={
              activeTab === 'due'
                ? '新しいカードを追加して学習を始めましょう'
                : activeTab === 'learning'
                  ? '復習予定のカードはありません'
                  : '今日復習したカードはありません'
            }
            icon={<FileQuestion />}
            title="カードなし"
          />
        ) : activeTab === 'completed' ? (
          <CardList cards={activeCards} />
        ) : (
          <div className="bg-card shadow-sm divide-y divide-border">
            {activeCards.map((card) => (
              <HomeStudyCard
                key={card.id}
                back={card.back}
                currentStep={card.currentStep}
                front={card.front}
                id={card.id}
                intervals={{
                  ok: getNextInterval(card.schedule, card.currentStep, card.status === 'new'),
                  again: `${card.schedule[0]}日後`,
                }}
                schedule={card.schedule}
                showAgain={card.currentStep > 0}
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
