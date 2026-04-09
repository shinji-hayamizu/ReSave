import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useSession } from './useSession';
import { cardKeys } from './query-keys';

interface SubmitAssessmentInput {
  cardId: string;
  assessment: 'ok' | 'remembered' | 'again';
}

export function useSubmitAssessment() {
  const { token } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitAssessmentInput) =>
      apiClient<unknown>('/api/study', {
        method: 'POST',
        body: input,
        token: token!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}
