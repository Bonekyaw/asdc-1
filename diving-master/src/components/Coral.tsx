import { Group, Path } from "@shopify/react-native-skia";

import type { CoralProps } from "@/src/types/coral";

export function Coral({
  rootTransform,
  branchPath,
  innerBranchPath,
  palette,
}: CoralProps) {
  return (
    <Group transform={rootTransform}>
      <Path
        path="M -26 0 Q 0 -9 26 0 L 30 12 Q 0 17 -30 12 Z"
        color="#7c3aed22"
        style="fill"
      />
      <Path path={branchPath} color={palette.base} style="fill" />
      <Path path={innerBranchPath} color={palette.mid} style="fill" opacity={0.95} />
      <Path
        path="M 0 -74 Q 5 -63 4 -49 M -17 -57 Q -12 -43 -11 -29 M 18 -54 Q 14 -39 14 -25 M -26 -37 Q -23 -22 -20 -8 M 27 -36 Q 24 -19 22 -6"
        color={palette.highlight}
        style="stroke"
        strokeWidth={3}
        strokeCap="round"
      />
    </Group>
  );
}
