import { GAME_HEIGHT } from "@/src/constants/game-viewport";

/** Shared environment scroll speed, in logical units per 60 Hz frame. */
export const CORAL_SCROLL_SPEED_PER_FRAME_AT_60HZ = 2.2;
export const CORAL_SCROLL_UNITS_PER_MS =
  CORAL_SCROLL_SPEED_PER_FRAME_AT_60HZ / (1000 / 60);

/** Approximate coral footprint for spawn/despawn calculations. */
export const CORAL_WIDTH = 72;
export const CORAL_HEIGHT = 96;

/** How far ahead of the viewport new coral should be placed in world space. */
export const CORAL_SPAWN_AHEAD_MIN = 110;
export const CORAL_SPAWN_AHEAD_MAX = 260;

/** Extra distance past the left edge before removing the coral. */
export const CORAL_DESPAWN_PAST_LEFT = 36;

/** Delay before another coral obstacle is scheduled into world space. */
export const CORAL_RESPAWN_DELAY_MS = 900;

/** Keep coral rooted near the seafloor band. */
export const CORAL_BASE_Y_MIN = GAME_HEIGHT - 70;
export const CORAL_BASE_Y_MAX = GAME_HEIGHT - 28;

export function randomCoralBaseY(): number {
  return (
    CORAL_BASE_Y_MIN +
    Math.random() * (CORAL_BASE_Y_MAX - CORAL_BASE_Y_MIN)
  );
}

export function randomCoralSpawnAhead(): number {
  return (
    CORAL_SPAWN_AHEAD_MIN +
    Math.random() * (CORAL_SPAWN_AHEAD_MAX - CORAL_SPAWN_AHEAD_MIN)
  );
}

export function randomCoralScale(): number {
  return 0.85 + Math.random() * 0.45;
}
