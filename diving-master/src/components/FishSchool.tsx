import { Circle, Group, Path, RoundedRect } from "@shopify/react-native-skia";

import { FISH_SPACING } from "@/src/constants/fish-school";
import type { FishSchoolProps } from "@/src/types/fish-school";

/**
 * Horizontal school of small fish, drawn in logical game space. Motion and
 * wobble transforms are owned by `useFishSchool` (RN ancestor of Canvas).
 */
export function FishSchool({
  fishCount,
  schoolTransform,
  bodyWobble,
}: FishSchoolProps) {
  return (
    <Group transform={schoolTransform}>
      {Array.from({ length: fishCount }, (_, i) => (
        <Group
          key={i}
          transform={[{ translateX: i * FISH_SPACING }]}
        >
          <Group origin={{ x: 0, y: 0 }} transform={bodyWobble[i]}>
            <Path
              path="M 9 0 L -5 -5 L -5 5 Z"
              color="#f59e0b"
              style="fill"
            />
            <RoundedRect
              x={-6}
              y={-4}
              width={14}
              height={8}
              r={4}
              color="#14b8a6"
            />
            <RoundedRect
              x={-4}
              y={-6}
              width={6}
              height={4}
              r={2}
              color="#0d9488"
            />
            <Circle cx={-4} cy={-1} r={1.2} color="#ccfbf1" opacity={0.9} />
          </Group>
        </Group>
      ))}
    </Group>
  );
}
