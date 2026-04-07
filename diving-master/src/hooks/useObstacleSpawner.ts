import { useCallback, useEffect, useRef, useState } from "react";
import {
  runOnJS,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import {
  CORAL_DESPAWN_PAST_LEFT,
  CORAL_SCROLL_UNITS_PER_MS,
  CORAL_WIDTH,
} from "@/src/constants/coral";
import {
  FISH_DESPAWN_PAST_LEFT,
  FISH_SCHOOL_MAX,
  FISH_SCHOOL_MIN,
  FISH_SPEED_UNITS_PER_MS,
  FISH_SPACING,
  FISH_SPRITE_LENGTH,
} from "@/src/constants/fish-school";
import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";
import type { ScrollController } from "@/src/hooks/useScrollController";
import {
  SEA_TURTLE_AMPLITUDE_MAX,
  SEA_TURTLE_AMPLITUDE_MIN,
  SEA_TURTLE_DESPAWN_PAST_LEFT,
  SEA_TURTLE_FREQ_TO_BOB_HZ,
  SEA_TURTLE_FREQUENCY_MAX,
  SEA_TURTLE_FREQUENCY_MIN,
  SEA_TURTLE_SPEED_UNITS_PER_MS,
  SEA_TURTLE_SPRITE_LENGTH,
} from "@/src/constants/sea-turtle";
import type { CoralPalette } from "@/src/types/coral";
import type {
  FishBodyWobbleTuple,
  FishSchoolGroupTransform,
} from "@/src/types/fish-school";

export type ObstacleKind = "fish" | "turtle" | "coral";

export type FishObstacle = {
  id: string;
  kind: "fish";
  worldX: number;
  spawnTimeMs: number;
  y: number;
  fishCount: number;
  width: number;
  height: number;
  speed: number;
  despawnPastLeft: number;
};

export type TurtleObstacle = {
  id: string;
  kind: "turtle";
  worldX: number;
  spawnTimeMs: number;
  baseY: number;
  amplitude: number;
  frequency: number;
  width: number;
  height: number;
  speed: number;
  despawnPastLeft: number;
};

export type CoralObstacle = {
  id: string;
  kind: "coral";
  worldX: number;
  baseY: number;
  scale: number;
  branchPath: string;
  innerBranchPath: string;
  palette: CoralPalette;
  width: number;
  height: number;
  speed: number;
  despawnPastLeft: number;
};

export type ObstacleInstance =
  | FishObstacle
  | TurtleObstacle
  | CoralObstacle;

export interface ObstacleSpawnerState {
  obstacles: ObstacleInstance[];
}

export interface UseObstacleSpawnerResult extends ObstacleSpawnerState {
  removeObstacle: (id: string) => void;
}

type ObstacleFrameSnapshot = {
  id: string;
  kind: ObstacleKind;
  worldX: number;
  spawnTimeMs: number;
  width: number;
  speed: number;
  despawnPastLeft: number;
};

const FISH_WEIGHT = 0.4;
const TURTLE_WEIGHT = 0.35;
const MIN_SPAWN_INTERVAL_MS = 2000;
const MAX_SPAWN_INTERVAL_MS = 5000;
const MIN_INTERVAL_FLOOR_MS = 900;
const MAX_INTERVAL_FLOOR_MS = 2200;
const MIN_OBSTACLE_DISTANCE = 180;
const SPAWN_BUFFER_X = 48;
const COMPLEX_PATTERN_GAP_X = 160;
const SPAWN_RATE_PER_LEVEL = 0.15;
const SAFE_ZONE_TOP = 70;
const SAFE_ZONE_BOTTOM = GAME_HEIGHT - 54;
const FISH_Y_MIN = 96;
const FISH_Y_MAX = GAME_HEIGHT - 120;
const TURTLE_Y_MIN = 120;
const TURTLE_Y_MAX = GAME_HEIGHT - 120;
const CORAL_BASE_Y_MIN = GAME_HEIGHT - 70;
const CORAL_BASE_Y_MAX = GAME_HEIGHT - 28;
const MAX_FRAME_STEP_MS = 48;

const CORAL_PALETTES: readonly CoralPalette[] = [
  { base: "#ec4899", mid: "#f472b6", highlight: "#fbcfe8" },
  { base: "#dc2626", mid: "#ef4444", highlight: "#fecaca" },
  { base: "#f97316", mid: "#fb923c", highlight: "#fed7aa" },
] as const;

const CORAL_VARIANTS = [
  {
    branchPath:
      "M -29 10 Q -30 -8 -26 -21 Q -20 -45 -25 -69 Q -14 -59 -10 -39 Q -7 -54 -10 -78 Q -1 -69 2 -50 Q 8 -66 5 -92 Q 15 -83 19 -58 Q 24 -70 22 -84 Q 31 -72 32 -46 Q 33 -24 29 10 Z",
    innerBranchPath:
      "M -18 10 Q -19 -8 -15 -22 Q -11 -39 -14 -56 Q -6 -47 -4 -31 Q 1 -48 -1 -67 Q 7 -59 10 -39 Q 16 -50 16 -68 Q 23 -58 23 -36 Q 23 -12 20 10 Z",
  },
  {
    branchPath:
      "M -30 10 Q -29 -6 -22 -24 Q -17 -37 -19 -55 Q -11 -49 -8 -34 Q -3 -46 -5 -69 Q 4 -60 8 -42 Q 12 -57 10 -80 Q 19 -68 21 -50 Q 27 -59 27 -73 Q 35 -59 34 -34 Q 34 -16 31 10 Z",
    innerBranchPath:
      "M -17 10 Q -18 -5 -13 -19 Q -9 -33 -10 -46 Q -4 -40 -1 -27 Q 4 -37 3 -58 Q 10 -50 12 -34 Q 17 -42 18 -56 Q 24 -47 24 -28 Q 24 -10 21 10 Z",
  },
  {
    branchPath:
      "M -31 10 Q -31 -10 -28 -27 Q -22 -44 -27 -63 Q -17 -55 -13 -35 Q -10 -52 -14 -72 Q -5 -64 -1 -45 Q 2 -59 0 -87 Q 11 -74 14 -55 Q 18 -67 17 -84 Q 27 -71 29 -48 Q 33 -28 30 10 Z",
    innerBranchPath:
      "M -19 10 Q -19 -8 -16 -22 Q -12 -36 -15 -51 Q -7 -44 -4 -28 Q 0 -40 -2 -62 Q 6 -54 9 -37 Q 14 -47 13 -64 Q 21 -54 22 -34 Q 23 -16 20 10 Z",
  },
] as const;
const MAX_ACTIVE_OBSTACLES = 12;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number): number {
  "worklet";
  return min + Math.random() * (max - min);
}

function randomIntInclusive(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomCoralPalette(): CoralPalette {
  return CORAL_PALETTES[Math.floor(Math.random() * CORAL_PALETTES.length)];
}

function randomCoralVariant() {
  return CORAL_VARIANTS[Math.floor(Math.random() * CORAL_VARIANTS.length)];
}

function randomObstacleKind(): ObstacleKind {
  const roll = Math.random();
  if (roll < FISH_WEIGHT) {
    return "fish";
  }
  if (roll < FISH_WEIGHT + TURTLE_WEIGHT) {
    return "turtle";
  }
  return "coral";
}

function nextSpawnIntervalMs(level: number): number {
  "worklet";
  const spawnRateMultiplier = 1 + Math.max(0, level - 1) * SPAWN_RATE_PER_LEVEL;
  const min = Math.max(MIN_INTERVAL_FLOOR_MS, MIN_SPAWN_INTERVAL_MS / spawnRateMultiplier);
  const max = Math.max(MAX_INTERVAL_FLOOR_MS, MAX_SPAWN_INTERVAL_MS / spawnRateMultiplier);
  return randomBetween(min, max);
}

function getSpawnBatchSize(level: number): number {
  "worklet";
  if (level >= 5 && Math.random() < 0.2) {
    return 3;
  }
  if (level >= 3 && Math.random() < 0.35) {
    return 2;
  }
  return 1;
}

function getFurthestWorldX(obstacles: ObstacleInstance[], fallback: number): number {
  let furthest = fallback;
  for (const obstacle of obstacles) {
    const rightEdge = obstacle.worldX + obstacle.width;
    if (rightEdge > furthest) {
      furthest = rightEdge;
    }
  }
  return furthest;
}

function createFishObstacle(id: string, worldX: number, spawnTimeMs: number): FishObstacle {
  const fishCount = randomIntInclusive(FISH_SCHOOL_MIN, FISH_SCHOOL_MAX);
  return {
    id,
    kind: "fish",
    worldX,
    spawnTimeMs,
    y: clamp(randomBetween(FISH_Y_MIN, FISH_Y_MAX), SAFE_ZONE_TOP, SAFE_ZONE_BOTTOM),
    fishCount,
    width: (fishCount - 1) * FISH_SPACING + FISH_SPRITE_LENGTH,
    height: 24,
    speed: FISH_SPEED_UNITS_PER_MS,
    despawnPastLeft: FISH_DESPAWN_PAST_LEFT,
  };
}

function createTurtleObstacle(id: string, worldX: number, spawnTimeMs: number): TurtleObstacle {
  const amplitude = randomBetween(SEA_TURTLE_AMPLITUDE_MIN, SEA_TURTLE_AMPLITUDE_MAX);
  const minBaseY = Math.max(TURTLE_Y_MIN, SAFE_ZONE_TOP + amplitude);
  const maxBaseY = Math.min(TURTLE_Y_MAX, SAFE_ZONE_BOTTOM - amplitude);

  return {
    id,
    kind: "turtle",
    worldX,
    spawnTimeMs,
    baseY: randomBetween(minBaseY, Math.max(minBaseY + 1, maxBaseY)),
    amplitude,
    frequency: randomBetween(SEA_TURTLE_FREQUENCY_MIN, SEA_TURTLE_FREQUENCY_MAX),
    width: SEA_TURTLE_SPRITE_LENGTH,
    height: 50,
    speed: SEA_TURTLE_SPEED_UNITS_PER_MS,
    despawnPastLeft: SEA_TURTLE_DESPAWN_PAST_LEFT,
  };
}

function createCoralObstacle(id: string, worldX: number): CoralObstacle {
  const scale = randomBetween(0.85, 1.3);
  const variant = randomCoralVariant();

  return {
    id,
    kind: "coral",
    worldX,
    baseY: randomBetween(CORAL_BASE_Y_MIN, CORAL_BASE_Y_MAX),
    scale,
    branchPath: variant.branchPath,
    innerBranchPath: variant.innerBranchPath,
    palette: randomCoralPalette(),
    width: CORAL_WIDTH * scale,
    height: 108 * scale,
    speed: CORAL_SCROLL_UNITS_PER_MS,
    despawnPastLeft: CORAL_DESPAWN_PAST_LEFT,
  };
}

function createObstacle(
  id: string,
  kind: ObstacleKind,
  worldX: number,
  spawnTimeMs: number,
): ObstacleInstance {
  switch (kind) {
    case "fish":
      return createFishObstacle(id, worldX, spawnTimeMs);
    case "turtle":
      return createTurtleObstacle(id, worldX, spawnTimeMs);
    case "coral":
      return createCoralObstacle(id, worldX);
  }
}

function getObstacleWorldX(
  obstacle: ObstacleInstance,
  elapsedMs: number,
  speedMultiplier: number,
): number {
  "worklet";
  if (obstacle.kind === "coral") {
    return obstacle.worldX;
  }
  return obstacle.worldX - obstacle.speed * speedMultiplier * Math.max(0, elapsedMs - obstacle.spawnTimeMs);
}

function releaseObstacle(obstacle: ObstacleInstance): void {
  void obstacle;
}

export function useObstacleSpawner(
  paused: boolean,
  level: number,
  scrollController: ScrollController,
  timeMs: SharedValue<number>,
): UseObstacleSpawnerResult {
  const [state, setState] = useState<ObstacleSpawnerState>({
    obstacles: [],
  });

  const obstacleIdRef = useRef(0);
  const stateRef = useRef(state);
  const obstacleSnapshots = useSharedValue<ObstacleFrameSnapshot[]>([]);
  const nextSpawnInMs = useSharedValue(nextSpawnIntervalMs(1));
  const lastUpdateTimeMs = useSharedValue(0);
  const jsFrameDispatchPending = useSharedValue(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    obstacleSnapshots.value = state.obstacles.map((obstacle) => ({
      id: obstacle.id,
      kind: obstacle.kind,
      worldX: obstacle.worldX,
      spawnTimeMs: obstacle.kind === "coral" ? 0 : obstacle.spawnTimeMs,
      width: obstacle.width,
      speed: obstacle.speed,
      despawnPastLeft: obstacle.despawnPastLeft,
    }));
    jsFrameDispatchPending.value = false;
  }, [jsFrameDispatchPending, obstacleSnapshots, state.obstacles]);

  useEffect(() => {
    nextSpawnInMs.value = Math.min(nextSpawnInMs.value, nextSpawnIntervalMs(level));
  }, [level, nextSpawnInMs]);

  const removeObstacle = useCallback((id: string) => {
    setState((current) => {
      let removed: ObstacleInstance | null = null;
      const filtered = current.obstacles.filter((obstacle) => {
        if (obstacle.id === id) {
          removed = obstacle;
          return false;
        }
        return true;
      });
      if (removed == null) {
        return current;
      }
      releaseObstacle(removed);

      const nextState = {
        ...current,
        obstacles: filtered,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const processFrameEvents = useCallback((
    removeIds: string[],
    spawnBatchSize: number,
    elapsedMs: number,
    scrollX: number,
  ) => {
    if (removeIds.length === 0 && spawnBatchSize === 0) {
      return;
    }

    const removeIdSet = new Set(removeIds);
    let changed = false;
    setState((current) => {
      const nextObstacles: ObstacleInstance[] = [];

      for (const obstacle of current.obstacles) {
        if (removeIdSet.has(obstacle.id)) {
          releaseObstacle(obstacle);
          changed = true;
          continue;
        }
        nextObstacles.push(obstacle);
      }

      if (spawnBatchSize > 0 && nextObstacles.length < MAX_ACTIVE_OBSTACLES) {
        const furthestWorldX = getFurthestWorldX(nextObstacles, scrollX + GAME_WIDTH);
        const spawned: ObstacleInstance[] = [];

        for (
          let index = 0;
          index < spawnBatchSize && nextObstacles.length + spawned.length < MAX_ACTIVE_OBSTACLES;
          index += 1
        ) {
          const kind = randomObstacleKind();
          const previousRightEdge =
            spawned.length > 0
              ? spawned[spawned.length - 1].worldX + spawned[spawned.length - 1].width
              : furthestWorldX;
          const spawnWorldX = Math.max(
            scrollX + GAME_WIDTH + SPAWN_BUFFER_X,
            previousRightEdge +
              MIN_OBSTACLE_DISTANCE +
              index * Math.max(0, COMPLEX_PATTERN_GAP_X - 40 * (level - 1)),
          );

          obstacleIdRef.current += 1;
          spawned.push(
            createObstacle(`obstacle-${obstacleIdRef.current}`, kind, spawnWorldX, elapsedMs),
          );
        }

        if (spawned.length > 0) {
          nextObstacles.push(...spawned);
          changed = true;
        }
      }

      if (!changed) {
        return current;
      }

      const nextState: ObstacleSpawnerState = { obstacles: nextObstacles };
      stateRef.current = nextState;
      return nextState;
    });
    queueMicrotask(() => {
      jsFrameDispatchPending.value = false;
    });
  }, [jsFrameDispatchPending, level]);

  const frame = useFrameCallback(() => {
    "worklet";
    const elapsedMs = timeMs.value;
    const deltaMs = Math.min(
      MAX_FRAME_STEP_MS,
      Math.max(0, elapsedMs - lastUpdateTimeMs.value),
    );
    lastUpdateTimeMs.value = elapsedMs;

    if (jsFrameDispatchPending.value) {
      return;
    }

    const speedMultiplier = scrollController.speedMultiplier.value;
    const scrollX = scrollController.scrollX.value;
    const snapshots = obstacleSnapshots.value;
    const removeIds: string[] = [];

    for (let index = 0; index < snapshots.length; index += 1) {
      const obstacle = snapshots[index];
      const obstacleWorldX =
        obstacle.kind === "coral"
          ? obstacle.worldX
          : obstacle.worldX - obstacle.speed * speedMultiplier * Math.max(0, elapsedMs - obstacle.spawnTimeMs);
      if (obstacleWorldX + obstacle.width < -obstacle.despawnPastLeft) {
        removeIds.push(obstacle.id);
      }
    }

    nextSpawnInMs.value -= deltaMs;

    let spawnBatchSize = 0;
    const activeAfterRemovals = snapshots.length - removeIds.length;
    if (nextSpawnInMs.value <= 0 && activeAfterRemovals < MAX_ACTIVE_OBSTACLES) {
      spawnBatchSize = getSpawnBatchSize(level);
      nextSpawnInMs.value = nextSpawnIntervalMs(level);
    }

    if (removeIds.length > 0 || spawnBatchSize > 0) {
      jsFrameDispatchPending.value = true;
      runOnJS(processFrameEvents)(removeIds, spawnBatchSize, elapsedMs, scrollX);
    }
  }, false);

  useEffect(() => {
    lastUpdateTimeMs.value = timeMs.value;
    frame.setActive(!paused);
    return () => frame.setActive(false);
  }, [frame, lastUpdateTimeMs, paused, timeMs]);

  useEffect(() => {
    return () => {
      for (const obstacle of stateRef.current.obstacles) {
        releaseObstacle(obstacle);
      }
    };
  }, []);

  return {
    ...state,
    removeObstacle,
  };
}

export function getFishBodyWobbleTransforms(
  elapsedMs: number,
): FishBodyWobbleTuple {
  "worklet";
  return [
    [{ rotate: Math.sin(elapsedMs * 0.007 + 0 * 0.85) * 0.3 }],
    [{ rotate: Math.sin(elapsedMs * 0.007 + 1 * 0.85) * 0.3 }],
    [{ rotate: Math.sin(elapsedMs * 0.007 + 2 * 0.85) * 0.3 }],
    [{ rotate: Math.sin(elapsedMs * 0.007 + 3 * 0.85) * 0.3 }],
    [{ rotate: Math.sin(elapsedMs * 0.007 + 4 * 0.85) * 0.3 }],
    [{ rotate: Math.sin(elapsedMs * 0.007 + 5 * 0.85) * 0.3 }],
    [{ rotate: Math.sin(elapsedMs * 0.007 + 6 * 0.85) * 0.3 }],
    [{ rotate: Math.sin(elapsedMs * 0.007 + 7 * 0.85) * 0.3 }],
  ] as FishBodyWobbleTuple;
}

export function getTurtleFlipperTransforms(elapsedMs: number): {
  flipperFrontUpper: FishSchoolGroupTransform;
  flipperFrontLower: FishSchoolGroupTransform;
  flipperRearUpper: FishSchoolGroupTransform;
  flipperRearLower: FishSchoolGroupTransform;
} {
  "worklet";
  return {
    flipperFrontUpper: [{ rotate: Math.sin(elapsedMs * 0.011 + 0.4) * 0.52 }],
    flipperFrontLower: [{ rotate: Math.sin(elapsedMs * 0.011 + 2.1) * -0.48 }],
    flipperRearUpper: [{ rotate: Math.sin(elapsedMs * 0.009 + 1.2) * 0.42 }],
    flipperRearLower: [{ rotate: Math.sin(elapsedMs * 0.009 + 2.9) * -0.4 }],
  };
}

type TurtleMotionSample = Pick<
  TurtleObstacle,
  "baseY" | "amplitude" | "frequency" | "spawnTimeMs"
>;

export function getTurtleOffsetY(
  obstacle: TurtleMotionSample,
  elapsedMs: number,
): number {
  "worklet";
  const turtleElapsedMs = Math.max(0, elapsedMs - obstacle.spawnTimeMs);
  const phase =
    2 *
    Math.PI *
    (obstacle.frequency * SEA_TURTLE_FREQ_TO_BOB_HZ) *
    (turtleElapsedMs * 0.001);
  return obstacle.baseY + obstacle.amplitude * Math.sin(phase);
}

export function getObstacleWorldOffsetX(
  obstacle: ObstacleInstance,
  elapsedMs: number,
  speedMultiplier: number,
): number {
  "worklet";
  return getObstacleWorldX(obstacle, elapsedMs, speedMultiplier);
}
