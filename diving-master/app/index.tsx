import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { GameCrashBoundary } from "@/src/components/GameCrashBoundary";
import { GameCanvas } from "@/src/components/GameCanvas";
import { StartScreen } from "@/src/components/StartScreen";

export default function GameScreen() {
  const [gameState, setGameState] = useState<"start" | "playing">("start");
  const [gameKey, setGameKey] = useState(0);

  return (
    <View style={styles.screen}>
      <GameCrashBoundary>
        {gameState === "start" ? (
          <Animated.View key="start" entering={FadeIn.duration(400)} exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFill}>
            <StartScreen onStartGame={() => setGameState("playing")} />
          </Animated.View>
        ) : (
          <Animated.View key={`game-${gameKey}`} entering={ZoomIn.duration(500)} exiting={FadeOut.duration(400)} style={StyleSheet.absoluteFill}>
            <GameCanvas
              key={gameKey}
              onPlayAgain={() => setGameKey((k) => k + 1)}
              onMainMenu={() => {
                setGameKey((k) => k + 1);
                setGameState("start");
              }}
            />
          </Animated.View>
        )}
      </GameCrashBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
