import { View, Text } from 'react-native';

interface StreakCounterProps {
  streak: number;
}

export function StreakCounter({ streak }: StreakCounterProps) {
  return (
    <View className="bg-white rounded-xl p-5 shadow-sm items-center">
      <Text className="text-4xl font-bold text-blue-600">{streak}</Text>
      <Text className="text-sm text-gray-500 mt-1">日連続</Text>
    </View>
  );
}
