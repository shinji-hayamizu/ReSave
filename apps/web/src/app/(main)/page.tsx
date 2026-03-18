import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

import { getHomeCards } from '@/actions/cards';
import { homeCardKeys } from '@/lib/query-keys';

import { DashboardContent } from './_components/dashboard-content';

export default async function DashboardPage() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: homeCardKeys.all,
    queryFn: getHomeCards,
  });
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
