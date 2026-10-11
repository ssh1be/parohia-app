import { Tabs } from "expo-router";
import { TabBar } from "../../components/navigation/TabBar";
import { useThemeColors } from "../../components/ui/useThemeColors";

export default function TabsLayout() {
  const colors = useThemeColors();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // Native detaching driven by the animated shift progress can leave a tab stuck
      // detached on the new architecture, rendering a blank screen.
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="events" options={{ title: "Events" }} />
      <Tabs.Screen name="parish" options={{ title: "Parish" }} />
    </Tabs>
  );
}
