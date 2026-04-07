import { useCallback, useEffect, useRef, useState } from "react";
import {
  runOnJS,
  type SharedValue,
  useFrameCallback,
  useSharedValue,
} from "react-native-reanimated";

import {
  COIN_SIZE,
  COIN_DESPAWN_PAST_LEFT,
  COIN_INITIAL_WORLD_X,
  COIN_ROTATION_PERIOD_MS,
  COIN_SAFE_Y_MAX,
  COIN_SAFE_Y_MIN,
  COIN_SPARKLE_DURATION_MS,
} from "@/src/constants/coin";
import {
  DIAMOND_SIZE,
  DIAMOND_DESPAWN_PAST_LEFT,
  DIAMOND_PULSE_PERIOD_MS,
  DIAMOND_SPARKLE_DURATION_MS,
} from "@/src/constants/diamond";
import { GAME_WIDTH } from "@/src/constants/game-viewport";
import type { CoinSparkle } from "@/src/types/coin";
import type { ObstacleInstance } from "@/src/hooks/useObstacleSpawner";
import {
  getCollectibleAabb,
  getObstacleAabb,
  overlapsAabb,
} from "@/src/utils/collision";

const DIAMOND_SPAWN_RATE = 0.3;
const COLLECTIBLE_MIN_SPAWN_INTERVAL_MS = 1000;
const COLLECTIBLE_MAX_SPAWN_INTERVAL_MS = 3000;
const COLLECTIBLE_PATTERN_GAP_X = 38;
const COLLECTIBLE_PATTERN_SAFE_MARGIN = 20;
const COLLECTIBLE_ARC_HEIGHT = 34;
const MAX_ACTIVE_COLLECTIBLES = 16;
const MAX_FRAME_STEP_MS = 48;

export interface CollectibleInstance {
  id: string;
  kind: "coin" | "diamond";
  worldX: number;
  y: number;
  width: number;
  height: number;
  collectedAtMs: number | null;
}

export interface UseCollectibleSpawnerResult {
  collectibles: CollectibleInstance[];
}

export interface CollectibleSpawnerActions {
  collectCollectible: (id: string, collectedAtMs: number) => void;
  removeCollectible: (id: string) => void;
}

export interface UseCollectibleSpawnerResultWithActions
  extends UseCollectibleSpawnerResult,
    CollectibleSpawnerActions {}

type CollectibleFrameSnapshot = {
  id: string;
  kind: CollectibleInstance["kind"];
  worldX: number;
  collectedAtMs: number | null;
};

function randomBetween(min: number, max: number): number {
  "worklet";
  return min + Math.random() * (max - min);
}

function nextSpawnDelayMs(): number {
  "worklet";
  return randomBetween(
    COLLECTIBLE_MIN_SPAWN_INTERVAL_MS,
    COLLECTIBLE_MAX_SPAWN_INTERVAL_MS,
  );
}

function randomCollectibleKind(): CollectibleInstance["kind"] {
  return Math.random() < DIAMOND_SPAWN_RATE ? "diamond" : "coin";
}

function collectibleDespawnPastLeft(kind: CollectibleInstance["kind"]): number {
  "worklet";
  return kind === "diamond" ? DIAMOND_DESPAWN_PAST_LEFT : COIN_DESPAWN_PAST_LEFT;
}

function collectibleSparkleDuration(kind: CollectibleInstance["kind"]): number {
  "worklet";
  return kind === "diamond"
    ? DIAMOND_SPARKLE_DURATION_MS
    : COIN_SPARKLE_DURATION_MS;
}

function overlapsObstacle(
  worldX: number,
  y: number,
  obstacles: ObstacleInstance[],
  scrollX: number,
  elapsedMs: number,
  speedMultiplier: number,
): boolean {
  const collectibleBox = getCollectibleAabb(
    { kind: "diamond", worldX, y },
    scrollX,
  );
  return obstacles.some((obstacle) => {
    const obstacleBox = getObstacleAabb(obstacle, scrollX, elapsedMs, speedMultiplier);
    return overlapsAabb(collectibleBox, obstacleBox);
  });
}

function clampCollectibleY(y: number): number {
  return Math.min(
    COIN_SAFE_Y_MAX - COLLECTIBLE_PATTERN_SAFE_MARGIN,
    Math.max(COIN_SAFE_Y_MIN + COLLECTIBLE_PATTERN_SAFE_MARGIN, y),
  );
}

function tryAdjustY(
  worldX: number,
  preferredY: number,
  obstacles: ObstacleInstance[],
  scrollX: number,
  elapsedMs: number,
  speedMultiplier: number,
): number | null {
  const candidates = [
    preferredY,
    preferredY - 46,
    preferredY + 46,
    preferredY - 86,
    preferredY + 86,
  ].map(clampCollectibleY);

  for (const candidate of candidates) {
    if (!overlapsObstacle(worldX, candidate, obstacles, scrollX, elapsedMs, speedMultiplier)) {
      return candidate;
    }
  }

  return null;
}

function createSinglePattern(
  startX: number,
  baseY: number,
  obstacles: ObstacleInstance[],
  scrollX: number,
  elapsedMs: number,
  speedMultiplier: number,
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const adjustedY = tryAdjustY(startX, baseY, obstacles, scrollX, elapsedMs, speedMultiplier);
  return adjustedY == null ? [] : [{ worldX: startX, y: adjustedY }];
}

function createLinePattern(
  startX: number,
  baseY: number,
  obstacles: ObstacleInstance[],
  scrollX: number,
  elapsedMs: number,
  speedMultiplier: number,
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const count = 3 + Math.floor(Math.random() * 2);
  const collectibles: Pick<CollectibleInstance, "worldX" | "y">[] = [];

  for (let index = 0; index < count; index += 1) {
    const worldX = startX + index * COLLECTIBLE_PATTERN_GAP_X;
    const adjustedY = tryAdjustY(
      worldX,
      baseY,
      obstacles,
      scrollX,
      elapsedMs,
      speedMultiplier,
    );
    if (adjustedY == null) {
      continue;
    }
    collectibles.push({ worldX, y: adjustedY });
  }

  return collectibles;
}

function createArcPattern(
  startX: number,
  baseY: number,
  obstacles: ObstacleInstance[],
  scrollX: number,
  elapsedMs: number,
  speedMultiplier: number,
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const count = 5;
  const collectibles: Pick<CollectibleInstance, "worldX" | "y">[] = [];

  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const arcOffset = Math.sin(t * Math.PI) * COLLECTIBLE_ARC_HEIGHT;
    const worldX = startX + index * COLLECTIBLE_PATTERN_GAP_X;
    const preferredY = clampCollectibleY(baseY - arcOffset);
    const adjustedY = tryAdjustY(
      worldX,
      preferredY,
      obstacles,
      scrollX,
      elapsedMs,
      speedMultiplier,
    );
    if (adjustedY == null) {
      continue;
    }
    collectibles.push({ worldX, y: adjustedY });
  }

  return collectibles;
}

function createCollectiblePattern(
  scrollX: number,
  obstacles: ObstacleInstance[],
  elapsedMs: number,
  speedMultiplier: number,
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const startX = scrollX + GAME_WIDTH + randomBetween(110, 230);
  const baseY = randomBetween(COIN_SAFE_Y_MIN + 24, COIN_SAFE_Y_MAX - 24);
  const roll = Math.random();

  if (roll < 0.4) {
    return createSinglePattern(startX, baseY, obstacles, scrollX, elapsedMs, speedMultiplier);
  }
  if (roll < 0.75) {
    return createLinePattern(startX, baseY, obstacles, scrollX, elapsedMs, speedMultiplier);
  }
  return createArcPattern(startX, baseY, obstacles, scrollX, elapsedMs, speedMultiplier);
}

function createCollectibleFromPatternPoint(
  id: string,
  point: Pick<CollectibleInstance, "worldX" | "y">,
  initial = false,
): CollectibleInstance {
  const kind = randomCollectibleKind();
  return {
    id,
    kind,
    worldX: initial ? COIN_INITIAL_WORLD_X : point.worldX,
    y: point.y,
    width: 34,
    height: 34,
    collectedAtMs: null,
  };
}

export function getCollectibleRotation(elapsedMs: number): number {
  return ((elapsedMs % COIN_ROTATION_PERIOD_MS) / COIN_ROTATION_PERIOD_MS) * Math.PI * 2;
}

export function getCollectibleSparkles(
  collectible: CollectibleInstance,
  elapsedMs: number,
): CoinSparkle[] {
  if (collectible.collectedAtMs == null) {
    return [];
  }

  const duration = collectibleSparkleDuration(collectible.kind);
  const progress = Math.min(1, (elapsedMs - collectible.collectedAtMs) / duration);
  const opacity = 1 - progress;
  const baseRadius =
    collectible.kind === "diamond"
      ? 5 + progress * 10
      : 3 + progress * 8;
  const offsets =
    collectible.kind === "diamond"
      ? [
          { x: -16, y: -13 },
          { x: 15, y: -10 },
          { x: -10, y: 15 },
          { x: 18, y: 12 },
        ]
      : [
          { x: -14, y: -11 },
          { x: 13, y: -8 },
          { x: -8, y: 13 },
          { x: 16, y: 10 },
        ];

  return offsets.map((offset, index) => ({
    x: offset.x * (0.7 + progress * 0.6),
    y: offset.y * (0.7 + progress * 0.6),
    radius: baseRadius + (index % 2),
    opacity:
      collectible.kind === "diamond"
        ? Math.min(1, opacity * 1.15)
        : opacity,
  }));
}

export function getDiamondScale(elapsedMs: number): number {
  return 1 + Math.sin((elapsedMs / DIAMOND_PULSE_PERIOD_MS) * Math.PI * 2) * 0.1;
}

export function useCollectibleSpawner(
  paused: boolean,
  timeMs: SharedValue<number>,
  scrollX: SharedValue<number>,
  speedMultiplier: SharedValue<number>,
  _swimmerY: SharedValue<number>,
  obstacles: ObstacleInstance[],
): UseCollectibleSpawnerResultWithActions {
  const [state, setState] = useState<UseCollectibleSpawnerResult>({
    collectibles: [
      createCollectibleFromPatternPoint(
        "collectible-1",
        { worldX: COIN_INITIAL_WORLD_X, y: randomBetween(COIN_SAFE_Y_MIN, COIN_SAFE_Y_MAX) },
        true,
      ),
    ],
  });

  const stateRef = useRef(state);
  const obstaclesRef = useRef(obstacles);
  const collectibleIdRef = useRef(1);
  const collectibleSnapshots = useSharedValue<CollectibleFrameSnapshot[]>([]);
  const nextSpawnInMs = useSharedValue(nextSpawnDelayMs());
  const lastUpdateTimeMs = useSharedValue(0);
  const jsFrameDispatchPending = useSharedValue(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    collectibleSnapshots.value = state.collectibles.map((collectible) => ({
      id: collectible.id,
      kind: collectible.kind,
      worldX: collectible.worldX,
      collectedAtMs: collectible.collectedAtMs,
    }));
    jsFrameDispatchPending.value = false;
  }, [collectibleSnapshots, jsFrameDispatchPending, state.collectibles]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  const removeCollectible = useCallback((id: string) => {
    setState((current) => {
      let removed: CollectibleInstance | null = null;
      const filtered = current.collectibles.filter((collectible) => {
        if (collectible.id === id) {
          removed = collectible;
          return false;
        }
        return true;
      });
      if (removed == null) {
        return current;
      }

      const nextState = {
        ...current,
        collectibles: filtered,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const collectCollectible = useCallback((id: string, collectedAtMs: number) => {
    setState((current) => {
      let changed = false;
      const nextCollectibles = current.collectibles.map((collectible) => {
        if (collectible.id !== id || collectible.collectedAtMs != null) {
          return collectible;
        }
        changed = true;
        return {
          ...collectible,
          collectedAtMs,
        };
      });

      if (!changed) {
        return current;
      }

      const nextState = {
        ...current,
        collectibles: nextCollectibles,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, []);

  const processFrameEvents = useCallback((
    removeIds: string[],
    shouldSpawn: boolean,
    scrollPosition: number,
    elapsedMs: number,
    currentSpeedMultiplier: number,
  ) => {
    if (removeIds.length === 0 && !shouldSpawn) {
      return;
    }

    const removeIdSet = new Set(removeIds);
    let changed = false;
    setState((current) => {
      let collectibles = current.collectibles.filter((collectible) => {
        if (!removeIdSet.has(collectible.id)) {
          return true;
        }
        changed = true;
        return false;
      });

      if (shouldSpawn && collectibles.length < MAX_ACTIVE_COLLECTIBLES) {
        const pattern = createCollectiblePattern(
          scrollPosition,
          obstaclesRef.current,
          elapsedMs,
          currentSpeedMultiplier,
        );
        if (pattern.length > 0) {
          const nextCollectibles = pattern
            .slice(0, Math.max(0, MAX_ACTIVE_COLLECTIBLES - collectibles.length))
            .map((point) => {
              collectibleIdRef.current += 1;
              return createCollectibleFromPatternPoint(
                `collectible-${collectibleIdRef.current}`,
                point,
              );
            });
          if (nextCollectibles.length > 0) {
            collectibles = [...collectibles, ...nextCollectibles];
            changed = true;
          }
        }
      }

      if (!changed) {
        return current;
      }

      const nextState: UseCollectibleSpawnerResult = { collectibles };
      stateRef.current = nextState;
      return nextState;
    });
    queueMicrotask(() => {
      jsFrameDispatchPending.value = false;
    });
  }, [jsFrameDispatchPending]);

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

    const scrollPosition = scrollX.value;
    const currentSpeedMultiplier = speedMultiplier.value;
    const snapshots = collectibleSnapshots.value;
    const removeIds: string[] = [];

    for (let index = 0; index < snapshots.length; index += 1) {
      const collectible = snapshots[index];
      if (collectible.collectedAtMs != null) {
        if (elapsedMs - collectible.collectedAtMs >= collectibleSparkleDuration(collectible.kind)) {
          removeIds.push(collectible.id);
        }
        continue;
      }

      const rightEdge =
        collectible.worldX - scrollPosition + (collectible.kind === "diamond" ? DIAMOND_SIZE : COIN_SIZE);
      if (rightEdge < -collectibleDespawnPastLeft(collectible.kind)) {
        removeIds.push(collectible.id);
      }
    }

    nextSpawnInMs.value -= deltaMs;
    const activeAfterRemovals = snapshots.length - removeIds.length;
    let shouldSpawn = false;
    if (nextSpawnInMs.value <= 0 && activeAfterRemovals < MAX_ACTIVE_COLLECTIBLES) {
      shouldSpawn = true;
      nextSpawnInMs.value = nextSpawnDelayMs();
    }

    if (removeIds.length > 0 || shouldSpawn) {
      jsFrameDispatchPending.value = true;
      runOnJS(processFrameEvents)(
        removeIds,
        shouldSpawn,
        scrollPosition,
        elapsedMs,
        currentSpeedMultiplier,
      );
    }
  }, false);

  useEffect(() => {
    lastUpdateTimeMs.value = timeMs.value;
    frame.setActive(!paused);
    return () => frame.setActive(false);
  }, [frame, lastUpdateTimeMs, paused, timeMs]);

  useEffect(() => {
    return () => undefined;
  }, []);

  return {
    ...state,
    collectCollectible,
    removeCollectible,
  };
}
