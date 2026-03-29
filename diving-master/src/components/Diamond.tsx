import { Circle, Group, Path } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";

import {
  DIAMOND_INNER_PATH,
  DIAMOND_OUTER_PATH,
} from "@/src/constants/diamond";
import type { DiamondProps } from "@/src/types/diamond";
import type { CoinSparkle } from "@/src/types/coin";

function isSharedValue<T>(v: T | SharedValue<T>): v is SharedValue<T> {
  return v != null && typeof v === "object" && "value" in v;
}

function DiamondSparkleGroup({ sparkleBursts }: { sparkleBursts: SharedValue<CoinSparkle[]> | CoinSparkle[] }) {
  if (!isSharedValue(sparkleBursts)) {
    return (
      <>
        {sparkleBursts.map((sparkle, index) => (
          <Group
            key={`${sparkle.x}-${sparkle.y}-${index}`}
            transform={[{ translateX: sparkle.x }, { translateY: sparkle.y }]}
          >
            <Circle cx={0} cy={0} r={sparkle.radius} color="#bfdbfe" opacity={sparkle.opacity} />
            <Path
              path={`M 0 ${-sparkle.radius - 5} L 0 ${sparkle.radius + 5} M ${-sparkle.radius - 5} 0 L ${sparkle.radius + 5} 0`}
              color="#eff6ff"
              style="stroke"
              strokeWidth={1.8}
              strokeCap="round"
              opacity={sparkle.opacity}
            />
          </Group>
        ))}
      </>
    );
  }

  return null;
}

export function Diamond({
  rootTransform,
  scale,
  sparkleBursts = [],
}: DiamondProps) {
  const scaleValue = isSharedValue(scale) ? scale : undefined;
  const scalePlain = isSharedValue(scale) ? 1 : scale;

  const scaleTransform = useDerivedValue(() => {
    "worklet";
    const s = scaleValue ? scaleValue.value : scalePlain;
    return [{ scale: s }];
  });

  return (
    <Group transform={rootTransform}>
      <Group origin={{ x: 0, y: 0 }} transform={scaleTransform}>
        <Circle cx={0} cy={0} r={20} color="#60a5fa" opacity={0.18} />
        <Path path={DIAMOND_OUTER_PATH} color="#2563eb" style="fill" />
        <Path path={DIAMOND_INNER_PATH} color="#7dd3fc" style="fill" />
        <Path
          path="M 0 -20 L 0 20 M -15 -2 L 15 -2"
          color="#dbeafe"
          style="stroke"
          strokeWidth={1.6}
          strokeCap="round"
        />
        <Path
          path="M -5 -12 L 0 -20 L 5 -12"
          color="#eff6ff"
          style="stroke"
          strokeWidth={1.4}
          strokeCap="round"
          strokeJoin="round"
          opacity={0.9}
        />
      </Group>
      <DiamondSparkleGroup sparkleBursts={sparkleBursts} />
    </Group>
  );
}
