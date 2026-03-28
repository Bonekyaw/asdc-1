import { useCallback, useEffect, useRef, useState } from "react";
import {
  runOnJS,
  useAnimatedReaction,
  type SharedValue,
} from "react-native-reanimated";

import type { CollectibleInstance } from "@/src/hooks/useCollectibleSpawner";
import type { ObstacleInstance } from "@/src/hooks/useObstacleSpawner";
import {
  getCollectibleAabb,
  getObstacleAabb,
  getSwimmerAabb,
  isWithinXRange,
  overlapsAabb,
} from "@/src/utils/collision";

const COLLISION_X_RANGE = 200;
const INVINCIBILITY_DURATION_MS = 1000;
const HIT_FLASH_DURATION_MS = 260;
const INITIAL_LIVES = 4;

function collectibleScore(kind: CollectibleInstance["kind"]): number {
  return kind === "diamond" ? 50 : 10;
}

export interface CollisionHandlerState {
  lives: number;
  score: number;
  isInvincible: boolean;
  invincibleUntilMs: number;
  hitFlashUntilMs: number;
  hitFlashOpacity: number;
}

export function useCollisionHandler(
  paused: boolean,
  elapsedMs: number,
  scrollX: number,
  swimmerY: SharedValue<number>,
  obstacles: ObstacleInstance[],
  collectibles: CollectibleInstance[],
  removeObstacle: (id: string) => void,
  collectCollectible: (id: string, collectedAtMs: number) => void,
): CollisionHandlerState {
  const [state, setState] = useState<CollisionHandlerState>({
    lives: INITIAL_LIVES,
    score: 0,
    isInvincible: false,
    invincibleUntilMs: 0,
    hitFlashUntilMs: 0,
    hitFlashOpacity: 0,
  });

  const swimmerYRef = useRef(0);
  const stateRef = useRef(state);
  const obstaclesRef = useRef(obstacles);
  const collectiblesRef = useRef(collectibles);
  const scrollXRef = useRef(scrollX);
  const elapsedMsRef = useRef(elapsedMs);
  const removeObstacleRef = useRef(removeObstacle);
  const collectCollectibleRef = useRef(collectCollectible);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  useEffect(() => {
    collectiblesRef.current = collectibles;
  }, [collectibles]);

  useEffect(() => {
    scrollXRef.current = scrollX;
  }, [scrollX]);

  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  useEffect(() => {
    removeObstacleRef.current = removeObstacle;
  }, [removeObstacle]);

  useEffect(() => {
    collectCollectibleRef.current = collectCollectible;
  }, [collectCollectible]);

  const updateSwimmerY = useCallback((nextValue: number) => {
    swimmerYRef.current = nextValue;
  }, []);

  useAnimatedReaction(
    () => swimmerY.value,
    (value, previousValue) => {
      if (value !== previousValue) {
        runOnJS(updateSwimmerY)(value);
      }
    },
    [swimmerY, updateSwimmerY],
  );

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
      lastFrameRef.current = frameTime;

      const nowMs = elapsedMsRef.current;
      const swimmerBox = getSwimmerAabb(swimmerYRef.current);
      const isInvincible = nowMs < stateRef.current.invincibleUntilMs;
      const canTakeDamage = stateRef.current.lives > 0;

      let nextState = stateRef.current;
      let changed = false;

      if (stateRef.current.hitFlashUntilMs > 0) {
        const remaining = stateRef.current.hitFlashUntilMs - nowMs;
        const hitFlashOpacity =
          remaining > 0 ? Math.max(0, remaining / HIT_FLASH_DURATION_MS) * 0.75 : 0;
        if (hitFlashOpacity !== stateRef.current.hitFlashOpacity) {
          nextState = {
            ...nextState,
            hitFlashOpacity,
          };
          changed = true;
        }
      }

      for (const collectible of collectiblesRef.current) {
        if (collectible.collectedAtMs != null) {
          continue;
        }

        const collectibleBox = getCollectibleAabb(collectible, scrollXRef.current);
        if (!isWithinXRange(collectibleBox, swimmerBox, COLLISION_X_RANGE)) {
          continue;
        }
        if (!overlapsAabb(collectibleBox, swimmerBox)) {
          continue;
        }

        collectCollectibleRef.current(collectible.id, nowMs);
        nextState = {
          ...nextState,
          score: nextState.score + collectibleScore(collectible.kind),
        };
        changed = true;
      }

      if (!isInvincible && canTakeDamage) {
        for (const obstacle of obstaclesRef.current) {
          const obstacleBox = getObstacleAabb(
            obstacle,
            scrollXRef.current,
            nowMs,
          );
          if (!isWithinXRange(obstacleBox, swimmerBox, COLLISION_X_RANGE)) {
            continue;
          }
          if (!overlapsAabb(obstacleBox, swimmerBox)) {
            continue;
          }

          removeObstacleRef.current(obstacle.id);
          nextState = {
            ...nextState,
            lives: Math.max(0, nextState.lives - 1),
            isInvincible: true,
            invincibleUntilMs: nowMs + INVINCIBILITY_DURATION_MS,
            hitFlashUntilMs: nowMs + HIT_FLASH_DURATION_MS,
            hitFlashOpacity: 0.75,
          };
          changed = true;
          break;
        }
      } else if (stateRef.current.isInvincible && nowMs >= stateRef.current.invincibleUntilMs) {
        nextState = {
          ...nextState,
          isInvincible: false,
        };
        changed = true;
      }

      if (changed) {
        stateRef.current = nextState;
        setState(nextState);
      }

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
    isInvincible: elapsedMs < state.invincibleUntilMs,
  };
}
