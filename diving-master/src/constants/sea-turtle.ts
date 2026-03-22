import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";

/** Horizontal speed: logical units per frame at 60 Hz (slightly slower than fish). */
export const SEA_TURTLE_SPEED_PER_FRAME_AT_60HZ = 2.4;
export const SEA_TURTLE_SPEED_UNITS_PER_MS =
  SEA_TURTLE_SPEED_PER_FRAME_AT_60HZ / (1000 / 60);

export const SEA_TURTLE_SPAWN_OFFSET = 90;
export const SEA_TURTLE_SPAWN_X = GAME_WIDTH + SEA_TURTLE_SPAWN_OFFSET;

/** Nose (left) to tail tip (right) for despawn (game units). */
export const SEA_TURTLE_SPRITE_LENGTH = 72;
export const SEA_TURTLE_DESPAWN_PAST_LEFT = 48;

export const SEA_TURTLE_RESPAWN_DELAY_MS = 1400;

/** Vertical oscillation amplitude (game units). */
export const SEA_TURTLE_AMPLITUDE_MIN = 50;
export const SEA_TURTLE_AMPLITUDE_MAX = 80;

/**
 * Spec range used inside `sin(2π * (frequency * SEA_TURTLE_FREQ_TO_BOB_HZ) * tSec)`.
 * Maps 0.02–0.05 to ~0.2–0.6 Hz bob (clear sine while crossing the screen).
 */
export const SEA_TURTLE_FREQUENCY_MIN = 0.02;
export const SEA_TURTLE_FREQUENCY_MAX = 0.05;

/** Effective bob frequency (Hz) ≈ `frequency * SEA_TURTLE_FREQ_TO_BOB_HZ`. */
export const SEA_TURTLE_FREQ_TO_BOB_HZ = 12;

export function randomTurtleAmplitude(): number {
  return (
    SEA_TURTLE_AMPLITUDE_MIN +
    Math.random() * (SEA_TURTLE_AMPLITUDE_MAX - SEA_TURTLE_AMPLITUDE_MIN)
  );
}

export function randomTurtleFrequency(): number {
  return (
    SEA_TURTLE_FREQUENCY_MIN +
    Math.random() * (SEA_TURTLE_FREQUENCY_MAX - SEA_TURTLE_FREQUENCY_MIN)
  );
}

/** Keep shell + amplitude inside playfield vertically. */
export function randomTurtleBaseY(amplitude: number): number {
  const margin = amplitude + 24;
  const lo = margin;
  const hi = GAME_HEIGHT - margin;
  return lo + Math.random() * Math.max(1, hi - lo);
}
