import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";

export const COIN_SIZE = 28;
export const COIN_RADIUS = COIN_SIZE * 0.5;
export const COIN_COLLISION_RADIUS = 26;
export const COIN_SPARKLE_DURATION_MS = 420;
export const COIN_ROTATION_PERIOD_MS = 2000;
export const COIN_DESPAWN_PAST_LEFT = 32;
export const COIN_SPAWN_INTERVAL_MS = 3200;
export const COIN_SCROLL_SPEED_PER_MS = 2.2 / (1000 / 60);
export const COIN_SPAWN_AHEAD_MIN = 120;
export const COIN_SPAWN_AHEAD_MAX = 280;

export const COIN_SAFE_Y_MIN = GAME_HEIGHT * 0.2;
export const COIN_SAFE_Y_MAX = GAME_HEIGHT * 0.78;

export const COIN_ICON_PATH =
  "M 0 -8 C -3 -8 -5 -6 -5 -3 C -5 0 -3 1 0 2 C 3 3 5 4 5 7 C 5 10 3 12 0 12 C -3 12 -5 10 -5 7 M 0 -11 L 0 15";

export const COIN_INITIAL_WORLD_X = GAME_WIDTH + 180;
