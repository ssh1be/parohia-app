import { Text } from 'react-native';
import { Sheet } from '../ui/Sheet';

interface ReadingSheetProps {
  visible: boolean;
  onClose: () => void;
  eyebrow: string;
  title?: string;
  subtitle?: string;
  body?: string;
  scripture?: boolean;
}

export function ReadingSheet({ visible, onClose, eyebrow, title, subtitle, body, scripture = false }: ReadingSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} eyebrow={eyebrow} title={title} subtitle={subtitle}>
      <Text
        selectable
        className="font-serif text-[20px] leading-[31px] text-gray-800 dark:text-gray-100 pt-2"
      >
        {scripture && body ? `\u201C${body}\u201D` : body}
      </Text>
    </Sheet>
  );
}
