import { memo } from "react";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { Coin } from "@/src/components/Coin";
import { Diamond } from "@/src/components/Diamond";
import type { CollectibleInstance } from "@/src/hooks/useCollectibleSpawner";
import { COIN_ROTATION_PERIOD_MS } from "@/src/constants/coin";
import { DIAMOND_PULSE_PERIOD_MS } from "@/src/constants/diamond";
import type { FishSchoolGroupTransform } from "@/src/types/fish-school";

function GameCoin({
  collectible,
  scrollX,
  timeMs,
}: {
  collectible: CollectibleInstance;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
}) {
  const rootTransform = useDerivedValue(() => {
    "worklet";
    return [
      { translateX: collectible.worldX - scrollX.value },
      { translateY: collectible.y },
    ];
  });

  const rotation = useDerivedValue(() => {
    "worklet";
    return ((timeMs.value % COIN_ROTATION_PERIOD_MS) / COIN_ROTATION_PERIOD_MS) * Math.PI * 2;
  });
  return (
    <Coin
      rootTransform={rootTransform as unknown as FishSchoolGroupTransform}
      rotation={rotation}
    />
  );
}

function GameDiamond({
  collectible,
  scrollX,
  timeMs,
}: {
  collectible: CollectibleInstance;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
}) {
  const rootTransform = useDerivedValue(() => {
    "worklet";
    return [
      { translateX: collectible.worldX - scrollX.value },
      { translateY: collectible.y },
    ];
  });

  const scale = useDerivedValue(() => {
    "worklet";
    return 1 + Math.sin((timeMs.value / DIAMOND_PULSE_PERIOD_MS) * Math.PI * 2) * 0.1;
  });

  return (
    <Diamond
      rootTransform={rootTransform as unknown as FishSchoolGroupTransform}
      scale={scale}
    />
  );
}

export const GameCollectible = memo(function GameCollectible({
  collectible,
  scrollX,
  timeMs,
}: {
  collectible: CollectibleInstance;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
}) {
  if (collectible.collectedAtMs != null) {
    return null;
  }

  if (collectible.kind === "diamond") {
    return (
      <GameDiamond
        collectible={collectible}
        scrollX={scrollX}
        timeMs={timeMs}
      />
    );
  }

  return (
    <GameCoin
      collectible={collectible}
      scrollX={scrollX}
      timeMs={timeMs}
    />
  );
});
