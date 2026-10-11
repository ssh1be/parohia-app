import { useColorScheme } from 'nativewind';
import { palette } from '../../constants/theme';

export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    isDark,
    text: isDark ? '#F9FAFB' : '#111827',
    textMuted: isDark ? '#9CA3AF' : '#6B7280',
    textFaint: isDark ? '#6B7280' : '#9CA3AF',
    icon: isDark ? '#E5E7EB' : palette.gray700,
    background: isDark ? '#000000' : '#F9FAFB',
    surface: isDark ? '#111827' : '#FFFFFF',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.08)',
    placeholder: palette.gray400,
    accent: palette.accent,
  };
}
