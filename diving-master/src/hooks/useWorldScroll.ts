import { useEffect } from "react";
import {
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

export function useWorldScroll(
  speedUnitsPerMs: number,
  paused: boolean,
): SharedValue<number> {
  const scrollX = useSharedValue(0);

  const advanceFrame = useFrameCallback((frameInfo) => {
    "worklet";
    const dt = frameInfo.timeSincePreviousFrame ?? 16.67;
    scrollX.value += speedUnitsPerMs * dt;
  }, false);

  useEffect(() => {
    advanceFrame.setActive(!paused);
    return () => advanceFrame.setActive(false);
  }, [advanceFrame, paused]);

  return scrollX;
}
