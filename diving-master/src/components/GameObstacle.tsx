import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { FishSchool } from "@/src/components/FishSchool";
import { SeaTurtle } from "@/src/components/SeaTurtle";
import { Coral } from "@/src/components/Coral";
import type {
  FishObstacle,
  TurtleObstacle,
  CoralObstacle,
  ObstacleInstance,
} from "@/src/hooks/useObstacleSpawner";
import {
  FISH_SPEED_UNITS_PER_MS,
  FISH_SPACING,
} from "@/src/constants/fish-school";
import {
  SEA_TURTLE_FREQ_TO_BOB_HZ,
  SEA_TURTLE_SPEED_UNITS_PER_MS,
} from "@/src/constants/sea-turtle";
import type { FishBodyWobbleTuple, FishSchoolGroupTransform } from "@/src/types/fish-school";

// ---------- Fish ----------

function GameFishObstacle({
  obstacle,
  scrollX,
  timeMs,
  speedMultiplier,
}: {
  obstacle: FishObstacle;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
  speedMultiplier: SharedValue<number>;
}) {
  const schoolTransform = useDerivedValue(() => {
    "worklet";
    const screenX = obstacle.worldX - scrollX.value;
    return [
      { translateX: screenX },
      { translateY: obstacle.y },
    ];
  });

  const w0 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 0 * 0.85) * 0.3 }]; });
  const w1 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 1 * 0.85) * 0.3 }]; });
  const w2 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 2 * 0.85) * 0.3 }]; });
  const w3 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 3 * 0.85) * 0.3 }]; });
  const w4 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 4 * 0.85) * 0.3 }]; });
  const w5 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 5 * 0.85) * 0.3 }]; });
  const w6 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 6 * 0.85) * 0.3 }]; });
  const w7 = useDerivedValue(() => { "worklet"; return [{ rotate: Math.sin(timeMs.value * 0.007 + 7 * 0.85) * 0.3 }]; });

  const bodyWobble = [w0, w1, w2, w3, w4, w5, w6, w7] as unknown as FishBodyWobbleTuple;

  return (
    <FishSchool
      fishCount={obstacle.fishCount}
      schoolTransform={schoolTransform as unknown as FishSchoolGroupTransform}
      bodyWobble={bodyWobble}
    />
  );
}

// ---------- Turtle ----------

function GameTurtleObstacle({
  obstacle,
  scrollX,
  timeMs,
  speedMultiplier,
}: {
  obstacle: TurtleObstacle;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
  speedMultiplier: SharedValue<number>;
}) {
  const rootTransform = useDerivedValue(() => {
    "worklet";
    const screenX = obstacle.worldX - scrollX.value;
    const tSec = timeMs.value * 0.001;
    const fBob = obstacle.frequency * SEA_TURTLE_FREQ_TO_BOB_HZ;
    const phase = 2 * Math.PI * fBob * tSec;
    const yOffset = obstacle.baseY + obstacle.amplitude * Math.sin(phase);
    return [
      { translateX: screenX },
      { translateY: yOffset },
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

  return (
    <SeaTurtle
      rootTransform={rootTransform as unknown as FishSchoolGroupTransform}
      flipperFrontUpper={flipperFrontUpper as unknown as FishSchoolGroupTransform}
      flipperFrontLower={flipperFrontLower as unknown as FishSchoolGroupTransform}
      flipperRearUpper={flipperRearUpper as unknown as FishSchoolGroupTransform}
      flipperRearLower={flipperRearLower as unknown as FishSchoolGroupTransform}
    />
  );
}

// ---------- Coral ----------

function GameCoralObstacle({
  obstacle,
  scrollX,
}: {
  obstacle: CoralObstacle;
  scrollX: SharedValue<number>;
}) {
  const rootTransform = useDerivedValue(() => {
    "worklet";
    const screenX = obstacle.worldX - scrollX.value;
    return [
      { translateX: screenX },
      { translateY: obstacle.baseY },
      { scale: obstacle.scale },
    ];
  });

  return (
    <Coral
      rootTransform={rootTransform as unknown as FishSchoolGroupTransform}
      branchPath={obstacle.branchPath}
      innerBranchPath={obstacle.innerBranchPath}
      palette={obstacle.palette}
    />
  );
}

// ---------- Dispatcher ----------

export function GameObstacle({
  obstacle,
  scrollX,
  timeMs,
  speedMultiplier,
}: {
  obstacle: ObstacleInstance;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
  speedMultiplier: SharedValue<number>;
}) {
  if (obstacle.kind === "fish") {
    return (
      <GameFishObstacle
        obstacle={obstacle}
        scrollX={scrollX}
        timeMs={timeMs}
        speedMultiplier={speedMultiplier}
      />
    );
  }

  if (obstacle.kind === "turtle") {
    return (
      <GameTurtleObstacle
        obstacle={obstacle}
        scrollX={scrollX}
        timeMs={timeMs}
        speedMultiplier={speedMultiplier}
      />
    );
  }

  return (
    <GameCoralObstacle
      obstacle={obstacle}
      scrollX={scrollX}
    />
  );
}
