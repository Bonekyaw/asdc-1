import { useCallback, useEffect, useRef, useState } from "react";
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import type { CollectibleInstance } from "@/src/hooks/useCollectibleSpawner";
import { getTurtleOffsetY, type ObstacleInstance } from "@/src/hooks/useObstacleSpawner";
import {
  getCollectibleAabb,
  getSwimmerAabb,
  isWithinXRange,
  overlapsAabb,
} from "@/src/utils/collision";

const COLLISION_X_RANGE = 200;
const INVINCIBILITY_DURATION_MS = 1000;
const HIT_FLASH_DURATION_MS = 260;
const INITIAL_LIVES = 4;
type CollisionObstacleSnapshot = {
  id: string;
  kind: ObstacleInstance["kind"];
  worldX: number;
  spawnTimeMs: number;
  y: number;
  baseY: number;
  amplitude: number;
  frequency: number;
  width: number;
  speed: number;
  scale: number;
};

type CollisionCollectibleSnapshot = {
  id: string;
  kind: CollectibleInstance["kind"];
  worldX: number;
  y: number;
  collectedAtMs: number | null;
};

type CollectEvent = {
  id: string;
  kind: CollectibleInstance["kind"];
  screenX: number;
  y: number;
};

function collectibleScore(kind: CollectibleInstance["kind"]): number {
  return kind === "diamond" ? 50 : 10;
}

function includesId(ids: string[], target: string): boolean {
  "worklet";
  for (let index = 0; index < ids.length; index += 1) {
    if (ids[index] === target) {
      return true;
    }
  }
  return false;
}

export interface CollisionHandlerState {
  lives: number;
  score: number;
  isInvincible: boolean;
  invincibleUntilMs: number;
}

export interface UseCollisionHandlerResult extends CollisionHandlerState {
  hitFlashOpacity: SharedValue<number>;
}

export function useCollisionHandler(
  paused: boolean,
  timeMs: SharedValue<number>,
  scrollX: SharedValue<number>,
  speedMultiplier: SharedValue<number>,
  swimmerY: SharedValue<number>,
  obstacles: ObstacleInstance[],
  collectibles: CollectibleInstance[],
  removeObstacle: (id: string) => void,
  collectCollectible: (id: string, collectedAtMs: number) => void,
  onHit?: (x: number, y: number) => void,
  onCollect?: (kind: "coin" | "diamond", x: number, y: number) => void,
): UseCollisionHandlerResult {
  const hitFlashUntilMs = useSharedValue(0);
  const obstacleSnapshots = useSharedValue<CollisionObstacleSnapshot[]>([]);
  const collectibleSnapshots = useSharedValue<CollisionCollectibleSnapshot[]>([]);
  const pendingCollectibleIds = useSharedValue<string[]>([]);
  const pendingObstacleIds = useSharedValue<string[]>([]);
  const invincibleUntilShared = useSharedValue(0);
  const invincibilityClearPending = useSharedValue(false);
  const livesShared = useSharedValue(INITIAL_LIVES);

  const [state, setState] = useState<CollisionHandlerState>({
    lives: INITIAL_LIVES,
    score: 0,
    isInvincible: false,
    invincibleUntilMs: 0,
  });

  const stateRef = useRef(state);
  const removeObstacleRef = useRef(removeObstacle);
  const collectCollectibleRef = useRef(collectCollectible);
  const onHitRef = useRef(onHit);
  const onCollectRef = useRef(onCollect);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    removeObstacleRef.current = removeObstacle;
  }, [removeObstacle]);

  useEffect(() => {
    collectCollectibleRef.current = collectCollectible;
  }, [collectCollectible]);

  useEffect(() => {
    onHitRef.current = onHit;
  }, [onHit]);

  useEffect(() => {
    onCollectRef.current = onCollect;
  }, [onCollect]);

  useEffect(() => {
    obstacleSnapshots.value = obstacles.map((obstacle) => ({
      id: obstacle.id,
      kind: obstacle.kind,
      worldX: obstacle.worldX,
      spawnTimeMs: obstacle.kind === "coral" ? 0 : obstacle.spawnTimeMs,
      y: obstacle.kind === "fish" ? obstacle.y : 0,
      baseY: obstacle.kind === "fish" ? 0 : obstacle.baseY,
      amplitude: obstacle.kind === "turtle" ? obstacle.amplitude : 0,
      frequency: obstacle.kind === "turtle" ? obstacle.frequency : 0,
      width: obstacle.width,
      speed: obstacle.speed,
      scale: obstacle.kind === "coral" ? obstacle.scale : 1,
    }));
    pendingObstacleIds.value = pendingObstacleIds.value.filter((id) =>
      obstacles.some((obstacle) => obstacle.id === id),
    );
  }, [obstacleSnapshots, obstacles, pendingObstacleIds]);

  useEffect(() => {
    collectibleSnapshots.value = collectibles.map((collectible) => ({
      id: collectible.id,
      kind: collectible.kind,
      worldX: collectible.worldX,
      y: collectible.y,
      collectedAtMs: collectible.collectedAtMs,
    }));
    pendingCollectibleIds.value = pendingCollectibleIds.value.filter((id) =>
      collectibles.some((collectible) => collectible.id === id && collectible.collectedAtMs == null),
    );
  }, [collectibleSnapshots, collectibles, pendingCollectibleIds]);

  useEffect(() => {
    invincibleUntilShared.value = state.invincibleUntilMs;
    livesShared.value = state.lives;
  }, [invincibleUntilShared, livesShared, state.invincibleUntilMs, state.lives]);

  const hitFlashOpacity = useDerivedValue(() => {
    "worklet";
    const remaining = hitFlashUntilMs.value - timeMs.value;
    return remaining > 0 ? Math.max(0, remaining / HIT_FLASH_DURATION_MS) * 0.75 : 0;
  }, [timeMs]);

  const processCollectEvents = useCallback((events: CollectEvent[], collectedAtMs: number) => {
    if (events.length === 0) {
      return;
    }

    const collectedIds = new Set(events.map((event) => event.id));
    for (const event of events) {
      collectCollectibleRef.current(event.id, collectedAtMs);
      onCollectRef.current?.(event.kind, event.screenX, event.y);
    }
    pendingCollectibleIds.value = pendingCollectibleIds.value.filter((id) => !collectedIds.has(id));

    setState((current) => {
      const scoreDelta = events.reduce((total, event) => total + collectibleScore(event.kind), 0);
      const nextState = {
        ...current,
        score: current.score + scoreDelta,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, [pendingCollectibleIds]);

  const processHitEvent = useCallback((id: string, x: number, y: number, nowMs: number) => {
    removeObstacleRef.current(id);
    onHitRef.current?.(x, y);
    pendingObstacleIds.value = pendingObstacleIds.value.filter((pendingId) => pendingId !== id);
    invincibilityClearPending.value = false;

    setState((current) => {
      const nextState = {
        ...current,
        lives: Math.max(0, current.lives - 1),
        isInvincible: true,
        invincibleUntilMs: nowMs + INVINCIBILITY_DURATION_MS,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, [invincibilityClearPending, pendingObstacleIds]);

  const clearInvincibility = useCallback(() => {
    invincibleUntilShared.value = 0;
    invincibilityClearPending.value = false;
    setState((current) => {
      if (!current.isInvincible) {
        return current;
      }

      const nextState = {
        ...current,
        isInvincible: false,
      };
      stateRef.current = nextState;
      return nextState;
    });
  }, [invincibilityClearPending, invincibleUntilShared]);

  const frame = useFrameCallback(() => {
    "worklet";
    const nowMs = timeMs.value;
    const scrollPosition = scrollX.value;
    const currentSpeedMultiplier = speedMultiplier.value;
    const swimmerBox = getSwimmerAabb(swimmerY.value);

    const collectEvents: CollectEvent[] = [];
    const collectibleSnapshotList = collectibleSnapshots.value;
    for (let index = 0; index < collectibleSnapshotList.length; index += 1) {
      const collectible = collectibleSnapshotList[index];
      if (collectible.collectedAtMs != null || includesId(pendingCollectibleIds.value, collectible.id)) {
        continue;
      }

      const collectibleBox = getCollectibleAabb(collectible, scrollPosition);
      if (!isWithinXRange(collectibleBox, swimmerBox, COLLISION_X_RANGE)) {
        continue;
      }
      if (!overlapsAabb(collectibleBox, swimmerBox)) {
        continue;
      }

      collectEvents.push({
        id: collectible.id,
        kind: collectible.kind,
        screenX: collectible.worldX - scrollPosition,
        y: collectible.y,
      });
    }

    if (collectEvents.length > 0) {
      pendingCollectibleIds.value = [
        ...pendingCollectibleIds.value,
        ...collectEvents.map((event) => event.id),
      ];
      runOnJS(processCollectEvents)(collectEvents, nowMs);
    }

    if (
      invincibleUntilShared.value > 0 &&
      nowMs >= invincibleUntilShared.value &&
      !invincibilityClearPending.value
    ) {
      invincibilityClearPending.value = true;
      runOnJS(clearInvincibility)();
    }

    if (
      nowMs < invincibleUntilShared.value ||
      livesShared.value <= 0 ||
      pendingObstacleIds.value.length > 0
    ) {
      return;
    }

    const obstacleSnapshotList = obstacleSnapshots.value;
    for (let index = 0; index < obstacleSnapshotList.length; index += 1) {
      const obstacle = obstacleSnapshotList[index];
      if (includesId(pendingObstacleIds.value, obstacle.id)) {
        continue;
      }

      const obstacleWorldX =
        obstacle.kind === "coral"
          ? obstacle.worldX
          : obstacle.worldX -
            obstacle.speed *
              currentSpeedMultiplier *
              Math.max(0, nowMs - obstacle.spawnTimeMs);

      let obstacleBox;
      if (obstacle.kind === "fish") {
        obstacleBox = {
          x: obstacleWorldX - scrollPosition - 8,
          y: obstacle.y - 12,
          width: obstacle.width + 12,
          height: 24,
        };
      } else if (obstacle.kind === "turtle") {
        const turtleY = getTurtleOffsetY(obstacle, nowMs);
        obstacleBox = {
          x: obstacleWorldX - scrollPosition - 4,
          y: turtleY - 24,
          width: obstacle.width + 8,
          height: 50,
        };
      } else {
        obstacleBox = {
          x: obstacleWorldX - scrollPosition - 30 * obstacle.scale,
          y: obstacle.baseY - 100 * obstacle.scale,
          width: 60 * obstacle.scale,
          height: 108 * obstacle.scale,
        };
      }

      if (!isWithinXRange(obstacleBox, swimmerBox, COLLISION_X_RANGE)) {
        continue;
      }
      if (!overlapsAabb(obstacleBox, swimmerBox)) {
        continue;
      }

      pendingObstacleIds.value = [...pendingObstacleIds.value, obstacle.id];
      invincibleUntilShared.value = nowMs + INVINCIBILITY_DURATION_MS;
      invincibilityClearPending.value = false;
      hitFlashUntilMs.value = nowMs + HIT_FLASH_DURATION_MS;
      runOnJS(processHitEvent)(
        obstacle.id,
        obstacleBox.x + obstacleBox.width * 0.5,
        obstacleBox.y + obstacleBox.height * 0.5,
        nowMs,
      );
      break;
    }
  }, false);

  useEffect(() => {
    frame.setActive(!paused);
    return () => frame.setActive(false);
  }, [frame, paused]);

  return {
    ...state,
    isInvincible: state.isInvincible,
    hitFlashOpacity,
  };
}
