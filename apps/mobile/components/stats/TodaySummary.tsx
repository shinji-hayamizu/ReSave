import { View, Text } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { TodayStats } from '@/hooks/useStats';

interface TodaySummaryProps {
  stats: TodayStats;
}

export function TodaySummary({ stats }: TodaySummaryProps) {
  const total = stats.reviewedCount + stats.remainingCount;
  const accuracyPercent = Math.round(stats.accuracy * 100);

  return (
    <View className="bg-white rounded-xl p-5 shadow-sm">
      <Text className="text-base font-semibold text-gray-900 mb-4">今日の学習</Text>

      <View className="flex-row justify-between mb-3">
        <View className="items-center flex-1">
          <Text className="text-2xl font-bold text-blue-600">{stats.reviewedCount}</Text>
          <Text className="text-xs text-gray-500 mt-1">復習済み</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-2xl font-bold text-orange-500">{stats.remainingCount}</Text>
          <Text className="text-xs text-gray-500 mt-1">残り</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-2xl font-bold text-emerald-600">{accuracyPercent}%</Text>
          <Text className="text-xs text-gray-500 mt-1">正答率</Text>
        </View>
      </View>

      {total > 0 && (
        <ProgressBar
          value={stats.reviewedCount}
          max={total}
          label={`${stats.reviewedCount}/${total}`}
          showPercentage
        />
      )}
    </View>
  );
}
