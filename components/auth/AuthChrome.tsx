import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../ui/PressableScale';
import { Reveal } from '../ui/Reveal';
import { useThemeColors } from '../ui/useThemeColors';

export function AuthBackButton({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <PressableScale
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityLabel="Go back"
      className="h-10 w-10 rounded-full bg-gray-200/80 dark:bg-white/10 items-center justify-center"
    >
      <Ionicons name="chevron-back" size={20} color={colors.icon} />
    </PressableScale>
  );
}

interface AuthHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
}

/** Large display title with optional back affordance — mirrors LargeHeader language without scroll collapse. */
export function AuthHeader({ title, eyebrow, subtitle, onBack, right }: AuthHeaderProps) {
  return (
    <Reveal index={0}>
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 pr-3">
          {onBack ? (
            <View className="mb-5">
              <AuthBackButton onPress={onBack} />
            </View>
          ) : null}
          {eyebrow ? (
            <Text className="font-sans-semibold text-[12px] tracking-[1.4px] uppercase text-red-600 dark:text-red-400 mb-1">
              {eyebrow}
            </Text>
          ) : null}
          <Text
            className="font-display text-[36px] leading-[40px] text-gray-900 dark:text-white"
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="font-sans text-[15px] leading-[22px] text-gray-500 dark:text-gray-400 mt-2">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </Reveal>
  );
}

interface OnboardingProgressProps {
  step: number;
  total?: number;
}

export function OnboardingProgress({ step, total = 3 }: OnboardingProgressProps) {
  return (
    <Reveal index={1}>
      <View className="flex-row items-center mb-8 mt-6">
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < step;
          return (
            <View
              key={i}
              className={`flex-1 h-1 rounded-full ${filled ? 'bg-red-600' : 'bg-gray-200 dark:bg-white/10'} ${
                i < total - 1 ? 'mr-1.5' : ''
              }`}
            />
          );
        })}
      </View>
    </Reveal>
  );
}

interface AuthScaffoldProps {
  children: ReactNode;
  /** When false, content is a plain View (no keyboard dismiss / scroll). Default true. */
  scroll?: boolean;
  /** Transparent shell so parent gradients show through (welcome / complete). */
  transparent?: boolean;
  contentClassName?: string;
  bottom?: ReactNode;
}

export function AuthScaffold({
  children,
  scroll = true,
  transparent = false,
  contentClassName = '',
  bottom,
}: AuthScaffoldProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, 12) + 8;
  const paddingBottom = Math.max(insets.bottom, 16) + 8;
  const shellClass = transparent ? 'flex-1 bg-transparent' : 'flex-1 bg-gray-50 dark:bg-black';

  const body = (
    <View className={`flex-1 px-6 ${contentClassName}`} style={{ paddingTop, paddingBottom }}>
      {children}
      {bottom ? <View className="mt-auto pt-6">{bottom}</View> : null}
    </View>
  );

  if (!scroll) {
    return <View className={shellClass}>{body}</View>;
  }

  return (
    <KeyboardAvoidingView
      className={shellClass}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
