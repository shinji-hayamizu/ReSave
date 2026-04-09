import { useCallback, useMemo } from 'react';
import { View, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { CardForm } from '@/components/cards/CardForm';
import { useCard, useUpdateCard, useDeleteCard } from '@/hooks/useCards';

export default function CardDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: card, isLoading } = useCard(id ?? '');
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const initialValues = useMemo(() => {
    if (!card) return undefined;
    return {
      front: card.front,
      back: card.back,
      tagIds: card.tags.map((tag) => tag.id),
    };
  }, [card]);

  const handleSubmit = useCallback(
    async (values: { front: string; back: string; tagIds: string[] }) => {
      if (!id) return;
      const input = {
        front: values.front,
        back: values.back,
        ...(values.tagIds.length > 0 ? { tagIds: values.tagIds } : {}),
      };
      await updateCard.mutateAsync({ id, input });
      router.back();
    },
    [id, updateCard, router]
  );

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert('カードを削除', 'このカードを削除しますか？この操作は取り消せません。', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteCard.mutateAsync(id);
          router.back();
        },
      },
    ]);
  }, [id, deleteCard, router]);

  const errorMessage = updateCard.error instanceof Error
    ? updateCard.error.message
    : updateCard.error
      ? '更新に失敗しました'
      : undefined;

  if (isLoading || !card) {
    return (
      <>
        <Stack.Screen options={{ title: 'カード編集' }} />
        <View className="flex-1 items-center justify-center bg-gray-50">
          <ActivityIndicator color="#2563eb" size="large" />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'カード編集' }} />
      <View className="flex-1 bg-gray-50">
        <CardForm
          error={errorMessage}
          initialValues={initialValues}
          loading={updateCard.isPending}
          onSubmit={handleSubmit}
          submitLabel="保存"
        />
        <View className="px-4 pb-8">
          <Button
            loading={deleteCard.isPending}
            onPress={handleDelete}
            variant="destructive"
          >
            削除
          </Button>
        </View>
      </View>
    </>
  );
}
