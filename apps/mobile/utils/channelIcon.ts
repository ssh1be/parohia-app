import { Ionicons } from '@expo/vector-icons';

export function channelIcon(channel: { is_default?: boolean; is_chant?: boolean }): keyof typeof Ionicons.glyphMap {
  if (channel.is_default) return 'home';
  if (channel.is_chant) return 'musical-notes';
  return 'chatbubbles';
}
