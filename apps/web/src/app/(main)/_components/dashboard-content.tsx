'use client';

import { useState, useMemo, useCallback } from 'react';
import { FileQuestion } from 'lucide-react';

import { EditCardDialog } from '@/components/cards/edit-card-dialog';
import {
  CardTabs,
  type CardTabValue,
  HomeStudyCard,
  QuickInputForm,
  TagFilterBar,
} from '@/components/home';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useHomeCards } from '@/hooks/useHomeCards';
import { useTags } from '@/hooks/useTags';
import type { CardWithTags } from '@/types/card';

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

export function DashboardContent() {
  const [userSelectedTab, setUserSelectedTab] = useState<CardTabValue | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CardWithTags | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { data, isLoading } = useHomeCards();
  const { data: tags = [] } = useTags();

  const categorizedCards = useMemo(() => {
    if (!data) return { due: [], learning: [] };

    const now = data.fetchedAt;

    const due: CardWithTags[] = [];
    const learning: CardWithTags[] = [];

    for (const card of data.cards) {
      if (card.status === 'new') {
        due.push(card);
      } else if (card.status === 'active' && card.nextReviewAt && card.nextReviewAt <= now) {
        learning.push(card);
      }
    }

    return { due, learning };
  }, [data]);

  const filteredCards = useMemo(() => {
    if (!selectedTagId) return categorizedCards;
    return {
      due: categorizedCards.due.filter((card) =>
        card.tags.some((tag) => tag.id === selectedTagId)
      ),
      learning: categorizedCards.learning.filter((card) =>
        card.tags.some((tag) => tag.id === selectedTagId)
      ),
    };
  }, [categorizedCards, selectedTagId]);

  const counts = useMemo(() => ({
    due: filteredCards.due.length,
    learning: filteredCards.learning.length,
  }), [filteredCards]);

  const dataReady = !isLoading;
  const todayCardCount = categorizedCards.learning.length;

  const activeTab = useMemo<CardTabValue>(() => {
    if (!dataReady) return 'due';

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

  const activeCards = filteredCards[activeTab];

  return (
    <div className="pt-1 pb-2 md:pt-2 md:pb-4">
        <div className="mb-2">
          <QuickInputForm onCardCreated={handleCardCreated} />
        </div>

        {tags.length > 0 && (
          <div className="mb-2">
            <TagFilterBar
              tags={tags}
              selectedTagId={selectedTagId}
              onTagSelect={setSelectedTagId}
            />
          </div>
        )}

        <CardTabs counts={counts} value={activeTab} onChange={handleTabChange} />

        {isLoading ? (
          <StudyCardsSkeleton />
        ) : activeCards.length === 0 ? (
          <EmptyState
            description={
              selectedTagId
                ? 'このタグのカードはありません'
                : activeTab === 'due'
                  ? '新しいカードを追加して学習を始めましょう'
                  : '復習予定のカードはありません'
            }
            icon={<FileQuestion />}
            title="カードなし"
          />
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
