import { Stack } from 'expo-router';

export default function TagsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
      }}
    />
  );
}
