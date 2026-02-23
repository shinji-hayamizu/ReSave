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
import { useHomeCards } from '@/hooks/useHomeCards';
import type { CardWithTags } from '@/types/card';

/**
 * カードのscheduleとcurrentStepから次回の復習間隔を計算
 * 未学習カード(isNew=true): schedule[0]が適用される（初回学習で1日後）
 * 学習中カード(isNew=false): schedule[currentStep]が適用される
 *   - current_step=1 → schedule[1]=3日後（2回目の復習）
 *   - current_step=2 → schedule[2]=7日後（3回目の復習）
 */
function getNextInterval(schedule: number[], currentStep: number, isNew: boolean): string {
  const nextStep = isNew ? 0 : currentStep;
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
  const [userSelectedTab, setUserSelectedTab] = useState<CardTabValue | null>(null);
  const [editingCard, setEditingCard] = useState<CardWithTags | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { data, isLoading } = useHomeCards();

  const categorizedCards = useMemo(() => {
    if (!data) return { due: [], learning: [], completed: [] };

    const now = new Date().toISOString();
    const studiedSet = new Set(data.todayStudiedCardIds);

    const due: CardWithTags[] = [];
    const learning: CardWithTags[] = [];
    const completed: CardWithTags[] = [];

    for (const card of data.cards) {
      if (card.status === 'new') {
        due.push(card);
      } else if (card.status === 'active' && card.nextReviewAt && card.nextReviewAt <= now) {
        learning.push(card);
      } else if (card.status === 'completed' || studiedSet.has(card.id)) {
        completed.push(card);
      }
    }

    return { due, learning, completed };
  }, [data]);

  const counts = useMemo(() => ({
    due: categorizedCards.due.length,
    learning: categorizedCards.learning.length,
    completed: categorizedCards.completed.length,
  }), [categorizedCards]);

  const dataReady = !isLoading;
  const todayCardCount = categorizedCards.learning.length;

  const activeTab = useMemo<CardTabValue | null>(() => {
    if (!dataReady) return null;

    if (userSelectedTab === null) {
      return todayCardCount > 0 ? 'learning' : 'due';
    }

    return userSelectedTab;
  }, [dataReady, userSelectedTab, todayCardCount]);

  const handleTabChange = useCallback((value: CardTabValue) => {
    setUserSelectedTab(value);
  }, []);

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
    setUserSelectedTab('due');
  }, []);

  const resolvedTab: CardTabValue = activeTab ?? 'due';
  const activeCards = categorizedCards[resolvedTab];

  return (
    <div className="pt-1 pb-2 md:pt-2 md:pb-4">
        <div className="mb-2">
          <QuickInputForm onCardCreated={handleCardCreated} />
        </div>

        <CardTabs counts={counts} value={resolvedTab} onChange={handleTabChange} />

        {isLoading || activeTab === null ? (
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
