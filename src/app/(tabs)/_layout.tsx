import { Tabs, router } from 'expo-router';
import { useColorScheme, Text, TouchableOpacity } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 24 : 20, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

export default function TabsLayout() {
  const schema = useColorScheme();
  const dunkel = schema === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5B8DEF',
        tabBarInactiveTintColor: dunkel ? '#888' : '#999',
        tabBarStyle: {
          backgroundColor: dunkel ? '#1C1C1E' : '#F2F2F7',
          borderTopColor: dunkel ? '#2C2C2E' : '#E0E0E0',
        },
        headerStyle: {
          backgroundColor: dunkel ? '#1C1C1E' : '#F2F2F7',
        },
        headerTintColor: dunkel ? '#FFF' : '#000',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Übersicht',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/profil' as never)} style={{ marginRight: 16 }}>
              <Text style={{ fontSize: 24 }}>👤</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="symptome"
        options={{
          title: 'Symptome',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="arztbesuche"
        options={{
          title: 'Arztbesuche',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="auswertung"
        options={{
          title: 'Auswertung',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
