import { Circle, Group, Path } from "@shopify/react-native-skia";

import { COIN_ICON_PATH, COIN_RADIUS } from "@/src/constants/coin";
import type { CoinProps } from "@/src/types/coin";

export function Coin({
  rootTransform,
  rotation,
  sparkleBursts = [],
}: CoinProps) {
  return (
    <Group transform={rootTransform}>
      <Group origin={{ x: 0, y: 0 }} transform={[{ rotate: rotation }]}>
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
    </Group>
  );
}
