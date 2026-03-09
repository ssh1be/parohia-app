import { Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";

export default function TabsLayout() {
  const pathname = usePathname();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? 'black' : 'white',
          borderTopColor: isDark ? '#1e1e1e' : '#e5e7eb',
          borderTopWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 16,
          height: 60,
        },
        tabBarActiveTintColor: isDark ? 'white' : 'black',
        tabBarInactiveTintColor: isDark ? 'gray' : '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
          fontWeight: 'normal',
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={pathname === '/' ? 'home' : 'home-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={pathname.includes('calendar') ? 'calendar' : 'calendar-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={pathname.includes('events') ? 'notifications' : 'notifications-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parish"
        options={{
          title: "Parish",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={pathname.includes('parish') ? 'location' : 'location-outline'} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 