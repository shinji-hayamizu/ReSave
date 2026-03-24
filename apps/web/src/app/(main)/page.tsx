import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { getHomeCards } from '@/actions/cards';
import { getQueryClient } from '@/lib/query-client';
import { homeCardKeys } from '@/lib/query-keys';

import { DashboardContent } from './_components/dashboard-content';

export default async function DashboardPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: homeCardKeys.all,
    queryFn: () => getHomeCards(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
