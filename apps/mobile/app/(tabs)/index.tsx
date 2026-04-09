import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-medium text-gray-600">今日の復習</Text>
      <Text className="text-sm text-gray-400 mt-2">Phase 3で実装予定</Text>
    </View>
  );
}
