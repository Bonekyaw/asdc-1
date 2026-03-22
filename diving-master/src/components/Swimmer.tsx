import { Circle, Group, Path, RoundedRect } from "@shopify/react-native-skia";

import type { SwimmerProps } from "@/src/types/swimmer";

/**
 * Side-profile swimmer (faces right). No Reanimated hooks — transforms are
 * SharedValues built in an RN ancestor (e.g. `useSwimmer` + `GameCanvas`).
 */
export function Swimmer({
  rootTransform,
  armTransformLeft,
  armTransformRight,
  legTransformLeft,
  legTransformRight,
}: SwimmerProps) {
  return (
    <Group transform={rootTransform}>
      {/* Left fin (rear foot) */}
      <Path
        path="M -32 38 L -52 52 L -28 48 Z"
        color="#fb923c"
        style="fill"
      />
      {/* Right fin */}
      <Path
        path="M -22 40 L -38 56 L -18 50 Z"
        color="#ea580c"
        style="fill"
      />

      <Group origin={{ x: -6, y: 26 }} transform={legTransformLeft}>
        <RoundedRect x={-6} y={0} width={14} height={28} r={5} color="#134e4a" />
      </Group>
      <Group origin={{ x: 4, y: 26 }} transform={legTransformRight}>
        <RoundedRect x={-8} y={0} width={14} height={28} r={5} color="#115e59" />
      </Group>

      <RoundedRect x={-22} y={-28} width={52} height={58} r={14} color="#0f766e" />
      <RoundedRect
        x={-18}
        y={-24}
        width={40}
        height={40}
        r={10}
        color="#14b8a6"
        opacity={0.35}
      />

      <Group origin={{ x: -14, y: -14 }} transform={armTransformLeft}>
        <RoundedRect x={0} y={-5} width={36} height={11} r={5} color="#0d9488" />
      </Group>
      <Group origin={{ x: -14, y: 6 }} transform={armTransformRight}>
        <RoundedRect x={0} y={-5} width={36} height={11} r={5} color="#0f766e" />
      </Group>

      <Circle cx={26} cy={-6} r={17} color="#fdba74" />
      <Circle cx={26} cy={-6} r={15} color="#fec89a" opacity={0.9} />

      <RoundedRect x={14} y={-16} width={30} height={22} r={8} color="#1e3a5f" />
      <RoundedRect
        x={17}
        y={-13}
        width={24}
        height={16}
        r={6}
        color="#38bdf8"
        opacity={0.55}
      />
      <RoundedRect
        x={19}
        y={-11}
        width={20}
        height={10}
        r={4}
        color="#7dd3fc"
        opacity={0.35}
      />
      <RoundedRect x={8} y={-10} width={8} height={6} r={2} color="#334155" />

      <RoundedRect x={38} y={-18} width={5} height={20} r={2} color="#475569" />
    </Group>
  );
}
