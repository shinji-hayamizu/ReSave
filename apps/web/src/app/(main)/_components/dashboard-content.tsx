'use client';

import { useState, useMemo, useCallback } from 'react';
import { FileQuestion } from 'lucide-react';

import { EditCardDialog } from '@/components/cards/edit-card-dialog';
import {
  CardTabs,
  type CardTabValue,
  HomeStudyCard,
  LoadMoreIndicator,
  MobileCardCreate,
  QuickInputForm,
  TagFilterBar,
} from '@/components/home';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useHomeDueCards, useHomeDueCount, useHomeLearningCards, getTotalFromInfiniteData } from '@/hooks/useHomeCards';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const [isDueUserEnabled, setIsDueUserEnabled] = useState(false);
  const [inlineEditingCardId, setInlineEditingCardId] = useState<string | null>(null);

  const dueCountQuery = useHomeDueCount();
  const learningQuery = useHomeLearningCards();
  const { data: tags = [] } = useTags();

  const learningSettled = !learningQuery.isLoading && learningQuery.data !== undefined;
  const learningIsEmpty = learningSettled && getTotalFromInfiniteData(learningQuery.data) === 0;

  const isDueEnabled = isDueUserEnabled || learningIsEmpty;

  const dueQuery = useHomeDueCards({ enabled: isDueEnabled });

  const dueCards = useMemo(() =>
    dueQuery.data?.pages.flatMap((page) => page.cards) ?? [],
    [dueQuery.data]
  );

  const learningCards = useMemo(() =>
    learningQuery.data?.pages.flatMap((page) => page.cards) ?? [],
    [learningQuery.data]
  );

  const filteredDueCards = useMemo(() => {
    if (!selectedTagId) return dueCards;
    return dueCards.filter((card) => card.tags.some((tag) => tag.id === selectedTagId));
  }, [dueCards, selectedTagId]);

  const filteredLearningCards = useMemo(() => {
    if (!selectedTagId) return learningCards;
    return learningCards.filter((card) => card.tags.some((tag) => tag.id === selectedTagId));
  }, [learningCards, selectedTagId]);

  const counts = useMemo(() => {
    const dueTotal = isDueEnabled
      ? getTotalFromInfiniteData(dueQuery.data)
      : (dueCountQuery.data ?? 0);
    return {
      due: selectedTagId ? filteredDueCards.length : dueTotal,
      learning: selectedTagId ? filteredLearningCards.length : getTotalFromInfiniteData(learningQuery.data),
    };
  }, [isDueEnabled, dueQuery.data, dueCountQuery.data, selectedTagId, filteredDueCards.length, filteredLearningCards.length, learningQuery.data]);

  const isLoading = learningQuery.isLoading || (isDueEnabled && dueQuery.isLoading);
  const dataReady = !isLoading;

  const activeTab = useMemo<CardTabValue>(() => {
    if (!dataReady) return 'due';

    if (userSelectedTab === null) {
      return counts.learning > 0 ? 'learning' : 'due';
    }

    return userSelectedTab;
  }, [dataReady, userSelectedTab, counts.learning]);

  const activeQuery = activeTab === 'due' ? dueQuery : learningQuery;
  const activeCards = activeTab === 'due' ? filteredDueCards : filteredLearningCards;

  const handleFetchNextPage = useCallback(() => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage) {
      activeQuery.fetchNextPage();
    }
  }, [activeQuery]);

  const triggerRef = useIntersectionObserver({
    enabled: !!activeQuery.hasNextPage && !activeQuery.isFetchingNextPage,
    rootMargin: '200px',
    onIntersect: handleFetchNextPage,
  });

  const handleTabChange = useCallback((value: CardTabValue) => {
    setUserSelectedTab(value);
    if (value === 'due') {
      setIsDueUserEnabled(true);
    }
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
    setIsDueUserEnabled(true);
    setUserSelectedTab('due');
  }, []);

  const handleInlineEditingChange = useCallback((cardId: string, isEditing: boolean) => {
    setInlineEditingCardId(isEditing ? cardId : null);
  }, []);

  const isMobile = useIsMobile();

  return (
    <div className="pt-1 pb-2 md:pt-2 md:pb-4">
        {!isMobile && (
          <div className="mb-2">
            <QuickInputForm onCardCreated={handleCardCreated} />
          </div>
        )}

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
          <>
            <div className="bg-card shadow-sm divide-y divide-border">
              {activeCards.map((card, index) => (
                <div key={card.id}>
                  <HomeStudyCard
                    back={card.back}
                    currentStep={card.currentStep}
                    front={card.front}
                    id={card.id}
                    intervals={{
                      ok: getNextInterval(card.schedule, card.currentStep, card.status === 'new'),
                      again: `${card.schedule[0]}日後`,
                    }}
                    isDisabled={inlineEditingCardId !== null && inlineEditingCardId !== card.id}
                    schedule={card.schedule}
                    showAgain={card.currentStep > 0}
                    sourceUrl={card.sourceUrl}
                    tags={card.tags}
                    onEdit={() => handleEdit(card)}
                    onEditingChange={(isEditing) => handleInlineEditingChange(card.id, isEditing)}
                  />
                  {index === activeCards.length - 2 && (
                    <div ref={triggerRef} aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
            <LoadMoreIndicator
              hasNextPage={!!activeQuery.hasNextPage}
              isFetchingNextPage={activeQuery.isFetchingNextPage}
              totalCount={counts[activeTab]}
            />
          </>
        )}

        <EditCardDialog
          card={editingCard}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
        />

        {isMobile && <MobileCardCreate onCardCreated={handleCardCreated} />}
    </div>
  );
}
