import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { Canvas, Fill, FitBox, Group, rect } from "@shopify/react-native-skia";
import Animated, { FadeIn, useSharedValue, withTiming, withSequence, Easing } from "react-native-reanimated";

import type { FrameClock, GameCanvasProps } from "@/src/types/game-canvas";
import { GAME_HEIGHT, GAME_WIDTH } from "@/src/constants/game-viewport";
import { LevelHud } from "@/src/components/LevelHud";
import { LivesHud } from "@/src/components/LivesHud";
import { ScoreHud } from "@/src/components/ScoreHud";
import { useCollectibleSpawner } from "@/src/hooks/useCollectibleSpawner";
import { useCollisionHandler } from "@/src/hooks/useCollisionHandler";
import { useGameFrame } from "@/src/hooks/useGameFrame";
import { useLevelManager } from "@/src/hooks/useLevelManager";
import { useScrollController } from "@/src/hooks/useScrollController";
import { useLivesManager } from "@/src/hooks/useLivesManager";
import { useScoreManager } from "@/src/hooks/useScoreManager";
import { useObstacleSpawner } from "@/src/hooks/useObstacleSpawner";
import { useSwimmer } from "@/src/hooks/useSwimmer";
import { useParticleSystem } from "@/src/hooks/useParticleSystem";
import { Swimmer } from "@/src/components/Swimmer";
import { ParallaxBackground } from "@/src/components/ParallaxBackground";
import { GameOverScreen } from "@/src/components/GameOverScreen";
import { GameObstacle } from "@/src/components/GameObstacle";
import { GameCollectible } from "@/src/components/GameCollectible";

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
  onPlayAgain,
  onMainMenu,
}: GameCanvasProps) {
  const { width, height } = useWindowDimensions();
  const [isGameOver, setIsGameOver] = useState(false);
  const [levelUpFreeze, setLevelUpFreeze] = useState(false);
  const [scoreForDifficulty, setScoreForDifficulty] = useState(0);
  const levelUpFreezeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gamePaused = paused || isGameOver || levelUpFreeze;
  const clock = useGameFrame({ autostart: true, paused: gamePaused });

  const src = rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const dst = rect(0, 0, width, height);

  const gameOverDimOpacity = useSharedValue(0);
  const screenFlash = useSharedValue(0);

  const swimmer = useSwimmer(clock.timeMs, width, height, touchControlMode);
  const levelState = useLevelManager(scoreForDifficulty);
  const scrollController = useScrollController(levelState.level, clock.timeMs);
  const obstacleState = useObstacleSpawner(gamePaused, levelState.level, scrollController, clock.timeMs);
  const collectibleState = useCollectibleSpawner(
    gamePaused,
    clock.timeMs,
    scrollController.scrollX,
    scrollController.speedMultiplier,
    swimmer.swimmerY,
    obstacleState.obstacles,
  );

  const { addParticleEffect, renderParticles, cameraShakeTransform } = useParticleSystem();

  const handleHit = useCallback((x: number, y: number) => {
    swimmer.triggerHit();
    addParticleEffect("hit", x, y);
  }, [swimmer, addParticleEffect]);

  const handleCollect = useCallback((kind: "coin" | "diamond", x: number, y: number) => {
    swimmer.triggerCollect();
    addParticleEffect(kind, x, y);
  }, [swimmer, addParticleEffect]);

  const collisionState = useCollisionHandler(
    gamePaused,
    clock.timeMs,
    scrollController.scrollX,
    scrollController.speedMultiplier,
    swimmer.swimmerY,
    obstacleState.obstacles,
    collectibleState.collectibles,
    obstacleState.removeObstacle,
    collectibleState.collectCollectible,
    handleHit,
    handleCollect
  );
  
  const livesState = useLivesManager(collisionState.lives);
  const scoreState = useScoreManager(collisionState.score);

  const previousLevel = useRef(0);
  useEffect(() => {
    if (previousLevel.current > 0 && levelState.level > previousLevel.current) {
      addParticleEffect("levelup", GAME_WIDTH / 2, GAME_HEIGHT / 4);
      
      setLevelUpFreeze(true);
      screenFlash.value = withSequence(
        withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) })
      );
      if (levelUpFreezeTimeoutRef.current != null) {
        clearTimeout(levelUpFreezeTimeoutRef.current);
      }
      levelUpFreezeTimeoutRef.current = setTimeout(() => {
        setLevelUpFreeze(false);
        levelUpFreezeTimeoutRef.current = null;
      }, 800);
    }
    previousLevel.current = levelState.level;
  }, [levelState.level, addParticleEffect, screenFlash]);

  useEffect(() => {
    return () => {
      if (levelUpFreezeTimeoutRef.current != null) {
        clearTimeout(levelUpFreezeTimeoutRef.current);
        levelUpFreezeTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (collisionState.lives <= 0) {
      setIsGameOver(true);
      gameOverDimOpacity.value = withTiming(1, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [collisionState.lives, gameOverDimOpacity]);

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
              {/* Background — all animations driven by UI-thread SharedValues */}
              <ParallaxBackground scrollX={scrollController.scrollX} elapsedMs={clock.timeMs} />

              {/* Collectibles — screen position, rotation, scale all computed on UI thread */}
              {collectibleState.collectibles.map((collectible) => (
                <GameCollectible
                  key={collectible.id}
                  collectible={collectible}
                  scrollX={scrollController.scrollX}
                  timeMs={clock.timeMs}
                />
              ))}

              {/* Obstacles — screen position, wobble, flippers all computed on UI thread */}
              {obstacleState.obstacles.map((obstacle) => (
                <GameObstacle
                  key={obstacle.id}
                  obstacle={obstacle}
                  scrollX={scrollController.scrollX}
                  timeMs={clock.timeMs}
                  speedMultiplier={scrollController.speedMultiplier}
                />
              ))}

              {/* Swimmer — already fully UI-thread animated */}
              <Swimmer
                rootTransform={swimmer.rootTransform}
                armTransformLeft={swimmer.armTransformLeft}
                armTransformRight={swimmer.armTransformRight}
                legTransformLeft={swimmer.legTransformLeft}
                legTransformRight={swimmer.legTransformRight}
                hitFlashOpacity={swimmer.hitFlashOpacity}
                collectSparklePhase={swimmer.collectSparklePhase}
              />

              {/* Hit flash overlay */}
              <Group opacity={collisionState.hitFlashOpacity}>
                <Fill color="#ef444433" />
              </Group>
            </>
          );

  return (
    <GameFrameContext.Provider value={clock}>
      <GestureDetector gesture={swimmer.touchGesture}>
        <View style={styles.root} collapsable={false}>
          <Canvas style={[styles.canvas, { width, height }]}>
            <Fill color={backgroundColor} />
            <FitBox src={src} dst={dst} fit="contain">
              <Group transform={cameraShakeTransform}>
                {skiaChildren}
              </Group>
              {renderParticles()}
              <Group opacity={screenFlash}>
                <Fill color="#FFFFFF" />
              </Group>
              {isGameOver && (
                <Group opacity={gameOverDimOpacity}>
                  <Fill color="rgba(0, 0, 0, 0.55)" />
                </Group>
              )}
            </FitBox>
          </Canvas>
          <LivesHud livesState={livesState} />
          <ScoreHud scoreState={scoreState} />
          <LevelHud levelState={levelState} />
          {isGameOver && (
            <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(800).delay(300)}>
              <GameOverScreen
                score={scoreState.score}
                highScore={scoreState.highScore}
                level={levelState.level}
                onPlayAgain={() => onPlayAgain?.()}
                onMainMenu={() => onMainMenu?.()}
              />
            </Animated.View>
          )}
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
