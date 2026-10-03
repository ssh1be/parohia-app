import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { entrance, palette } from '../constants/theme';
import { CalendarTradition, useCalendarTradition } from '../contexts/CalendarTraditionContext';
import { ThemePreference, useTheme } from '../contexts/ThemeContext';
import { PressableScale } from './ui/PressableScale';
import { SegmentedControl } from './ui/SegmentedControl';
import { SettingsGroup, SettingsRow } from './ui/Settings';

const SUPPORT_EMAIL = 'support@parohia.app';

async function openSupportEmail() {
  const subject = encodeURIComponent('Parohia feedback');
  const body = encodeURIComponent(
    '\n\n---\nApp version: ' + (Constants.expoConfig?.version ?? '1.0.0') + '\n'
  );
  const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Unable to open email', `Please email us at ${SUPPORT_EMAIL}`);
      return;
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open email', `Please email us at ${SUPPORT_EMAIL}`);
  }
}

const LIGHT = { bg: '#F9FAFB', card: '#FFFFFF', line: '#E5E7EB', text: '#111827' };
const DARK = { bg: '#000000', card: '#1A1A1E', line: '#2A2A30', text: '#F9FAFB' };

/** Miniature app screen used to preview a theme. */
function ThemePreview({ scheme }: { scheme: ThemePreference }) {
  const half = (theme: typeof LIGHT, side?: 'left' | 'right') => (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        paddingTop: 10,
        paddingLeft: side === 'right' ? 4 : 8,
        paddingRight: side === 'left' ? 4 : 8,
      }}
    >
      <View style={{ height: 6, width: '70%', borderRadius: 3, backgroundColor: theme.text, opacity: 0.85 }} />
      <View style={{ height: 22, borderRadius: 6, backgroundColor: palette.accent, marginTop: 8 }} />
      <View style={{ height: 14, borderRadius: 5, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, marginTop: 5 }} />
      <View style={{ height: 14, borderRadius: 5, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line, marginTop: 4 }} />
    </View>
  );

  return (
    <View style={{ height: 96, borderRadius: 14, overflow: 'hidden', flexDirection: 'row' }}>
      {scheme === 'light' && half(LIGHT)}
      {scheme === 'dark' && half(DARK)}
      {scheme === 'system' && (
        <>
          {half(LIGHT, 'left')}
          {half(DARK, 'right')}
        </>
      )}
    </View>
  );
}

export default function GeneralSettings() {
  const { themePreference, setThemePreference } = useTheme();
  const { tradition, setTradition } = useCalendarTradition();
  const insets = useSafeAreaInsets();

  const themeOptions: { label: string; value: ThemePreference; icon: keyof typeof Ionicons.glyphMap; description: string }[] = [
    { label: 'Light', value: 'light', icon: 'sunny', description: 'Always use light theme' },
    { label: 'Dark', value: 'dark', icon: 'moon', description: 'Always use dark theme' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline', description: 'Match device settings' },
  ];

  const traditionFooters: Record<CalendarTradition, string> = {
    greek: 'Greek tradition follows Antiochian and Greek Orthodox Archdiocese (GOA) rubrics for commemorations, readings, and fasting.',
    slavic: 'Slavic tradition follows OCA and ROCOR rubrics for commemorations, readings, and fasting.',
  };

  const active = themeOptions.find((o) => o.value === themePreference);

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-black"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={entrance.card()}>
        <SettingsGroup
          title="Appearance"
          footer={
            themePreference === 'system'
              ? 'The app switches between light and dark automatically with your device settings.'
              : active?.description
          }
        >
          <View className="flex-row p-3">
            {themeOptions.map((option, i) => {
              const selected = themePreference === option.value;
              return (
                <PressableScale
                  key={option.value}
                  onPress={() => {
                    if (selected) return;
                    Haptics.selectionAsync().catch(() => {});
                    setThemePreference(option.value);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${option.label} theme. ${option.description}`}
                  style={{ flex: 1, marginRight: i < themeOptions.length - 1 ? 10 : 0 }}
                >
                  <View
                    className="rounded-[18px] p-1"
                    style={{ borderWidth: 2, borderColor: selected ? palette.accent : 'transparent' }}
                  >
                    <ThemePreview scheme={option.value} />
                  </View>
                  <View className="flex-row items-center justify-center mt-2.5">
                    {selected ? (
                      <Animated.View entering={entrance.pop()}>
                        <Ionicons name="checkmark-circle" size={16} color={palette.accent} />
                      </Animated.View>
                    ) : (
                      <Ionicons name={option.icon} size={14} color={palette.gray400} />
                    )}
                    <Text
                      className={`ml-1.5 text-[13px] ${
                        selected ? 'font-sans-bold text-gray-900 dark:text-white' : 'font-sans-medium text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </SettingsGroup>
      </Animated.View>

      <Animated.View entering={entrance.card(40)}>
        <SettingsGroup title="Liturgical calendar" footer={traditionFooters[tradition]}>
          <View className="p-4">
            <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white mb-1">
              Calendar tradition
            </Text>
            <Text className="font-sans text-[12.5px] leading-[17px] text-gray-500 dark:text-gray-400 mb-3">
              Choose which Orthodox tradition Orthocal uses for saints, readings, and fasting.
            </Text>
            <SegmentedControl
              segments={[
                { key: 'greek', label: 'Greek' },
                { key: 'slavic', label: 'Slavic' },
              ]}
              value={tradition}
              onChange={setTradition}
            />
          </View>
        </SettingsGroup>
      </Animated.View>

      <Animated.View entering={entrance.card(80)}>
        <SettingsGroup
          title="Support"
          footer="Send feedback, ideas, or bug reports. We'll get back to you as soon as we can."
        >
          <SettingsRow
            first
            icon="mail-outline"
            iconColor={palette.blue}
            title="Contact support"
            subtitle={SUPPORT_EMAIL}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              openSupportEmail();
            }}
            right={<Ionicons name="chevron-forward" size={16} color={palette.gray400} />}
          />
        </SettingsGroup>
      </Animated.View>

      <Animated.View entering={entrance.card(120)} style={{ alignItems: 'center', marginTop: 40 }}>
        <Text className="font-display text-[20px] text-gray-400 dark:text-gray-600">Parohia</Text>
        <Text className="font-sans text-xs text-gray-400 dark:text-gray-600 mt-0.5">
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </Animated.View>
    </ScrollView>
  );
}
