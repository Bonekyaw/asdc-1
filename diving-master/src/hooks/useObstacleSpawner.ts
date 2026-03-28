import { useCallback, useEffect, useRef, useState } from "react";

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
  x: number;
  worldX: number;
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
  x: number;
  worldX: number;
  baseY: number;
  y: number;
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
  x: number;
  worldX: number;
  baseY: number;
  y: number;
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
  elapsedMs: number;
  level: number;
  scrollX: number;
  obstacles: ObstacleInstance[];
}

export interface UseObstacleSpawnerResult extends ObstacleSpawnerState {
  removeObstacle: (id: string) => void;
}

const FISH_WEIGHT = 0.4;
const TURTLE_WEIGHT = 0.35;
const MIN_SPAWN_INTERVAL_MS = 2000;
const MAX_SPAWN_INTERVAL_MS = 5000;
const MIN_INTERVAL_FLOOR_MS = 900;
const MAX_INTERVAL_FLOOR_MS = 2200;
const MIN_OBSTACLE_DISTANCE = 180;
const SPAWN_BUFFER_X = 48;
const COMPLEX_PATTERN_GAP_X = 160;
const SCROLL_SPEED_PER_LEVEL = 0.1;
const SPAWN_RATE_PER_LEVEL = 0.15;
const SAFE_ZONE_TOP = 70;
const SAFE_ZONE_BOTTOM = GAME_HEIGHT - 54;
const FISH_Y_MIN = 96;
const FISH_Y_MAX = GAME_HEIGHT - 120;
const TURTLE_Y_MIN = 120;
const TURTLE_Y_MAX = GAME_HEIGHT - 120;
const CORAL_BASE_Y_MIN = GAME_HEIGHT - 70;
const CORAL_BASE_Y_MAX = GAME_HEIGHT - 28;

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min: number, max: number): number {
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

function getSpeedMultiplier(level: number): number {
  return 1 + Math.max(0, level - 1) * SCROLL_SPEED_PER_LEVEL;
}

function nextSpawnIntervalMs(level: number): number {
  const spawnRateMultiplier = 1 + Math.max(0, level - 1) * SPAWN_RATE_PER_LEVEL;
  const min = Math.max(MIN_INTERVAL_FLOOR_MS, MIN_SPAWN_INTERVAL_MS / spawnRateMultiplier);
  const max = Math.max(MAX_INTERVAL_FLOOR_MS, MAX_SPAWN_INTERVAL_MS / spawnRateMultiplier);
  return randomBetween(min, max);
}

function getSpawnBatchSize(level: number): number {
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

function createFishObstacle(id: string, worldX: number): FishObstacle {
  const fishCount = randomIntInclusive(FISH_SCHOOL_MIN, FISH_SCHOOL_MAX);
  return {
    id,
    kind: "fish",
    x: worldX,
    worldX,
    y: clamp(randomBetween(FISH_Y_MIN, FISH_Y_MAX), SAFE_ZONE_TOP, SAFE_ZONE_BOTTOM),
    fishCount,
    width: (fishCount - 1) * FISH_SPACING + FISH_SPRITE_LENGTH,
    height: 24,
    speed: FISH_SPEED_UNITS_PER_MS,
    despawnPastLeft: FISH_DESPAWN_PAST_LEFT,
  };
}

function createTurtleObstacle(id: string, worldX: number): TurtleObstacle {
  const amplitude = randomBetween(SEA_TURTLE_AMPLITUDE_MIN, SEA_TURTLE_AMPLITUDE_MAX);
  const minBaseY = Math.max(TURTLE_Y_MIN, SAFE_ZONE_TOP + amplitude);
  const maxBaseY = Math.min(TURTLE_Y_MAX, SAFE_ZONE_BOTTOM - amplitude);

  return {
    id,
    kind: "turtle",
    x: worldX,
    worldX,
    baseY: randomBetween(minBaseY, Math.max(minBaseY + 1, maxBaseY)),
    y: 0,
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
    x: worldX,
    worldX,
    baseY: randomBetween(CORAL_BASE_Y_MIN, CORAL_BASE_Y_MAX),
    y: 0,
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

function createObstacle(id: string, kind: ObstacleKind, worldX: number): ObstacleInstance {
  switch (kind) {
    case "fish":
      return createFishObstacle(id, worldX);
    case "turtle":
      return createTurtleObstacle(id, worldX);
    case "coral":
      return createCoralObstacle(id, worldX);
  }
}

export function useObstacleSpawner(
  paused: boolean,
  level: number,
): UseObstacleSpawnerResult {
  const [state, setState] = useState<ObstacleSpawnerState>({
    elapsedMs: 0,
    level: 1,
    scrollX: 0,
    obstacles: [],
  });

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const nextSpawnInMsRef = useRef(nextSpawnIntervalMs(1));
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    setState((current) => {
      if (current.level === level) {
        return current;
      }

      const nextState = {
        ...current,
        level,
      };
      stateRef.current = nextState;
      return nextState;
    });

    nextSpawnInMsRef.current = Math.min(nextSpawnInMsRef.current, nextSpawnIntervalMs(level));
  }, [level]);

  const removeObstacle = useCallback((id: string) => {
    setState((current) => {
      const filtered = current.obstacles.filter((obstacle) => obstacle.id !== id);
      if (filtered.length === current.obstacles.length) {
        return current;
      }

      const nextState = {
        ...current,
        obstacles: filtered,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  useEffect(() => {
    if (paused) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameRef.current = null;
      return;
    }

    const tick = (frameTime: number) => {
      if (lastFrameRef.current == null) {
        lastFrameRef.current = frameTime;
      }

      const dt = frameTime - lastFrameRef.current;
      lastFrameRef.current = frameTime;
      elapsedRef.current += dt;

      const prev = stateRef.current;
      const elapsedMs = elapsedRef.current;
      const currentLevel = level;
      const speedMultiplier = getSpeedMultiplier(currentLevel);
      const scrollAdvance = CORAL_SCROLL_UNITS_PER_MS * speedMultiplier * dt;
      const scrollX = prev.scrollX + scrollAdvance;

      let obstacles = prev.obstacles
        .map((obstacle) => ({
          ...obstacle,
          x:
            obstacle.kind === "coral"
              ? obstacle.worldX
              : obstacle.worldX - obstacle.speed * speedMultiplier * dt,
          worldX:
            obstacle.kind === "coral"
              ? obstacle.worldX
              : obstacle.worldX - obstacle.speed * speedMultiplier * dt,
          y:
            obstacle.kind === "turtle"
              ? obstacle.baseY +
                obstacle.amplitude *
                  Math.sin(
                    2 *
                      Math.PI *
                      (obstacle.frequency * SEA_TURTLE_FREQ_TO_BOB_HZ) *
                      (elapsedMs * 0.001),
                  )
              : obstacle.kind === "coral"
                ? obstacle.baseY - obstacle.height
                : obstacle.y - obstacle.height * 0.5,
        }))
        .filter((obstacle) => obstacle.worldX + obstacle.width >= -obstacle.despawnPastLeft);

      nextSpawnInMsRef.current -= dt;

      if (nextSpawnInMsRef.current <= 0) {
        const furthestWorldX = getFurthestWorldX(obstacles, scrollX + GAME_WIDTH);
        const spawnBatchSize = getSpawnBatchSize(currentLevel);
        const nextObstacles: ObstacleInstance[] = [];

        for (let index = 0; index < spawnBatchSize; index += 1) {
          const kind = randomObstacleKind();
          const previousRightEdge =
            nextObstacles.length > 0
              ? nextObstacles[nextObstacles.length - 1].worldX +
                nextObstacles[nextObstacles.length - 1].width
              : furthestWorldX;
          const spawnWorldX = Math.max(
            scrollX + GAME_WIDTH + SPAWN_BUFFER_X,
            previousRightEdge +
              MIN_OBSTACLE_DISTANCE +
              index * Math.max(0, COMPLEX_PATTERN_GAP_X - 40 * (currentLevel - 1)),
          );

          obstacleIdRef.current += 1;
          nextObstacles.push(
            createObstacle(`obstacle-${obstacleIdRef.current}`, kind, spawnWorldX),
          );
        }

        obstacles = [...obstacles, ...nextObstacles];
        nextSpawnInMsRef.current = nextSpawnIntervalMs(currentLevel);
      }

      const nextState: ObstacleSpawnerState = {
        elapsedMs,
        level: currentLevel,
        scrollX,
        obstacles,
      };

      stateRef.current = nextState;
      setState(nextState);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastFrameRef.current = null;
    };
  }, [level, paused, removeObstacle]);

  return {
    ...state,
    removeObstacle,
  };
}

export function getFishBodyWobbleTransforms(
  elapsedMs: number,
): FishBodyWobbleTuple {
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
  return {
    flipperFrontUpper: [{ rotate: Math.sin(elapsedMs * 0.011 + 0.4) * 0.52 }],
    flipperFrontLower: [{ rotate: Math.sin(elapsedMs * 0.011 + 2.1) * -0.48 }],
    flipperRearUpper: [{ rotate: Math.sin(elapsedMs * 0.009 + 1.2) * 0.42 }],
    flipperRearLower: [{ rotate: Math.sin(elapsedMs * 0.009 + 2.9) * -0.4 }],
  };
}

export function getTurtleOffsetY(
  obstacle: TurtleObstacle,
  elapsedMs: number,
): number {
  const phase = 2 * Math.PI * (obstacle.frequency * SEA_TURTLE_FREQ_TO_BOB_HZ) * (elapsedMs * 0.001);
  return obstacle.baseY + obstacle.amplitude * Math.sin(phase);
}
