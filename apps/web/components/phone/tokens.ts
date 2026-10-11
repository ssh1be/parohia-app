import {
  eventKindStyle as sharedEventKindStyle,
  fastingStyle as sharedFastingStyle,
  palette,
  type EventKind,
  type FastingKind,
} from "@parohia/shared";
import type { IconName } from "../Icon";

export { palette, type EventKind, type FastingKind };

export const eventKindStyle = sharedEventKindStyle as Record<
  EventKind,
  { color: string; icon: IconName; label: string; tint: string }
>;

export const fastingStyle = sharedFastingStyle as Record<FastingKind, { icon: IconName; color: string; label: string }>;

/** Spring used for cards rising into place in the app (near-critically damped). */
export const cardSpring = { type: "spring", damping: 26, stiffness: 170 } as const;
export const snappySpring = { type: "spring", damping: 18, stiffness: 260, mass: 0.7 } as const;
