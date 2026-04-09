import { Stack } from 'expo-router';

export default function CardsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
      }}
    />
  );
}
