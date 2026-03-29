import { useCallback, useEffect, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withSequence,
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
  | "hitFlashOpacity"
  | "collectSparklePhase"
> & {
  swimmerY: SharedValue<number>;
  touchGesture: ReturnType<typeof Gesture.Exclusive>;
  triggerHit: () => void;
  triggerCollect: () => void;
};

function clampSwimmerY(y: number): number {
  "worklet";
  return Math.min(SWIMMER_SAFE_Y_MAX, Math.max(SWIMMER_SAFE_Y_MIN, y));
}

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

  const isSwimming = useSharedValue(false);
  const swimIntensity = useDerivedValue(() => {
    "worklet";
    return withTiming(isSwimming.value ? 1 : 0.15, { duration: 300 });
  });

  const hitOffset = useSharedValue(0);
  const hitFlashOpacity = useSharedValue(0);
  const jumpOffset = useSharedValue(0);
  const collectSparklePhase = useSharedValue(0);

  useEffect(() => {
    const w = Math.max(widthPx, 1);
    const h = Math.max(heightPx, 1);
    const scale = Math.min(w / GAME_WIDTH, h / GAME_HEIGHT);
    fitScale.value = scale;
    fitOffsetY.value = (h - GAME_HEIGHT * scale) / 2;
  }, [widthPx, heightPx, fitScale, fitOffsetY]);

  const phase = useDerivedValue(() => {
    "worklet";
    return timeMs.value * SWIM_PHASE_SPEED;
  });

  const armTransformLeft = useDerivedValue(() => {
    "worklet";
    return [{ rotate: Math.sin(phase.value) * 0.62 * swimIntensity.value }];
  });
  const armTransformRight = useDerivedValue(() => {
    "worklet";
    return [{ rotate: -Math.sin(phase.value) * 0.62 * swimIntensity.value }];
  });
  const legTransformLeft = useDerivedValue(() => {
    "worklet";
    return [{ rotate: Math.sin(phase.value + 1.15) * 0.42 * swimIntensity.value }];
  });
  const legTransformRight = useDerivedValue(() => {
    "worklet";
    return [{ rotate: -Math.sin(phase.value + 1.15) * 0.42 * swimIntensity.value }];
  });

  const idleFloatY = useDerivedValue(() => {
    "worklet";
    return Math.sin(timeMs.value * 0.003) * 12 * (1 - swimIntensity.value);
  });

  const rootTransform = useDerivedValue(() => {
    "worklet";
    return [
      { translateX: SWIMMER_ANCHOR_X + hitOffset.value },
      { translateY: swimmerY.value + idleFloatY.value + jumpOffset.value },
    ];
  });

  const touchGesture = useMemo(() => {
    const tap = Gesture.Tap()
      .enabled(touchMode === "tap")
      .onBegin(() => {
        "worklet";
        isSwimming.value = true;
      })
      .onEnd((e) => {
        "worklet";
        const gy = touchYToGameY(e.y, fitOffsetY.value, fitScale.value);
        swimmerY.value = withTiming(clampSwimmerY(gy), {
          duration: TAP_DURATION_MS,
          easing: Easing.out(Easing.cubic),
        });
      })
      .onFinalize(() => {
        "worklet";
        isSwimming.value = false;
      });

    const pan = Gesture.Pan()
      .enabled(touchMode === "drag")
      .onBegin(() => {
        "worklet";
        isSwimming.value = true;
      })
      .onUpdate((e) => {
        "worklet";
        const gy = touchYToGameY(e.y, fitOffsetY.value, fitScale.value);
        swimmerY.value = withSpring(clampSwimmerY(gy), DRAG_SPRING);
      })
      .onFinalize(() => {
        "worklet";
        isSwimming.value = false;
      });

    return Gesture.Exclusive(tap, pan);
  }, [touchMode, swimmerY, fitOffsetY, fitScale, isSwimming]);

  const triggerHit = useCallback(() => {
    hitOffset.value = withSequence(
      withTiming(-30, { duration: 100, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 300, easing: Easing.in(Easing.quad) })
    );
    hitFlashOpacity.value = withSequence(
      withTiming(0.8, { duration: 50 }),
      withTiming(0, { duration: 350 })
    );
  }, [hitOffset, hitFlashOpacity]);

  const triggerCollect = useCallback(() => {
    jumpOffset.value = withSequence(
      withTiming(-20, { duration: 150, easing: Easing.out(Easing.circle) }),
      withTiming(0, { duration: 250, easing: Easing.in(Easing.bounce) })
    );
    collectSparklePhase.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [jumpOffset, collectSparklePhase]);

  return {
    swimmerY,
    rootTransform: rootTransform as SwimmerProps["rootTransform"],
    armTransformLeft: armTransformLeft as SwimmerProps["armTransformLeft"],
    armTransformRight: armTransformRight as SwimmerProps["armTransformRight"],
    legTransformLeft: legTransformLeft as SwimmerProps["legTransformLeft"],
    legTransformRight: legTransformRight as SwimmerProps["legTransformRight"],
    hitFlashOpacity,
    collectSparklePhase,
    touchGesture,
    triggerHit,
    triggerCollect,
  };
}
