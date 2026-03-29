import { useMemo } from "react";
import { Group, Path, Circle, Rect, LinearGradient, vec } from "@shopify/react-native-skia";
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
  renderLayer,
  keyPrefix,
}: {
  width: number;
  scrollX: SharedValue<number>;
  speedMultiplier: number;
  renderLayer: () => React.ReactNode;
  keyPrefix: string;
}) {
  const layerNode = useMemo(() => renderLayer(), [renderLayer]);

  return (
    <Group>
      <ScrollingLayerGroup
        key={`${keyPrefix}-1`}
        width={width}
        scrollX={scrollX}
        speedMultiplier={speedMultiplier}
        layerNode={layerNode}
        offsetMultiplier={0}
      />
      <ScrollingLayerGroup
        key={`${keyPrefix}-2`}
        width={width}
        scrollX={scrollX}
        speedMultiplier={speedMultiplier}
        layerNode={layerNode}
        offsetMultiplier={1}
      />
    </Group>
  );
}

function BackgroundFish({ 
  school, 
  elapsedMs 
}: { 
  school: { x: number, y: number, scale: number, speed: number, offset: number };
  elapsedMs: SharedValue<number>;
}) {
  const transform = useDerivedValue(() => {
    "worklet";
    const fishX = (school.x + elapsedMs.value * school.speed) % LAYER_WIDTH;
    const fishY = school.y + Math.sin(elapsedMs.value * 0.001 + school.offset) * 15;
    return [{ translateX: fishX }, { translateY: fishY }, { scale: school.scale }];
  });

  return (
    <Group transform={transform} opacity={0.5}>
      <Path path="M 0 0 C 8 6, 20 6, 30 0 C 20 -6, 8 -6, 0 0 M 30 0 L 36 6 L 36 -6 Z" color="#4773aa" />
      <Path path="M -20 -20 C -12 -14, 0 -14, 10 -20 C 0 -26, -12 -26, -20 -20 M 10 -20 L 16 -14 L 16 -26 Z" color="#4773aa" />
      <Path path="M -10 20 C -2 26, 10 26, 20 20 C 10 14, -2 14, -10 20 M 20 20 L 26 26 L 26 14 Z" color="#3a6b8c" />
    </Group>
  );
}

function NearLayerBubble({
  bubble,
  elapsedMs
}: {
  bubble: { cx: number, cy: number, r: number, wobbleSpeed: number, wobbleOffset: number };
  elapsedMs: SharedValue<number>;
}) {
  const transform = useDerivedValue(() => {
    "worklet";
    const floatCy = (bubble.cy - elapsedMs.value * 0.05) % GAME_HEIGHT;
    const boundedCy = floatCy < -20 ? floatCy + GAME_HEIGHT + 20 : floatCy;
    const wobbleCx = bubble.cx + Math.sin(elapsedMs.value * bubble.wobbleSpeed + bubble.wobbleOffset) * 10;
    return [{ translateX: wobbleCx }, { translateY: boundedCy }];
  });

  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={bubble.r} color="#ffffff44" />
    </Group>
  );
}

export function ParallaxBackground({ scrollX, elapsedMs }: ParallaxBackgroundProps) {
  const nearLayerBubbles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      cx: Math.random() * LAYER_WIDTH,
      cy: Math.random() * GAME_HEIGHT,
      r: Math.random() * 5 + 1,
      wobbleSpeed: Math.random() * 0.003 + 0.001,
      wobbleOffset: Math.random() * Math.PI * 2,
    }));
  }, []);

  const bgFishSchools = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      x: Math.random() * LAYER_WIDTH,
      y: Math.random() * (GAME_HEIGHT / 2) + 40,
      scale: Math.random() * 0.4 + 0.3,
      speed: Math.random() * 0.03 + 0.01,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  const renderFarLayer = useMemo(() => () => (
    <Group>
      <Path
        path={`M 0 0 L 150 0 L 300 ${GAME_HEIGHT} L 100 ${GAME_HEIGHT} Z M 450 0 L 600 0 L 800 ${GAME_HEIGHT} L 600 ${GAME_HEIGHT} Z`}
        color="#ffffff08"
        style="fill"
      />
      {bgFishSchools.map((school) => (
        <BackgroundFish key={school.id} school={school} elapsedMs={elapsedMs} />
      ))}
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
  ), [bgFishSchools, elapsedMs]);

  const renderMidLayer = useMemo(() => () => (
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

  const renderNearLayer = useMemo(() => () => (
    <Group>
      {nearLayerBubbles.map((bubble) => (
        <NearLayerBubble key={bubble.id} bubble={bubble} elapsedMs={elapsedMs} />
      ))}
    </Group>
  ), [nearLayerBubbles, elapsedMs]);

  const causticsPath1 = useDerivedValue(() => {
    "worklet";
    const wave = Math.sin(elapsedMs.value * 0.001) * 20;
    return `M 0 40 Q 200 ${40 + wave} 400 40 T ${GAME_WIDTH} 40`;
  });
  const causticsPath2 = useDerivedValue(() => {
    "worklet";
    const wave = Math.cos(elapsedMs.value * 0.0015) * 30;
    return `M 0 70 Q 300 ${70 + wave} 550 70 T ${GAME_WIDTH} 70`;
  });
  const causticsPath3 = useDerivedValue(() => {
    "worklet";
    const wave = Math.sin(elapsedMs.value * 0.0008) * 25;
    return `M 0 100 Q 250 ${100 + wave} 600 100 T ${GAME_WIDTH} 100`;
  });

  return (
    <Group>
      <ScrollingLayer width={LAYER_WIDTH} scrollX={scrollX} speedMultiplier={0.2} renderLayer={renderFarLayer} keyPrefix="far" />
      <ScrollingLayer width={LAYER_WIDTH} scrollX={scrollX} speedMultiplier={0.5} renderLayer={renderMidLayer} keyPrefix="mid" />
      <ScrollingLayer width={LAYER_WIDTH} scrollX={scrollX} speedMultiplier={1.0} renderLayer={renderNearLayer} keyPrefix="near" />
      <Group>
        <Path path={causticsPath1} color="#ffffff22" style="stroke" strokeWidth={3} />
        <Path path={causticsPath2} color="#ffffff18" style="stroke" strokeWidth={4} />
        <Path path={causticsPath3} color="#ffffff11" style="stroke" strokeWidth={6} />
      </Group>
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
