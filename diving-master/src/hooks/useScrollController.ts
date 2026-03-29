import { useEffect } from "react";
import { useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";
import { CORAL_SCROLL_UNITS_PER_MS } from "@/src/constants/coral";

export interface ScrollController {
  scrollX: SharedValue<number>;
  speedMultiplier: SharedValue<number>;
}

const SCROLL_SPEED_PER_LEVEL = 0.1;
const MAX_SPEED_MULTIPLIER = 2.5; // Cap maximum speed for playability

export function useScrollController(
  level: number,
  paused: boolean,
): ScrollController {
  const scrollX = useSharedValue(0);
  const speedMultiplier = useSharedValue(1);

  // Increases speed gradually as level progresses and caps maximum speed
  useEffect(() => {
    const rawSpeed = 1 + Math.max(0, level - 1) * SCROLL_SPEED_PER_LEVEL;
    speedMultiplier.value = Math.min(rawSpeed, MAX_SPEED_MULTIPLIER);
  }, [level, speedMultiplier]);

  // Increments every frame based on current speed
  const advanceFrame = useFrameCallback((frameInfo) => {
    "worklet";
    const dt = frameInfo.timeSincePreviousFrame ?? 16.67;
    scrollX.value += CORAL_SCROLL_UNITS_PER_MS * speedMultiplier.value * dt;
  }, false);

  useEffect(() => {
    advanceFrame.setActive(!paused);
    return () => advanceFrame.setActive(false);
  }, [advanceFrame, paused]);

  return { scrollX, speedMultiplier };
}
