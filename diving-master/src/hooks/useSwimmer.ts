import { useEffect, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";
import {
  SWIMMER_ANCHOR_X,
  SWIMMER_SAFE_Y_MAX,
  SWIMMER_SAFE_Y_MIN,
  SWIM_PHASE_SPEED,
} from "@/src/constants/swimmer";
import type { SwimmerTouchControlMode } from "@/src/types/touch-controls";
import type { SwimmerProps } from "@/src/types/swimmer";

export type UseSwimmerResult = Pick<
  SwimmerProps,
  | "rootTransform"
  | "armTransformLeft"
  | "armTransformRight"
  | "legTransformLeft"
  | "legTransformRight"
> & {
  swimmerY: SharedValue<number>;
  /** Composed gesture — always a concrete RNGH gesture object (avoids undefined `gesture` prop). */
  touchGesture: ReturnType<typeof Gesture.Exclusive>;
};

function clampSwimmerY(y: number): number {
  "worklet";
  return Math.min(SWIMMER_SAFE_Y_MAX, Math.max(SWIMMER_SAFE_Y_MIN, y));
}

/** Local canvas Y → logical game Y (matches Skia FitBox `contain`). */
function touchYToGameY(
  touchY: number,
  offsetY: number,
  scale: number,
): number {
  "worklet";
  return (touchY - offsetY) / scale;
}

const TAP_DURATION_MS = 340;
const DRAG_SPRING = { damping: 20, stiffness: 280, mass: 0.85 } as const;

/**
 * Pass the frame clock’s `timeMs` SharedValue directly — worklets must not read
 * `.timeMs` off a plain `clock` object (it is undefined on the UI thread).
 */
export function useSwimmer(
  timeMs: SharedValue<number>,
  widthPx: number,
  heightPx: number,
  touchMode: SwimmerTouchControlMode = "drag",
): UseSwimmerResult {
  const swimmerY = useSharedValue(
    (SWIMMER_SAFE_Y_MIN + SWIMMER_SAFE_Y_MAX) / 2,
  );

  const fitScale = useSharedValue(1);
  const fitOffsetY = useSharedValue(0);

  useEffect(() => {
    const w = Math.max(widthPx, 1);
    const h = Math.max(heightPx, 1);
    const scale = Math.min(w / GAME_WIDTH, h / GAME_HEIGHT);
    fitScale.value = scale;
    fitOffsetY.value = (h - GAME_HEIGHT * scale) / 2;
  }, [widthPx, heightPx, fitScale, fitOffsetY]);

  const phase = useDerivedValue(() => timeMs.value * SWIM_PHASE_SPEED);

  const armTransformLeft = useDerivedValue(() => [
    { rotate: Math.sin(phase.value) * 0.62 },
  ]);
  const armTransformRight = useDerivedValue(() => [
    { rotate: -Math.sin(phase.value) * 0.62 },
  ]);
  const legTransformLeft = useDerivedValue(() => [
    { rotate: Math.sin(phase.value + 1.15) * 0.42 },
  ]);
  const legTransformRight = useDerivedValue(() => [
    { rotate: -Math.sin(phase.value + 1.15) * 0.42 },
  ]);

  const rootTransform = useDerivedValue(() => [
    { translateX: SWIMMER_ANCHOR_X },
    { translateY: swimmerY.value },
  ]);

  const touchGesture = useMemo(() => {
    const tap = Gesture.Tap()
      .enabled(touchMode === "tap")
      .onEnd((e) => {
        "worklet";
        const gy = touchYToGameY(e.y, fitOffsetY.value, fitScale.value);
        swimmerY.value = withTiming(clampSwimmerY(gy), {
          duration: TAP_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
      });

    const pan = Gesture.Pan()
      .enabled(touchMode === "drag")
      .onUpdate((e) => {
        "worklet";
        const gy = touchYToGameY(e.y, fitOffsetY.value, fitScale.value);
        swimmerY.value = withSpring(clampSwimmerY(gy), DRAG_SPRING);
      });

    return Gesture.Exclusive(tap, pan);
  }, [touchMode, swimmerY, fitOffsetY, fitScale]);

  return {
    swimmerY,
    rootTransform: rootTransform as SwimmerProps["rootTransform"],
    armTransformLeft: armTransformLeft as SwimmerProps["armTransformLeft"],
    armTransformRight: armTransformRight as SwimmerProps["armTransformRight"],
    legTransformLeft: legTransformLeft as SwimmerProps["legTransformLeft"],
    legTransformRight: legTransformRight as SwimmerProps["legTransformRight"],
    touchGesture,
  };
}
