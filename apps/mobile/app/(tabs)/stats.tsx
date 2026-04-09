import { View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { TodaySummary } from '@/components/stats/TodaySummary';
import { StreakCounter } from '@/components/stats/StreakCounter';
import { DailyChart } from '@/components/stats/DailyChart';
import { useTodayStats, useSummaryStats, useDailyStats } from '@/hooks/useStats';

export default function StatsScreen() {
  const todayStats = useTodayStats();
  const summaryStats = useSummaryStats();
  const dailyStats = useDailyStats(7);

  const isLoading = todayStats.isLoading || summaryStats.isLoading || dailyStats.isLoading;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const hasError = todayStats.isError && summaryStats.isError && dailyStats.isError;

  if (hasError) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-base text-gray-500 text-center">
          統計データを取得できませんでした
        </Text>
        <Text className="text-sm text-gray-400 text-center mt-2">
          しばらくしてからもう一度お試しください
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, gap: 16 }}>
      {todayStats.data && <TodaySummary stats={todayStats.data} />}

      <View className="flex-row gap-4">
        {summaryStats.data && (
          <View className="flex-1">
            <StreakCounter streak={summaryStats.data.streak} />
          </View>
        )}
        {summaryStats.data && (
          <View className="flex-1 bg-white rounded-xl p-5 shadow-sm items-center">
            <Text className="text-4xl font-bold text-emerald-600">
              {summaryStats.data.totalCards}
            </Text>
            <Text className="text-sm text-gray-500 mt-1">総カード数</Text>
          </View>
        )}
      </View>

      {dailyStats.data?.data && dailyStats.data.data.length > 0 && (
        <DailyChart data={dailyStats.data.data} />
      )}

      {summaryStats.data && (
        <View className="bg-white rounded-xl p-5 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 mb-3">累計</Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-gray-900">{summaryStats.data.totalReviews}</Text>
              <Text className="text-xs text-gray-500 mt-1">総復習回数</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-xl font-bold text-gray-900">
                {Math.round(summaryStats.data.averageAccuracy * 100)}%
              </Text>
              <Text className="text-xs text-gray-500 mt-1">平均正答率</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
