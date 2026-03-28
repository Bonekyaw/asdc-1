import { createContext, useContext, useEffect, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { Canvas, Fill, FitBox, Group, rect } from "@shopify/react-native-skia";

import type { FrameClock, GameCanvasProps } from "@/src/types/game-canvas";
import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";
import { Coin } from "@/src/components/Coin";
import { Diamond } from "@/src/components/Diamond";
import { Coral } from "@/src/components/Coral";
import { LevelHud } from "@/src/components/LevelHud";
import { LivesHud } from "@/src/components/LivesHud";
import { ScoreHud } from "@/src/components/ScoreHud";
import {
  getCollectibleRotation,
  getCollectibleSparkles,
  getDiamondScale,
  useCollectibleSpawner,
} from "@/src/hooks/useCollectibleSpawner";
import { useCollisionHandler } from "@/src/hooks/useCollisionHandler";
import { useGameFrame } from "@/src/hooks/useGameFrame";
import { useLevelManager } from "@/src/hooks/useLevelManager";
import { useLivesManager } from "@/src/hooks/useLivesManager";
import { useScoreManager } from "@/src/hooks/useScoreManager";
import {
  getFishBodyWobbleTransforms,
  getTurtleFlipperTransforms,
  getTurtleOffsetY,
  useObstacleSpawner,
} from "@/src/hooks/useObstacleSpawner";
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
  const [isGameOver, setIsGameOver] = useState(false);
  const [scoreForDifficulty, setScoreForDifficulty] = useState(0);
  const gamePaused = paused || isGameOver;
  const clock = useGameFrame({ autostart: true, paused: gamePaused });

  const src = rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const dst = rect(0, 0, width, height);

  const swimmer = useSwimmer(clock.timeMs, width, height, touchControlMode);
  const levelState = useLevelManager(scoreForDifficulty);
  const obstacleState = useObstacleSpawner(gamePaused, levelState.level);
  const collectibleState = useCollectibleSpawner(
    gamePaused,
    obstacleState.scrollX,
    swimmer.swimmerY,
    obstacleState.obstacles,
  );
  const collisionState = useCollisionHandler(
    gamePaused,
    obstacleState.elapsedMs,
    obstacleState.scrollX,
    swimmer.swimmerY,
    obstacleState.obstacles,
    collectibleState.collectibles,
    obstacleState.removeObstacle,
    collectibleState.collectCollectible,
  );
  const livesState = useLivesManager(collisionState.lives);
  const scoreState = useScoreManager(collisionState.score);

  useEffect(() => {
    setIsGameOver(collisionState.lives <= 0);
  }, [collisionState.lives]);

  useEffect(() => {
    setScoreForDifficulty(collisionState.score);
  }, [collisionState.score]);

  const skiaChildren =
    typeof children === "function"
      ? children(clock)
      : children != null
        ? children
        : (
            <>
              {collectibleState.collectibles.map((collectible) => {
                const rootTransform = [
                  { translateX: collectible.worldX - obstacleState.scrollX },
                  { translateY: collectible.y },
                ];

                if (collectible.kind === "diamond") {
                  return (
                    <Diamond
                      key={collectible.id}
                      rootTransform={rootTransform}
                      scale={getDiamondScale(collectibleState.elapsedMs)}
                      sparkleBursts={getCollectibleSparkles(collectible, collectibleState.elapsedMs)}
                    />
                  );
                }

                return (
                  <Coin
                    key={collectible.id}
                    rootTransform={rootTransform}
                    rotation={getCollectibleRotation(collectibleState.elapsedMs)}
                    sparkleBursts={getCollectibleSparkles(collectible, collectibleState.elapsedMs)}
                  />
                );
              })}
              {obstacleState.obstacles.map((obstacle) => {
                const screenX = obstacle.worldX - obstacleState.scrollX;

                if (obstacle.kind === "fish") {
                  return (
                    <FishSchool
                      key={obstacle.id}
                      fishCount={obstacle.fishCount}
                      schoolTransform={[
                        { translateX: screenX },
                        { translateY: obstacle.y },
                      ]}
                      bodyWobble={getFishBodyWobbleTransforms(obstacleState.elapsedMs)}
                    />
                  );
                }

                if (obstacle.kind === "turtle") {
                  const flippers = getTurtleFlipperTransforms(obstacleState.elapsedMs);
                  return (
                    <SeaTurtle
                      key={obstacle.id}
                      rootTransform={[
                        { translateX: screenX },
                        {
                          translateY: getTurtleOffsetY(
                            obstacle,
                            obstacleState.elapsedMs,
                          ),
                        },
                      ]}
                      flipperFrontUpper={flippers.flipperFrontUpper}
                      flipperFrontLower={flippers.flipperFrontLower}
                      flipperRearUpper={flippers.flipperRearUpper}
                      flipperRearLower={flippers.flipperRearLower}
                    />
                  );
                }

                return (
                  <Coral
                    key={obstacle.id}
                    rootTransform={[
                      { translateX: screenX },
                      { translateY: obstacle.baseY },
                      { scale: obstacle.scale },
                    ]}
                    branchPath={obstacle.branchPath}
                    innerBranchPath={obstacle.innerBranchPath}
                    palette={obstacle.palette}
                  />
                );
              })}
              <Swimmer
                rootTransform={swimmer.rootTransform}
                armTransformLeft={swimmer.armTransformLeft}
                armTransformRight={swimmer.armTransformRight}
                legTransformLeft={swimmer.legTransformLeft}
                legTransformRight={swimmer.legTransformRight}
              />
              {collisionState.hitFlashOpacity > 0 ? (
                <Group opacity={collisionState.hitFlashOpacity}>
                  <Fill color="#ef444433" />
                </Group>
              ) : null}
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
          <LivesHud livesState={livesState} />
          <ScoreHud scoreState={scoreState} />
          <LevelHud levelState={levelState} />
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
