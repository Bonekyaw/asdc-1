import { useCallback, useEffect, useState } from "react";
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import {
  SEA_TURTLE_DESPAWN_PAST_LEFT,
  SEA_TURTLE_FREQ_TO_BOB_HZ,
  SEA_TURTLE_RESPAWN_DELAY_MS,
  SEA_TURTLE_SPEED_UNITS_PER_MS,
  SEA_TURTLE_SPAWN_X,
  SEA_TURTLE_SPRITE_LENGTH,
  randomTurtleAmplitude,
  randomTurtleBaseY,
  randomTurtleFrequency,
} from "@/src/constants/sea-turtle";
import type { FishSchoolGroupTransform } from "@/src/types/fish-school";
import type { SeaTurtleProps } from "@/src/types/sea-turtle";

export type UseSeaTurtleResult = Pick<
  SeaTurtleProps,
  | "rootTransform"
  | "flipperFrontUpper"
  | "flipperFrontLower"
  | "flipperRearUpper"
  | "flipperRearLower"
> & { isAlive: boolean };

function rollMotionParams() {
  const amplitude = randomTurtleAmplitude();
  return {
    amplitude,
    frequency: randomTurtleFrequency(),
    baseY: randomTurtleBaseY(amplitude),
  };
}

export function useSeaTurtle(
  timeMs: SharedValue<number>,
  paused: boolean,
): UseSeaTurtleResult {
  const initial = rollMotionParams();
  const amplitudeSV = useSharedValue(initial.amplitude);
  const frequencySV = useSharedValue(initial.frequency);
  const baseYSV = useSharedValue(initial.baseY);

  const [isAlive, setIsAlive] = useState(true);
  const turtleX = useSharedValue(SEA_TURTLE_SPAWN_X);
  const isAliveSV = useSharedValue(1);

  /**
   * y = baseY + amplitude * sin(2π * fBob * t), t = seconds since game clock start,
   * fBob = frequency * SEA_TURTLE_FREQ_TO_BOB_HZ (frequency in 0.02–0.05 from spec).
   */
  const rootTransform = useDerivedValue(() => {
    "worklet";
    const tSec = timeMs.value * 0.001;
    const fBob = frequencySV.value * SEA_TURTLE_FREQ_TO_BOB_HZ;
    const phase = 2 * Math.PI * fBob * tSec;
    return [
      { translateX: turtleX.value },
      {
        translateY: baseYSV.value + amplitudeSV.value * Math.sin(phase),
      },
    ];
  });

  const flipperFrontUpper = useDerivedValue(() => {
    "worklet";
    return [{ rotate: Math.sin(timeMs.value * 0.011 + 0.4) * 0.52 }];
  });
  const flipperFrontLower = useDerivedValue(() => {
    "worklet";
    return [{ rotate: Math.sin(timeMs.value * 0.011 + 2.1) * -0.48 }];
  });
  const flipperRearUpper = useDerivedValue(() => {
    "worklet";
    return [{ rotate: Math.sin(timeMs.value * 0.009 + 1.2) * 0.42 }];
  });
  const flipperRearLower = useDerivedValue(() => {
    "worklet";
    return [{ rotate: Math.sin(timeMs.value * 0.009 + 2.9) * -0.4 }];
  });

  const markDespawned = useCallback(() => {
    setIsAlive(false);
  }, []);

  const moveFrame = useFrameCallback((frameInfo) => {
    "worklet";
    if (isAliveSV.value === 0) {
      return;
    }
    const dt = frameInfo.timeSincePreviousFrame ?? 16.67;
    turtleX.value -= SEA_TURTLE_SPEED_UNITS_PER_MS * dt;

    const tailX = turtleX.value + SEA_TURTLE_SPRITE_LENGTH;
    if (tailX < -SEA_TURTLE_DESPAWN_PAST_LEFT && isAliveSV.value === 1) {
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
      const next = rollMotionParams();
      amplitudeSV.value = next.amplitude;
      frequencySV.value = next.frequency;
      baseYSV.value = next.baseY;
      turtleX.value = SEA_TURTLE_SPAWN_X;
      isAliveSV.value = 1;
      setIsAlive(true);
    }, SEA_TURTLE_RESPAWN_DELAY_MS);
    return () => clearTimeout(id);
  }, [isAlive, paused, amplitudeSV, frequencySV, baseYSV, turtleX, isAliveSV]);

  return {
    isAlive,
    rootTransform: rootTransform as FishSchoolGroupTransform,
    flipperFrontUpper: flipperFrontUpper as FishSchoolGroupTransform,
    flipperFrontLower: flipperFrontLower as FishSchoolGroupTransform,
    flipperRearUpper: flipperRearUpper as FishSchoolGroupTransform,
    flipperRearLower: flipperRearLower as FishSchoolGroupTransform,
  };
}
