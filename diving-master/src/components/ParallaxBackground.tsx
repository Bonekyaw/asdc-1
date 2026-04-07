import { useMemo } from "react";
import { Group, Path, Rect, LinearGradient, vec } from "@shopify/react-native-skia";
import { useDerivedValue, type SharedValue } from "react-native-reanimated";
import { GAME_WIDTH, GAME_HEIGHT } from "@/src/constants/game-viewport";

export interface ParallaxBackgroundProps {
  scrollX: SharedValue<number>;
  elapsedMs: SharedValue<number>;
}

const LAYER_WIDTH = GAME_WIDTH;

function ScrollingLayerGroup({
  width,
  scrollX,
  speedMultiplier,
  layerNode,
  offsetMultiplier,
}: {
  width: number;
  scrollX: SharedValue<number>;
  speedMultiplier: number;
  layerNode: React.ReactNode;
  offsetMultiplier: number; // 0 or 1
}) {
  const transform = useDerivedValue(() => {
    "worklet";
    const base = -((scrollX.value * speedMultiplier) % width);
    return [{ translateX: base + offsetMultiplier * width }];
  });

  return <Group transform={transform}>{layerNode}</Group>;
}

function ScrollingLayer({
  width,
  scrollX,
  speedMultiplier,
  layerNode,
}: {
  width: number;
  scrollX: SharedValue<number>;
  speedMultiplier: number;
  layerNode: React.ReactNode;
}) {
  return (
    <Group>
      <ScrollingLayerGroup
        width={width}
        scrollX={scrollX}
        speedMultiplier={speedMultiplier}
        layerNode={layerNode}
        offsetMultiplier={0}
      />
      <ScrollingLayerGroup
        width={width}
        scrollX={scrollX}
        speedMultiplier={speedMultiplier}
        layerNode={layerNode}
        offsetMultiplier={1}
      />
    </Group>
  );
}

export function ParallaxBackground({ scrollX, elapsedMs }: ParallaxBackgroundProps) {
  const farLayerNode = useMemo(() => (
    <Group>
      <Path
        path={`M 0 0 L 150 0 L 300 ${GAME_HEIGHT} L 100 ${GAME_HEIGHT} Z M 450 0 L 600 0 L 800 ${GAME_HEIGHT} L 600 ${GAME_HEIGHT} Z`}
        color="#ffffff08"
        style="fill"
      />
      <Path
        path={`M 0 ${GAME_HEIGHT} Q 150 ${GAME_HEIGHT - 120} 300 ${GAME_HEIGHT} T 600 ${GAME_HEIGHT} T ${LAYER_WIDTH} ${GAME_HEIGHT} Z`}
        color="#15294a"
        style="fill"
      />
      <Path
        path={`M 150 ${GAME_HEIGHT} Q 250 ${GAME_HEIGHT - 180} 350 ${GAME_HEIGHT} T 750 ${GAME_HEIGHT} T ${LAYER_WIDTH} ${GAME_HEIGHT} Z`}
        color="#112240"
        style="fill"
      />
    </Group>
  ), []);

  const midLayerNode = useMemo(() => (
    <Group>
      <Path
        path={`M 0 ${GAME_HEIGHT} L 0 ${GAME_HEIGHT - 30} Q 200 ${GAME_HEIGHT - 80} 400 ${GAME_HEIGHT - 30} T ${LAYER_WIDTH} ${GAME_HEIGHT - 40} L ${LAYER_WIDTH} ${GAME_HEIGHT} Z`}
        color="#1a365d"
        style="fill"
      />
      <Path
        path={`M 80 ${GAME_HEIGHT - 20} Q 100 ${GAME_HEIGHT - 120} 120 ${GAME_HEIGHT - 20} M 350 ${GAME_HEIGHT - 30} Q 380 ${GAME_HEIGHT - 150} 410 ${GAME_HEIGHT - 30} M 650 ${GAME_HEIGHT - 35} Q 680 ${GAME_HEIGHT - 170} 710 ${GAME_HEIGHT - 35}`}
        color="#234a80"
        style="stroke"
        strokeWidth={18}
        strokeCap="round"
        strokeJoin="round"
      />
      <Path
        path={`M 90 ${GAME_HEIGHT - 20} Q 100 ${GAME_HEIGHT - 90} 110 ${GAME_HEIGHT - 20} M 365 ${GAME_HEIGHT - 30} Q 380 ${GAME_HEIGHT - 100} 395 ${GAME_HEIGHT - 30} M 665 ${GAME_HEIGHT - 35} Q 680 ${GAME_HEIGHT - 110} 695 ${GAME_HEIGHT - 35}`}
        color="#2f66ab"
        style="stroke"
        strokeWidth={8}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  ), []);

  const nearLayerNode = useMemo(() => (
    <Group>
      <Path
        path={`M 0 ${GAME_HEIGHT} L 0 ${GAME_HEIGHT - 16} Q 220 ${GAME_HEIGHT - 28} 420 ${GAME_HEIGHT - 12} T ${LAYER_WIDTH} ${GAME_HEIGHT - 18} L ${LAYER_WIDTH} ${GAME_HEIGHT} Z`}
        color="#0f2744"
        style="fill"
      />
      <Path
        path={`M 120 ${GAME_HEIGHT - 14} Q 135 ${GAME_HEIGHT - 80} 150 ${GAME_HEIGHT - 14} M 520 ${GAME_HEIGHT - 18} Q 540 ${GAME_HEIGHT - 96} 560 ${GAME_HEIGHT - 18}`}
        color="#1d4f7a"
        style="stroke"
        strokeWidth={10}
        strokeCap="round"
        strokeJoin="round"
      />
    </Group>
  ), []);

  return (
    <Group>
      <ScrollingLayer width={LAYER_WIDTH} scrollX={scrollX} speedMultiplier={0.2} layerNode={farLayerNode} />
      <ScrollingLayer width={LAYER_WIDTH} scrollX={scrollX} speedMultiplier={0.5} layerNode={midLayerNode} />
      <ScrollingLayer width={LAYER_WIDTH} scrollX={scrollX} speedMultiplier={1.0} layerNode={nearLayerNode} />
      <Rect x={0} y={0} width={GAME_WIDTH} height={GAME_HEIGHT}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, GAME_HEIGHT)}
          colors={["#00a8ff11", "#00227788"]}
        />
      </Rect>
    </Group>
  );
}
