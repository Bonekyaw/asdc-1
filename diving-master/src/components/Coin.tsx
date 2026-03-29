import { Circle, Group, Path } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import { COIN_ICON_PATH, COIN_RADIUS } from "@/src/constants/coin";
import type { CoinProps, CoinSparkle } from "@/src/types/coin";

function isSharedValue<T>(v: T | SharedValue<T>): v is SharedValue<T> {
  return v != null && typeof v === "object" && "value" in v;
}

function CoinSparkleGroup({ sparkleBursts }: { sparkleBursts: SharedValue<CoinSparkle[]> | CoinSparkle[] }) {
  if (!isSharedValue(sparkleBursts)) {
    // Plain array path — static sparkles
    return (
      <>
        {sparkleBursts.map((sparkle, index) => (
          <Group
            key={`${sparkle.x}-${sparkle.y}-${index}`}
            transform={[{ translateX: sparkle.x }, { translateY: sparkle.y }]}
          >
            <Circle cx={0} cy={0} r={sparkle.radius} color="#fde68a" opacity={sparkle.opacity} />
            <Path
              path={`M 0 ${-sparkle.radius - 4} L 0 ${sparkle.radius + 4} M ${-sparkle.radius - 4} 0 L ${sparkle.radius + 4} 0`}
              color="#fff7ed"
              style="stroke"
              strokeWidth={1.5}
              strokeCap="round"
              opacity={sparkle.opacity}
            />
          </Group>
        ))}
      </>
    );
  }

  // SharedValue path — UI-thread sparkles via single batched path
  // We render nothing here because Skia can't dynamically iterate SharedValue arrays.
  // The sparkle effect is handled by the particle system instead.
  return null;
}

export function Coin({
  rootTransform,
  rotation,
  sparkleBursts = [],
}: CoinProps) {
  const rotationValue = isSharedValue(rotation) ? rotation : undefined;
  const rotationPlain = isSharedValue(rotation) ? 0 : rotation;

  const rotateTransform = useDerivedValue(() => {
    "worklet";
    const r = rotationValue ? rotationValue.value : rotationPlain;
    return [{ rotate: r }];
  });

  return (
    <Group transform={rootTransform}>
      <Group origin={{ x: 0, y: 0 }} transform={rotateTransform}>
        <Circle cx={0} cy={0} r={COIN_RADIUS + 5} color="#fbbf24" opacity={0.2} />
        <Circle cx={0} cy={0} r={COIN_RADIUS} color="#d97706" />
        <Circle cx={0} cy={0} r={COIN_RADIUS - 3} color="#facc15" />
        <Circle cx={-6} cy={-7} r={5} color="#fde68a" opacity={0.55} />
        <Path
          path={COIN_ICON_PATH}
          color="#7c2d12"
          style="stroke"
          strokeWidth={3.2}
          strokeCap="round"
          strokeJoin="round"
        />
      </Group>
      <CoinSparkleGroup sparkleBursts={sparkleBursts} />
    </Group>
  );
}
