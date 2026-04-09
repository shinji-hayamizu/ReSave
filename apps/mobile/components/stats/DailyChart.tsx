import { View, Text } from 'react-native';
import type { DailyStat } from '@/hooks/useStats';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

interface DailyChartProps {
  data: DailyStat[];
}

function getDayLabel(dateString: string): string {
  const date = new Date(dateString);
  const dayIndex = date.getDay();
  return DAY_LABELS[dayIndex] ?? '';
}

export function DailyChart({ data }: DailyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.reviewedCount), 1);
  const BAR_MAX_HEIGHT = 120;

  return (
    <View className="bg-white rounded-xl p-5 shadow-sm">
      <Text className="text-base font-semibold text-gray-900 mb-4">週間レビュー</Text>

      <View className="flex-row items-end justify-between" style={{ height: BAR_MAX_HEIGHT + 30 }}>
        {data.map((stat) => {
          const barHeight = Math.max((stat.reviewedCount / maxCount) * BAR_MAX_HEIGHT, 4);
          return (
            <View key={stat.date} className="items-center flex-1">
              <Text className="text-xs text-gray-500 mb-1">{stat.reviewedCount}</Text>
              <View
                className="bg-blue-500 rounded-t-sm w-6"
                style={{ height: barHeight }}
              />
              <Text className="text-xs text-gray-400 mt-1">
                {getDayLabel(stat.date)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
