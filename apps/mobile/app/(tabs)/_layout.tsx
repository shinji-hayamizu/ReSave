import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 22 }}>{icon}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopColor: '#f3f4f6',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u{1F3E0}'} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'カード',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u{1F4C7}'} />,
        }}
      />
      <Tabs.Screen
        name="tags"
        options={{
          title: 'タグ',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u{1F3F7}'} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '統計',
          tabBarIcon: ({ color }) => <TabIcon icon={'\u{1F4CA}'} />,
        }}
      />
    </Tabs>
  );
}
