import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { Coin } from "@/src/components/Coin";
import { Diamond } from "@/src/components/Diamond";
import type { CollectibleInstance } from "@/src/hooks/useCollectibleSpawner";
import { COIN_ROTATION_PERIOD_MS, COIN_SPARKLE_DURATION_MS } from "@/src/constants/coin";
import { DIAMOND_PULSE_PERIOD_MS, DIAMOND_SPARKLE_DURATION_MS } from "@/src/constants/diamond";
import type { FishSchoolGroupTransform } from "@/src/types/fish-school";
import type { CoinSparkle } from "@/src/types/coin";

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

  // For sparkle bursts after collection -- compute on UI thread
  const sparkleBursts = useDerivedValue(() => {
    "worklet";
    if (collectible.collectedAtMs == null) return [];

    const duration = COIN_SPARKLE_DURATION_MS;
    const progress = Math.min(1, (timeMs.value - collectible.collectedAtMs) / duration);
    const opacity = 1 - progress;
    const baseRadius = 3 + progress * 8;

    const offsets = [
      { x: -14, y: -11 },
      { x: 13, y: -8 },
      { x: -8, y: 13 },
      { x: 16, y: 10 },
    ];

    const result: CoinSparkle[] = [];
    for (let i = 0; i < offsets.length; i++) {
      result.push({
        x: offsets[i].x * (0.7 + progress * 0.6),
        y: offsets[i].y * (0.7 + progress * 0.6),
        radius: baseRadius + (i % 2),
        opacity,
      });
    }
    return result;
  });

  return (
    <Coin
      rootTransform={rootTransform as unknown as FishSchoolGroupTransform}
      rotation={rotation}
      sparkleBursts={sparkleBursts}
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

  const sparkleBursts = useDerivedValue(() => {
    "worklet";
    if (collectible.collectedAtMs == null) return [];

    const duration = DIAMOND_SPARKLE_DURATION_MS;
    const progress = Math.min(1, (timeMs.value - collectible.collectedAtMs) / duration);
    const opacity = Math.min(1, (1 - progress) * 1.15);
    const baseRadius = 5 + progress * 10;

    const offsets = [
      { x: -16, y: -13 },
      { x: 15, y: -10 },
      { x: -10, y: 15 },
      { x: 18, y: 12 },
    ];

    const result: CoinSparkle[] = [];
    for (let i = 0; i < offsets.length; i++) {
      result.push({
        x: offsets[i].x * (0.7 + progress * 0.6),
        y: offsets[i].y * (0.7 + progress * 0.6),
        radius: baseRadius + (i % 2),
        opacity,
      });
    }
    return result;
  });

  return (
    <Diamond
      rootTransform={rootTransform as unknown as FishSchoolGroupTransform}
      scale={scale}
      sparkleBursts={sparkleBursts}
    />
  );
}

export function GameCollectible({
  collectible,
  scrollX,
  timeMs,
}: {
  collectible: CollectibleInstance;
  scrollX: SharedValue<number>;
  timeMs: SharedValue<number>;
}) {
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
}
