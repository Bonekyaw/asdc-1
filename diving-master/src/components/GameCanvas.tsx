import { createContext, useContext } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { Canvas, Fill, FitBox, rect } from "@shopify/react-native-skia";

import type { FrameClock, GameCanvasProps } from "@/src/types/game-canvas";
import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";
import { useFishSchool } from "@/src/hooks/useFishSchool";
import { useGameFrame } from "@/src/hooks/useGameFrame";
import { useSeaTurtle } from "@/src/hooks/useSeaTurtle";
import { useSwimmer } from "@/src/hooks/useSwimmer";
import { FishSchool } from "@/src/components/FishSchool";
import { SeaTurtle } from "@/src/components/SeaTurtle";
import { Swimmer } from "@/src/components/Swimmer";

const GameFrameContext = createContext<FrameClock | null>(null);

/** Use in React Native views that are descendants of GameCanvas but outside Skia `<Canvas>`. */
export function useGameFrameClock(): FrameClock {
  const ctx = useContext(GameFrameContext);
  if (!ctx) {
    throw new Error("useGameFrameClock must be used within GameCanvas");
  }
  return ctx;
}

export function GameCanvas({
  children,
  backgroundColor = "#0a1628",
  paused = false,
  touchControlMode = "drag",
}: GameCanvasProps) {
  const { width, height } = useWindowDimensions();
  const clock = useGameFrame({ autostart: true, paused });

  const src = rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const dst = rect(0, 0, width, height);

  const swimmer = useSwimmer(clock.timeMs, width, height, touchControlMode);
  const fishSchool = useFishSchool(clock.timeMs, paused);
  const seaTurtle = useSeaTurtle(clock.timeMs, paused);

  const skiaChildren =
    typeof children === "function"
      ? children(clock)
      : children != null
        ? children
        : (
            <>
              {fishSchool.isAlive ? (
                <FishSchool
                  fishCount={fishSchool.fishCount}
                  schoolTransform={fishSchool.schoolTransform}
                  bodyWobble={fishSchool.bodyWobble}
                />
              ) : null}
              {seaTurtle.isAlive ? (
                <SeaTurtle
                  rootTransform={seaTurtle.rootTransform}
                  flipperFrontUpper={seaTurtle.flipperFrontUpper}
                  flipperFrontLower={seaTurtle.flipperFrontLower}
                  flipperRearUpper={seaTurtle.flipperRearUpper}
                  flipperRearLower={seaTurtle.flipperRearLower}
                />
              ) : null}
              <Swimmer
                rootTransform={swimmer.rootTransform}
                armTransformLeft={swimmer.armTransformLeft}
                armTransformRight={swimmer.armTransformRight}
                legTransformLeft={swimmer.legTransformLeft}
                legTransformRight={swimmer.legTransformRight}
              />
            </>
          );

  return (
    <GameFrameContext.Provider value={clock}>
      <GestureDetector gesture={swimmer.touchGesture}>
        <View style={styles.root} collapsable={false}>
          <Canvas style={[styles.canvas, { width, height }]}>
            <Fill color={backgroundColor} />
            <FitBox src={src} dst={dst} fit="contain">
              {skiaChildren}
            </FitBox>
          </Canvas>
        </View>
      </GestureDetector>
    </GameFrameContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  canvas: {
    flex: 1,
  },
});
