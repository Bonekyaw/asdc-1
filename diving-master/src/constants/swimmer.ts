import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";

/** Horizontal anchor: 20% from left of logical playfield. */
export const SWIMMER_ANCHOR_X = GAME_WIDTH * 0.2;

/** Water surface band — min Y (15% from top of playfield). */
export const SWIMMER_SAFE_Y_MIN = GAME_HEIGHT * 0.15;
/** Seabed band — max Y (85% from top of playfield). */
export const SWIMMER_SAFE_Y_MAX = GAME_HEIGHT * 0.85;

/** Radians per ms for full swim cycle feel (~2.5s per full stroke at 0.0025). */
export const SWIM_PHASE_SPEED = 0.0028;
