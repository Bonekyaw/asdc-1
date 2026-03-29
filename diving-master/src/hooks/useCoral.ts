import { useCallback, useEffect, useMemo, useState } from "react";
import {
  runOnJS,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";

import {
  CORAL_DESPAWN_PAST_LEFT,
  CORAL_RESPAWN_DELAY_MS,
  CORAL_WIDTH,
  randomCoralBaseY,
  randomCoralScale,
  randomCoralSpawnAhead,
} from "@/src/constants/coral";
import { GAME_WIDTH } from "@/src/constants/game-viewport";
import type { CoralPalette, CoralProps } from "@/src/types/coral";
import type { FishSchoolGroupTransform } from "@/src/types/fish-school";

export type UseCoralResult = Pick<
  CoralProps,
  "rootTransform" | "branchPath" | "innerBranchPath" | "palette"
> & { isAlive: boolean };

const CORAL_PALETTES: readonly CoralPalette[] = [
  { base: "#ec4899", mid: "#f472b6", highlight: "#fbcfe8" },
  { base: "#dc2626", mid: "#ef4444", highlight: "#fecaca" },
  { base: "#f97316", mid: "#fb923c", highlight: "#fed7aa" },
] as const;

type CoralVariant = {
  branchPath: string;
  innerBranchPath: string;
};

const CORAL_VARIANTS: readonly CoralVariant[] = [
  {
    branchPath:
      "M -29 10 Q -30 -8 -26 -21 Q -20 -45 -25 -69 Q -14 -59 -10 -39 Q -7 -54 -10 -78 Q -1 -69 2 -50 Q 8 -66 5 -92 Q 15 -83 19 -58 Q 24 -70 22 -84 Q 31 -72 32 -46 Q 33 -24 29 10 Z",
    innerBranchPath:
      "M -18 10 Q -19 -8 -15 -22 Q -11 -39 -14 -56 Q -6 -47 -4 -31 Q 1 -48 -1 -67 Q 7 -59 10 -39 Q 16 -50 16 -68 Q 23 -58 23 -36 Q 23 -12 20 10 Z",
  },
  {
    branchPath:
      "M -30 10 Q -29 -6 -22 -24 Q -17 -37 -19 -55 Q -11 -49 -8 -34 Q -3 -46 -5 -69 Q 4 -60 8 -42 Q 12 -57 10 -80 Q 19 -68 21 -50 Q 27 -59 27 -73 Q 35 -59 34 -34 Q 34 -16 31 10 Z",
    innerBranchPath:
      "M -17 10 Q -18 -5 -13 -19 Q -9 -33 -10 -46 Q -4 -40 -1 -27 Q 4 -37 3 -58 Q 10 -50 12 -34 Q 17 -42 18 -56 Q 24 -47 24 -28 Q 24 -10 21 10 Z",
  },
  {
    branchPath:
      "M -31 10 Q -31 -10 -28 -27 Q -22 -44 -27 -63 Q -17 -55 -13 -35 Q -10 -52 -14 -72 Q -5 -64 -1 -45 Q 2 -59 0 -87 Q 11 -74 14 -55 Q 18 -67 17 -84 Q 27 -71 29 -48 Q 33 -28 30 10 Z",
    innerBranchPath:
      "M -19 10 Q -19 -8 -16 -22 Q -12 -36 -15 -51 Q -7 -44 -4 -28 Q 0 -40 -2 -62 Q 6 -54 9 -37 Q 14 -47 13 -64 Q 21 -54 22 -34 Q 23 -16 20 10 Z",
  },
] as const;

function randomCoralPalette(): CoralPalette {
  return CORAL_PALETTES[Math.floor(Math.random() * CORAL_PALETTES.length)];
}

function randomCoralVariant(): CoralVariant {
  return CORAL_VARIANTS[Math.floor(Math.random() * CORAL_VARIANTS.length)];
}

function createCoralPlacement(scrollX: number) {
  return {
    worldX: scrollX + GAME_WIDTH + randomCoralSpawnAhead(),
    baseY: randomCoralBaseY(),
    scale: randomCoralScale(),
    palette: randomCoralPalette(),
    variant: randomCoralVariant(),
  };
}

export function useCoral(
  scrollX: SharedValue<number>,
  paused: boolean,
): UseCoralResult {
  const initial = useMemo(() => createCoralPlacement(scrollX.value), [scrollX]);
  const worldX = useSharedValue(initial.worldX);
  const baseY = useSharedValue(initial.baseY);
  const scale = useSharedValue(initial.scale);
  const [palette, setPalette] = useState(initial.palette);
  const [variant, setVariant] = useState(initial.variant);

  const [isAlive, setIsAlive] = useState(true);
  const isAliveSV = useSharedValue(1);

  const rootTransform = useDerivedValue(() => {
    "worklet";
    const screenX = worldX.value - scrollX.value;
    return [
      { translateX: screenX },
      { translateY: baseY.value },
      { scale: scale.value },
    ];
  });

  const markDespawned = useCallback(() => {
    setIsAlive(false);
  }, []);

  const despawnFrame = useFrameCallback(() => {
    "worklet";
    if (isAliveSV.value === 0) {
      return;
    }

    const coralRight = worldX.value - scrollX.value + CORAL_WIDTH * scale.value;
    if (coralRight < -CORAL_DESPAWN_PAST_LEFT) {
      isAliveSV.value = 0;
      runOnJS(markDespawned)();
    }
  }, false);

  useEffect(() => {
    despawnFrame.setActive(isAlive && !paused);
    return () => despawnFrame.setActive(false);
  }, [despawnFrame, isAlive, paused]);

  useEffect(() => {
    if (isAlive || paused) {
      return;
    }

    const id = setTimeout(() => {
      const next = createCoralPlacement(scrollX.value);
      worldX.value = next.worldX;
      baseY.value = next.baseY;
      scale.value = next.scale;
      setPalette(next.palette);
      setVariant(next.variant);
      isAliveSV.value = 1;
      setIsAlive(true);
    }, CORAL_RESPAWN_DELAY_MS);

    return () => clearTimeout(id);
  }, [baseY, isAlive, isAliveSV, paused, scale, scrollX, worldX]);

  return {
    isAlive,
    rootTransform: rootTransform as FishSchoolGroupTransform,
    branchPath: variant.branchPath,
    innerBranchPath: variant.innerBranchPath,
    palette,
  };
}
