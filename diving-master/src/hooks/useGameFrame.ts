import { useEffect } from "react";
import { useFrameCallback, useSharedValue } from "react-native-reanimated";

import type { FrameClock } from "@/src/types/game-canvas";

const DEFAULT_DELTA_MS = 16;
const MAX_FRAME_DELTA_MS = 34;

export interface UseGameFrameOptions {
  /** When false, callback does not run until setActive(true). Default true. */
  autostart?: boolean;
  /** When true, frame loop is inactive. */
  paused?: boolean;
}

/**
 * UI-thread game tick via Reanimated. Updates shared values only — no setState.
 */
export function useGameFrame(options: UseGameFrameOptions = {}): FrameClock {
  const { autostart = true, paused = false } = options;

  const timeMs = useSharedValue(0);
  const deltaMs = useSharedValue(DEFAULT_DELTA_MS);

  const frame = useFrameCallback((frameInfo) => {
    "worklet";
    const dt = Math.min(
      MAX_FRAME_DELTA_MS,
      Math.max(0, frameInfo.timeSincePreviousFrame ?? DEFAULT_DELTA_MS),
    );
    deltaMs.value = dt;
    timeMs.value += dt;
  }, false);

  useEffect(() => {
    if (paused) {
      frame.setActive(false);
    } else if (autostart) {
      frame.setActive(true);
    }
    return () => {
      frame.setActive(false);
    };
  }, [paused, autostart, frame]);

  return {
    timeMs,
    deltaMs,
    setActive: frame.setActive,
    isActive: frame.isActive,
  };
}
