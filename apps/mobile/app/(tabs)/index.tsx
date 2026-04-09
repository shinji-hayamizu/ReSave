import { View, ActivityIndicator } from 'react-native';
import { useTodayCards } from '@/hooks/useCards';
import { StudySession } from '@/components/study/StudySession';
import { EmptyState } from '@/components/ui/EmptyState';

export default function HomeScreen() {
  const { data, isLoading, isError } = useTodayCards();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <EmptyState
          title="データの取得に失敗しました"
          description="しばらくしてからもう一度お試しください"
        />
      </View>
    );
  }

  if (data.data.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <EmptyState
          title="今日の復習はありません"
          description="新しいカードを追加しましょう"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StudySession cards={data.data} />
    </View>
  );
}
