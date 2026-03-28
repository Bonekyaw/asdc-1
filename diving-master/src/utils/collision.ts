import { COIN_SIZE } from "@/src/constants/coin";
import { DIAMOND_SIZE } from "@/src/constants/diamond";
import { SWIMMER_ANCHOR_X } from "@/src/constants/swimmer";
import { SEA_TURTLE_FREQ_TO_BOB_HZ } from "@/src/constants/sea-turtle";
import type { CollectibleInstance } from "@/src/hooks/useCollectibleSpawner";
import type { ObstacleInstance } from "@/src/hooks/useObstacleSpawner";

export interface Aabb {
  x: number;
  y: number;
  width: number;
  height: number;
}

const SWIMMER_BOX_WIDTH = 50;
const SWIMMER_BOX_HEIGHT = 46;
const SWIMMER_BOX_OFFSET_X = -12;
const SWIMMER_BOX_OFFSET_Y = -22;

export function overlapsAabb(a: Aabb, b: Aabb): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function isWithinXRange(
  target: Aabb,
  reference: Aabb,
  paddingX: number,
): boolean {
  return (
    target.x <= reference.x + reference.width + paddingX &&
    target.x + target.width >= reference.x - paddingX
  );
}

export function getSwimmerAabb(swimmerY: number): Aabb {
  return {
    x: SWIMMER_ANCHOR_X + SWIMMER_BOX_OFFSET_X,
    y: swimmerY + SWIMMER_BOX_OFFSET_Y,
    width: SWIMMER_BOX_WIDTH,
    height: SWIMMER_BOX_HEIGHT,
  };
}

export function getCollectibleAabb(
  collectible: Pick<CollectibleInstance, "kind" | "worldX" | "y">,
  scrollX: number,
): Aabb {
  const size = collectible.kind === "diamond" ? DIAMOND_SIZE : COIN_SIZE;
  return {
    x: collectible.worldX - scrollX - size * 0.5,
    y: collectible.y - size * 0.5,
    width: size,
    height: size,
  };
}

export function getSpawnCollectibleAabb(worldX: number, y: number): Aabb {
  return {
    x: worldX - DIAMOND_SIZE * 0.5,
    y: y - DIAMOND_SIZE * 0.5,
    width: DIAMOND_SIZE,
    height: DIAMOND_SIZE,
  };
}

export function getObstacleAabb(
  obstacle: ObstacleInstance,
  scrollX: number,
  elapsedMs: number,
): Aabb {
  switch (obstacle.kind) {
    case "fish":
      return {
        x: obstacle.worldX - scrollX - 8,
        y: obstacle.y - 12,
        width: obstacle.width + 12,
        height: 24,
      };
    case "turtle": {
      const phase =
        2 *
        Math.PI *
        (obstacle.frequency * SEA_TURTLE_FREQ_TO_BOB_HZ) *
        (elapsedMs * 0.001);
      const turtleY = obstacle.baseY + obstacle.amplitude * Math.sin(phase);
      return {
        x: obstacle.worldX - scrollX - 4,
        y: turtleY - 24,
        width: obstacle.width + 8,
        height: 50,
      };
    }
    case "coral":
      return {
        x: obstacle.worldX - scrollX - 30 * obstacle.scale,
        y: obstacle.baseY - 100 * obstacle.scale,
        width: 60 * obstacle.scale,
        height: 108 * obstacle.scale,
      };
  }
}
