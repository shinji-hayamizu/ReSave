import { useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';

import { CardForm } from '@/components/cards/CardForm';
import { useCreateCard } from '@/hooks/useCards';

export default function NewCardScreen() {
  const router = useRouter();
  const createCard = useCreateCard();

  const handleSubmit = useCallback(
    async (values: { front: string; back: string; tagIds: string[] }) => {
      const input = {
        front: values.front,
        back: values.back,
        ...(values.tagIds.length > 0 ? { tagIds: values.tagIds } : {}),
      };
      await createCard.mutateAsync(input);
      router.back();
    },
    [createCard, router]
  );

  const errorMessage = createCard.error instanceof Error
    ? createCard.error.message
    : createCard.error
      ? '作成に失敗しました'
      : undefined;

  return (
    <>
      <Stack.Screen options={{ title: 'カード作成' }} />
      <CardForm
        error={errorMessage}
        loading={createCard.isPending}
        onSubmit={handleSubmit}
        submitLabel="作成"
      />
    </>
  );
}
