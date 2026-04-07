import { useEffect } from "react";
import {
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { CORAL_SCROLL_UNITS_PER_MS } from "@/src/constants/coral";

export interface ScrollController {
  scrollX: SharedValue<number>;
  speedMultiplier: SharedValue<number>;
}

const SCROLL_SPEED_PER_LEVEL = 0.1;
const MAX_SPEED_MULTIPLIER = 2.5; // Cap maximum speed for playability
const MAX_SCROLL_STEP_MS = 34;

/**
 * Scroll advances in sync with `timeMs` from {@link useGameFrame} (no extra useFrameCallback).
 * When the game clock is paused, `timeMs` stops and scroll stops automatically.
 */
export function useScrollController(
  level: number,
  timeMs: SharedValue<number>,
): ScrollController {
  const scrollX = useSharedValue(0);
  const speedMultiplier = useSharedValue(1);
  const prevTimeMs = useSharedValue(-1);

  useEffect(() => {
    const rawSpeed = 1 + Math.max(0, level - 1) * SCROLL_SPEED_PER_LEVEL;
    speedMultiplier.value = Math.min(rawSpeed, MAX_SPEED_MULTIPLIER);
  }, [level, speedMultiplier]);

  useAnimatedReaction(
    () => timeMs.value,
    (now) => {
      "worklet";
      const prev = prevTimeMs.value;
      prevTimeMs.value = now;
      if (prev < 0) {
        return;
      }
      const dt = Math.min(MAX_SCROLL_STEP_MS, Math.max(0, now - prev));
      scrollX.value += CORAL_SCROLL_UNITS_PER_MS * speedMultiplier.value * dt;
    },
  );

  return { scrollX, speedMultiplier };
}
