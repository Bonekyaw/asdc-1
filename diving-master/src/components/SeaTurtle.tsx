import { Circle, Group, Path, RoundedRect } from "@shopify/react-native-skia";

import type { SeaTurtleProps } from "@/src/types/sea-turtle";

/**
 * Side-view sea turtle: **nose leads to the left** (matches scroll direction),
 * **belly down** (+Y). Transforms from `useSeaTurtle` (RN ancestor of Canvas).
 */
export function SeaTurtle({
  rootTransform,
  flipperFrontUpper,
  flipperFrontLower,
  flipperRearUpper,
  flipperRearLower,
}: SeaTurtleProps) {
  return (
    <Group transform={rootTransform}>
      {/* Rear (trailing) lower flipper — near tail, below midline */}
      <Group origin={{ x: 52, y: 10 }} transform={flipperRearLower}>
        <Path
          path="M 0 0 Q 12 8 20 12 Q 10 8 0 4 Z"
          color="#3f6212"
          style="fill"
        />
      </Group>
      {/* Rear upper flipper */}
      <Group origin={{ x: 50, y: -6 }} transform={flipperRearUpper}>
        <Path
          path="M 0 0 Q 10 -10 18 -14 Q 8 -8 0 -3 Z"
          color="#4d7c0f"
          style="fill"
        />
      </Group>

      {/* Shell (dorsal / top is -Y) */}
      <Path
        path="M 44 -2 C 34 -18 20 -14 14 2 C 10 18 24 28 44 26 C 64 24 74 14 72 4 C 70 -8 56 -12 44 -2 Z"
        color="#365314"
        style="fill"
      />
      <Path
        path="M 42 0 C 32 -12 22 -8 18 4 C 16 14 28 22 42 20 C 56 18 64 10 62 2 C 60 -6 50 -8 42 0 Z"
        color="#4d7c0f"
        style="fill"
      />
      <Path
        path="M 50 4 L 34 4 M 46 10 L 30 10 M 42 -4 L 26 -2"
        color="#166534"
        style="stroke"
        strokeWidth={1.5}
      />

      {/* Head (leading, left) */}
      <RoundedRect x={-2} y={-8} width={22} height={16} r={7} color="#3f6212" />
      <Circle cx={10} cy={-2} r={2.5} color="#1e293b" />
      <Circle cx={11} cy={-2.5} r={0.8} color="#f8fafc" />

      {/* Front (leading) upper flipper — beside head/neck */}
      <Group origin={{ x: 18, y: -12 }} transform={flipperFrontUpper}>
        <Path
          path="M 0 0 Q -14 -6 -24 -2 Q -12 2 0 6 Z"
          color="#4d7c0f"
          style="fill"
        />
      </Group>
      {/* Front lower flipper */}
      <Group origin={{ x: 20, y: 12 }} transform={flipperFrontLower}>
        <Path
          path="M 0 0 Q -16 8 -26 14 Q -12 10 0 5 Z"
          color="#3f6212"
          style="fill"
        />
      </Group>
    </Group>
  );
}
