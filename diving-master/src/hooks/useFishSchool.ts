import { useCallback, useEffect, useState } from "react";
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import {
  FISH_DESPAWN_PAST_LEFT,
  FISH_SPEED_UNITS_PER_MS,
  FISH_SPACING,
  FISH_SPRITE_LENGTH,
  FISH_SCHOOL_MAX,
  FISH_SCHOOL_MIN,
  FISH_SCHOOL_RESPAWN_DELAY_MS,
  FISH_SCHOOL_SPAWN_X,
  randomSchoolY,
} from "@/src/constants/fish-school";
import type {
  FishBodyWobbleTuple,
  FishSchoolGroupTransform,
} from "@/src/types/fish-school";

export interface UseFishSchoolResult {
  isAlive: boolean;
  fishCount: number;
  schoolTransform: FishSchoolGroupTransform;
  bodyWobble: FishBodyWobbleTuple;
}

function randomFishCount(): number {
  return (
    FISH_SCHOOL_MIN +
    Math.floor(Math.random() * (FISH_SCHOOL_MAX - FISH_SCHOOL_MIN + 1))
  );
}

function useFishBodyWobbles(
  timeMs: SharedValue<number>,
): FishBodyWobbleTuple {
  const w0 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 0 * 0.85) * 0.3 },
  ]);
  const w1 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 1 * 0.85) * 0.3 },
  ]);
  const w2 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 2 * 0.85) * 0.3 },
  ]);
  const w3 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 3 * 0.85) * 0.3 },
  ]);
  const w4 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 4 * 0.85) * 0.3 },
  ]);
  const w5 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 5 * 0.85) * 0.3 },
  ]);
  const w6 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 6 * 0.85) * 0.3 },
  ]);
  const w7 = useDerivedValue(() => [
    { rotate: Math.sin(timeMs.value * 0.007 + 7 * 0.85) * 0.3 },
  ]);

  return [w0, w1, w2, w3, w4, w5, w6, w7];
}

export function useFishSchool(
  timeMs: SharedValue<number>,
  paused: boolean,
): UseFishSchoolResult {
  const [fishCount, setFishCount] = useState(randomFishCount);
  const [schoolY, setSchoolY] = useState(() => randomSchoolY());

  const [isAlive, setIsAlive] = useState(true);
  const anchorX = useSharedValue(FISH_SCHOOL_SPAWN_X);
  const isAliveSV = useSharedValue(1);
  const fishCountSV = useSharedValue(fishCount);

  const bodyWobble = useFishBodyWobbles(timeMs);

  const schoolTransform = useDerivedValue(() => [
    { translateX: anchorX.value },
    { translateY: schoolY },
  ]);

  useEffect(() => {
    fishCountSV.value = fishCount;
  }, [fishCount, fishCountSV]);

  const markDespawned = useCallback(() => {
    setIsAlive(false);
  }, []);

  const moveFrame = useFrameCallback((frameInfo) => {
    "worklet";
    if (isAliveSV.value === 0) {
      return;
    }
    const dt = frameInfo.timeSincePreviousFrame ?? 16.67;
    anchorX.value -= FISH_SPEED_UNITS_PER_MS * dt;

    const n = fishCountSV.value;
    const tailX = anchorX.value + (n - 1) * FISH_SPACING + FISH_SPRITE_LENGTH;
    if (tailX < -FISH_DESPAWN_PAST_LEFT && isAliveSV.value === 1) {
      isAliveSV.value = 0;
      runOnJS(markDespawned)();
    }
  }, false);

  useEffect(() => {
    if (!isAlive || paused) {
      moveFrame.setActive(false);
    } else {
      moveFrame.setActive(true);
    }
    return () => moveFrame.setActive(false);
  }, [isAlive, paused, moveFrame]);

  useEffect(() => {
    if (isAlive || paused) {
      return;
    }
    const id = setTimeout(() => {
      const nextCount = randomFishCount();
      const nextY = randomSchoolY();
      fishCountSV.value = nextCount;
      setFishCount(nextCount);
      setSchoolY(nextY);
      anchorX.value = FISH_SCHOOL_SPAWN_X;
      isAliveSV.value = 1;
      setIsAlive(true);
    }, FISH_SCHOOL_RESPAWN_DELAY_MS);
    return () => clearTimeout(id);
  }, [isAlive, paused, anchorX, isAliveSV, fishCountSV]);

  return {
    isAlive,
    fishCount,
    schoolTransform,
    bodyWobble,
  };
}
