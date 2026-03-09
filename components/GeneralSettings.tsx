import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { ThemePreference, useTheme } from '../contexts/ThemeContext';

export default function GeneralSettings() {
  const { themePreference, setThemePreference } = useTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeOptions: { label: string; value: ThemePreference; icon: string; description: string }[] = [
    { label: 'Light', value: 'light', icon: 'sunny', description: 'Always use light theme' },
    { label: 'Dark', value: 'dark', icon: 'moon', description: 'Always use dark theme' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline', description: 'Match device settings' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-black">
      <View className="p-6 space-y-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">General Settings</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            Customize your app experience
          </Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
          <Text className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Appearance</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Choose your preferred color theme
          </Text>
          <View className="space-y-2">
            {themeOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setThemePreference(option.value)}
                className={`flex-row items-center justify-between p-3 rounded-lg border mb-2 active:opacity-70 ${
                  themePreference === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={themePreference === option.value ? '#3B82F6' : (isDark ? '#9CA3AF' : '#6B7280')}
                  />
                  <View className="ml-3">
                    <Text className="text-gray-900 dark:text-white font-medium">{option.label}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs">{option.description}</Text>
                  </View>
                </View>
                {themePreference === option.value && (
                  <Ionicons name="checkmark" size={20} color="#3B82F6" />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-700 dark:text-blue-400 font-semibold mb-1">About Appearance</Text>
              <Text className="text-blue-600 dark:text-gray-300 text-sm">
                When set to System, the app will automatically switch between light and dark mode
                based on your device settings.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
