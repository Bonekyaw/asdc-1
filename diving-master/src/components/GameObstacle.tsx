import { memo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { FishSchool } from "@/src/components/FishSchool";
import { SeaTurtle } from "@/src/components/SeaTurtle";
import { Coral } from "@/src/components/Coral";
import {
  getTurtleOffsetY,
  getObstacleWorldOffsetX,
  getFishBodyWobbleTransforms,
  getTurtleFlipperTransforms,
  type FishObstacle,
  type TurtleObstacle,
  type CoralObstacle,
  type ObstacleInstance,
} from "@/src/hooks/useObstacleSpawner";
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
    const worldX = getObstacleWorldOffsetX(obstacle, timeMs.value, speedMultiplier.value);
    const screenX = worldX - scrollX.value;
    return [
      { translateX: screenX },
      { translateY: obstacle.y },
    ];
  });

  const bodyWobble = useDerivedValue(() => {
    "worklet";
    return getFishBodyWobbleTransforms(timeMs.value - obstacle.spawnTimeMs);
  });

  return (
    <FishSchool
      fishCount={obstacle.fishCount}
      schoolTransform={schoolTransform as unknown as FishSchoolGroupTransform}
      bodyWobble={bodyWobble as unknown as FishBodyWobbleTuple}
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
    const worldX = getObstacleWorldOffsetX(obstacle, timeMs.value, speedMultiplier.value);
    const screenX = worldX - scrollX.value;
    const yOffset = getTurtleOffsetY(obstacle, timeMs.value);
    return [
      { translateX: screenX },
      { translateY: yOffset },
    ];
  });

  const flippers = useDerivedValue(() => {
    "worklet";
    return getTurtleFlipperTransforms(timeMs.value - obstacle.spawnTimeMs);
  });

  const flipperFrontUpper = useDerivedValue(() => {
    "worklet";
    return flippers.value.flipperFrontUpper;
  });
  const flipperFrontLower = useDerivedValue(() => {
    "worklet";
    return flippers.value.flipperFrontLower;
  });
  const flipperRearUpper = useDerivedValue(() => {
    "worklet";
    return flippers.value.flipperRearUpper;
  });
  const flipperRearLower = useDerivedValue(() => {
    "worklet";
    return flippers.value.flipperRearLower;
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
  timeMs,
}: {
  obstacle: CoralObstacle;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
}) {
  const rootTransform = useDerivedValue(() => {
    "worklet";
    const screenX = getObstacleWorldOffsetX(obstacle, timeMs.value, 1) - scrollX.value;
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

export const GameObstacle = memo(function GameObstacle({
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
      timeMs={timeMs}
    />
  );
});
