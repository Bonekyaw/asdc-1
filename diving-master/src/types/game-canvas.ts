import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { SwimmerTouchControlMode } from "@/src/types/touch-controls";

export interface FrameClock {
  /** Monotonic ms since the frame loop was activated. */
  timeMs: SharedValue<number>;
  /** Last frame delta in ms (UI thread). */
  deltaMs: SharedValue<number>;
  setActive: (active: boolean) => void;
  isActive: boolean;
}

export interface GameCanvasProps {
  /**
   * Skia nodes inside the logical FitBox. Function form receives `clock` (Skia
   * does not provide React context under Canvas). Do not use Reanimated hooks
   * inside nested custom components here — run `useDerivedValue` in an RN
   * ancestor of `<Canvas>` (see `GameCanvas`) or use only Skia primitives.
   */
  children?: ReactNode | ((clock: FrameClock) => ReactNode);
  /** Canvas area behind the letterboxed FitBox (visible in bars). */
  backgroundColor?: string;
  /** When true, frame callback is paused via setActive(false). */
  paused?: boolean;
  /**
   * `tap`: jump to released touch Y with easing.
   * `drag`: follow finger with spring smoothing (default).
   */
  touchControlMode?: SwimmerTouchControlMode;
}
