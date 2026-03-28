import { useCallback, useEffect, useRef, useState } from "react";
import {
  type SharedValue,
} from "react-native-reanimated";

import {
  COIN_DESPAWN_PAST_LEFT,
  COIN_INITIAL_WORLD_X,
  COIN_ROTATION_PERIOD_MS,
  COIN_SAFE_Y_MAX,
  COIN_SAFE_Y_MIN,
  COIN_SPARKLE_DURATION_MS,
} from "@/src/constants/coin";
import {
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
  getSpawnCollectibleAabb,
  overlapsAabb,
} from "@/src/utils/collision";

const DIAMOND_SPAWN_RATE = 0.3;
const COLLECTIBLE_MIN_SPAWN_INTERVAL_MS = 1000;
const COLLECTIBLE_MAX_SPAWN_INTERVAL_MS = 3000;
const COLLECTIBLE_PATTERN_GAP_X = 38;
const COLLECTIBLE_PATTERN_SAFE_MARGIN = 20;
const COLLECTIBLE_ARC_HEIGHT = 34;

export interface CollectibleInstance {
  id: string;
  kind: "coin" | "diamond";
  x: number;
  worldX: number;
  y: number;
  width: number;
  height: number;
  collectedAtMs: number | null;
}

export interface UseCollectibleSpawnerResult {
  elapsedMs: number;
  collectibles: CollectibleInstance[];
}

export interface CollectibleSpawnerActions {
  collectCollectible: (id: string, collectedAtMs: number) => void;
  removeCollectible: (id: string) => void;
}

export interface UseCollectibleSpawnerResultWithActions
  extends UseCollectibleSpawnerResult,
    CollectibleSpawnerActions {}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function nextSpawnDelayMs(): number {
  return randomBetween(
    COLLECTIBLE_MIN_SPAWN_INTERVAL_MS,
    COLLECTIBLE_MAX_SPAWN_INTERVAL_MS,
  );
}

function randomCollectibleKind(): CollectibleInstance["kind"] {
  return Math.random() < DIAMOND_SPAWN_RATE ? "diamond" : "coin";
}

function collectibleDespawnPastLeft(kind: CollectibleInstance["kind"]): number {
  return kind === "diamond" ? DIAMOND_DESPAWN_PAST_LEFT : COIN_DESPAWN_PAST_LEFT;
}

function collectibleSparkleDuration(kind: CollectibleInstance["kind"]): number {
  return kind === "diamond"
    ? DIAMOND_SPARKLE_DURATION_MS
    : COIN_SPARKLE_DURATION_MS;
}

function overlapsObstacle(
  worldX: number,
  y: number,
  obstacles: ObstacleInstance[],
): boolean {
  const collectibleBox = getSpawnCollectibleAabb(worldX, y);
  return obstacles.some((obstacle) => {
    const obstacleBox = getObstacleAabb(obstacle, 0, 0);
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
): number | null {
  const candidates = [
    preferredY,
    preferredY - 46,
    preferredY + 46,
    preferredY - 86,
    preferredY + 86,
  ].map(clampCollectibleY);

  for (const candidate of candidates) {
    if (!overlapsObstacle(worldX, candidate, obstacles)) {
      return candidate;
    }
  }

  return null;
}

function createSinglePattern(
  startX: number,
  baseY: number,
  obstacles: ObstacleInstance[],
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const adjustedY = tryAdjustY(startX, baseY, obstacles);
  return adjustedY == null ? [] : [{ worldX: startX, y: adjustedY }];
}

function createLinePattern(
  startX: number,
  baseY: number,
  obstacles: ObstacleInstance[],
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const count = 3 + Math.floor(Math.random() * 2);
  const collectibles: Pick<CollectibleInstance, "worldX" | "y">[] = [];

  for (let index = 0; index < count; index += 1) {
    const worldX = startX + index * COLLECTIBLE_PATTERN_GAP_X;
    const adjustedY = tryAdjustY(worldX, baseY, obstacles);
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
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const count = 5;
  const collectibles: Pick<CollectibleInstance, "worldX" | "y">[] = [];

  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1);
    const arcOffset = Math.sin(t * Math.PI) * COLLECTIBLE_ARC_HEIGHT;
    const worldX = startX + index * COLLECTIBLE_PATTERN_GAP_X;
    const preferredY = clampCollectibleY(baseY - arcOffset);
    const adjustedY = tryAdjustY(worldX, preferredY, obstacles);
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
): Pick<CollectibleInstance, "worldX" | "y">[] {
  const startX = scrollX + GAME_WIDTH + randomBetween(110, 230);
  const baseY = randomBetween(COIN_SAFE_Y_MIN + 24, COIN_SAFE_Y_MAX - 24);
  const roll = Math.random();

  if (roll < 0.4) {
    return createSinglePattern(startX, baseY, obstacles);
  }
  if (roll < 0.75) {
    return createLinePattern(startX, baseY, obstacles);
  }
  return createArcPattern(startX, baseY, obstacles);
}

function createCollectibleFromPatternPoint(
  id: string,
  point: Pick<CollectibleInstance, "worldX" | "y">,
  initial = false,
): CollectibleInstance {
  return {
    id,
    kind: randomCollectibleKind(),
    x: initial ? COIN_INITIAL_WORLD_X : point.worldX,
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
  scrollX: number,
  _swimmerY: SharedValue<number>,
  obstacles: ObstacleInstance[],
): UseCollectibleSpawnerResultWithActions {
  const [state, setState] = useState<UseCollectibleSpawnerResult>({
    elapsedMs: 0,
    collectibles: [
      createCollectibleFromPatternPoint(
        "collectible-1",
        { worldX: COIN_INITIAL_WORLD_X, y: randomBetween(COIN_SAFE_Y_MIN, COIN_SAFE_Y_MAX) },
        true,
      ),
    ],
  });

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const stateRef = useRef(state);
  const scrollXRef = useRef(scrollX);
  const obstaclesRef = useRef(obstacles);
  const collectibleIdRef = useRef(1);
  const nextSpawnInMsRef = useRef(nextSpawnDelayMs());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    scrollXRef.current = scrollX;
  }, [scrollX]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  const removeCollectible = useCallback((id: string) => {
    setState((current) => {
      const filtered = current.collectibles.filter((collectible) => collectible.id !== id);
      if (filtered.length === current.collectibles.length) {
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

  useEffect(() => {
    if (paused) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
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
      const elapsedMs = elapsedRef.current;

      let collectibles = stateRef.current.collectibles
        .filter((collectible) => {
          if (collectible.collectedAtMs != null) {
            return (
              elapsedMs - collectible.collectedAtMs <
              collectibleSparkleDuration(collectible.kind)
            );
          }

          const screenRight =
            collectible.worldX -
            scrollXRef.current +
            getCollectibleAabb(collectible, scrollXRef.current).width;
          return screenRight >= -collectibleDespawnPastLeft(collectible.kind);
        });

      nextSpawnInMsRef.current -= dt;
      if (nextSpawnInMsRef.current <= 0) {
        const pattern = createCollectiblePattern(
          scrollXRef.current,
          obstaclesRef.current,
        );

        if (pattern.length > 0) {
          const nextCollectibles = pattern.map((point) => {
            collectibleIdRef.current += 1;
            return createCollectibleFromPatternPoint(
              `collectible-${collectibleIdRef.current}`,
              point,
            );
          });
          collectibles = [...collectibles, ...nextCollectibles];
        }

        nextSpawnInMsRef.current = nextSpawnDelayMs();
      }

      const nextState: UseCollectibleSpawnerResult = {
        elapsedMs,
        collectibles,
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
  }, [paused]);

  return {
    ...state,
    collectCollectible,
    removeCollectible,
  };
}
