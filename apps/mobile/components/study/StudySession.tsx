import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { StudyCard } from '@/components/ui/StudyCard';
import { RatingButtons } from '@/components/ui/RatingButtons';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TagBadge } from '@/components/ui/TagBadge';
import { useSubmitAssessment } from '@/hooks/useStudy';
import type { CardWithTags } from '@/types/card';
import type { Rating } from '@/components/ui/RatingButtons';

interface StudySessionProps {
  cards: CardWithTags[];
}

function mapRatingToAssessment(rating: Rating): 'ok' | 'remembered' | 'again' {
  if (rating === 'learned') {
    return 'remembered';
  }
  return rating;
}

export function StudySession({ cards }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const submitAssessment = useSubmitAssessment();

  const totalCards = cards.length;
  const isCompleted = currentIndex >= totalCards;
  const currentCard = isCompleted ? null : cards[currentIndex];

  const handleShowAnswer = useCallback(() => {
    setIsAnswerVisible(true);
  }, []);

  const handleRate = useCallback(
    (rating: Rating) => {
      if (!currentCard || submitAssessment.isPending) {
        return;
      }

      const assessment = mapRatingToAssessment(rating);
      submitAssessment.mutate({
        cardId: currentCard.id,
        assessment,
      });

      setIsAnswerVisible(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentCard, submitAssessment]
  );

  if (isCompleted || !currentCard) {
    return (
      <View className="flex-1">
        <ProgressBar
          value={totalCards}
          max={totalCards}
          label={`${totalCards}/${totalCards}`}
          showPercentage
          className="px-4 pt-4"
        />
        <View className="flex-1 justify-center">
          <EmptyState
            title="全てのカードを復習しました"
            description="お疲れ様でした"
          />
        </View>
      </View>
    );
  }

  const tags = currentCard.tags.map((tag) => (
    <TagBadge key={tag.id}>{tag.name}</TagBadge>
  ));

  const ratingButtons = isAnswerVisible ? (
    <RatingButtons
      onRate={handleRate}
      disabled={submitAssessment.isPending}
    />
  ) : undefined;

  return (
    <View className="flex-1 px-4 pt-4">
      <ProgressBar
        value={currentIndex}
        max={totalCards}
        label={`${currentIndex}/${totalCards}`}
        showPercentage
        className="mb-4"
      />

      <Text className="text-sm text-gray-500 mb-3 text-center">
        {currentIndex + 1} / {totalCards}
      </Text>

      <StudyCard
        key={currentIndex}
        question={currentCard.front}
        answer={isAnswerVisible ? currentCard.back : undefined}
        defaultOpen
        tags={tags.length > 0 ? tags : undefined}
        ratingButtons={ratingButtons}
      />

      {!isAnswerVisible && (
        <Pressable
          className="mt-4 py-3 bg-blue-600 rounded-xl items-center active:bg-blue-700"
          onPress={handleShowAnswer}
        >
          <Text className="text-base font-semibold text-white">
            答えを見る
          </Text>
        </Pressable>
      )}
    </View>
  );
}
