import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";

export const FISH_SCHOOL_MIN = 5;
export const FISH_SCHOOL_MAX = 8;

/** Horizontal gap between fish centers (game units). */
export const FISH_SPACING = 22;

/**
 * Nominal speed: 5 logical units per frame at 60 Hz, scaled by actual frame delta.
 */
export const FISH_SPEED_PER_FRAME_AT_60HZ = 5;
export const FISH_SPEED_UNITS_PER_MS =
  FISH_SPEED_PER_FRAME_AT_60HZ / (1000 / 60);

/** Spawn just past the right edge (game X). */
export const FISH_SCHOOL_SPAWN_OFFSET = 72;

/** Fully off-screen left before despawn (game units past x=0). */
export const FISH_DESPAWN_PAST_LEFT = 40;

/** Pause before a new school spawns after the previous one left the screen (ms). */
export const FISH_SCHOOL_RESPAWN_DELAY_MS = 1200;

/** Body length from nose to tail tip (approx., game units). */
export const FISH_SPRITE_LENGTH = 18;

/** Vertical placement band (fraction of playfield height). */
export const FISH_SCHOOL_Y_MIN_FRAC = 0.22;
export const FISH_SCHOOL_Y_MAX_FRAC = 0.78;

export const FISH_SCHOOL_SPAWN_X =
  GAME_WIDTH + FISH_SCHOOL_SPAWN_OFFSET;

export function randomSchoolY(): number {
  return (
    GAME_HEIGHT *
    (FISH_SCHOOL_Y_MIN_FRAC +
      Math.random() * (FISH_SCHOOL_Y_MAX_FRAC - FISH_SCHOOL_Y_MIN_FRAC))
  );
}
