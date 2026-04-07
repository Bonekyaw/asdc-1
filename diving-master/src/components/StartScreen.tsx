import { useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import Animated, { FadeIn, SlideInDown, ZoomIn } from "react-native-reanimated";
import { Canvas, Fill, FitBox, rect } from "@shopify/react-native-skia";
import { Ionicons } from "@expo/vector-icons";

import { GAME_WIDTH, GAME_HEIGHT } from "@/src/constants/game-viewport";
import { useGameFrame } from "@/src/hooks/useGameFrame";
import { useSwimmer } from "@/src/hooks/useSwimmer";
import { useScrollController } from "@/src/hooks/useScrollController";
import { useScoreManager } from "@/src/hooks/useScoreManager";
import { ParallaxBackground } from "@/src/components/ParallaxBackground";
import { Swimmer } from "@/src/components/Swimmer";

export interface StartScreenProps {
  onStartGame: () => void;
  onSettings?: () => void;
}

export function StartScreen({ onStartGame, onSettings }: StartScreenProps) {
  const { width, height } = useWindowDimensions();
  const clock = useGameFrame({ autostart: true, paused: false });
  const scrollController = useScrollController(1, clock.timeMs);
  const swimmer = useSwimmer(clock.timeMs, width, height, "tap");
  const { highScore } = useScoreManager(0);

  const src = rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const dst = rect(0, 0, width, height);

  // Auto-bobbing swimmer for the preview using standard Swimmer logic
  useEffect(() => {
    // Just simulating a passive middle screen bob
    swimmer.swimmerY.value = GAME_HEIGHT / 2;
  }, [swimmer.swimmerY]);

  return (
    <View style={styles.root}>
      {/* Background Preview */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Canvas style={{ flex: 1, width, height }}>
          <Fill color="#0a1628" />
          <FitBox src={src} dst={dst} fit="contain">
            <ParallaxBackground scrollX={scrollController.scrollX} elapsedMs={clock.timeMs} />
            <Swimmer
              rootTransform={swimmer.rootTransform}
              armTransformLeft={swimmer.armTransformLeft}
              armTransformRight={swimmer.armTransformRight}
              legTransformLeft={swimmer.legTransformLeft}
              legTransformRight={swimmer.legTransformRight}
            />
          </FitBox>
        </Canvas>
      </View>

      {/* UI Overlay */}
      <Animated.View entering={FadeIn.duration(1000)} style={styles.overlay}>
        
        {/* Settings Icon */}
        <TouchableOpacity style={styles.settingsButton} onPress={onSettings} activeOpacity={0.7}>
          <Ionicons name="settings-sharp" size={32} color="#94a3b8" />
        </TouchableOpacity>

        {/* Title */}
        <Animated.View entering={ZoomIn.springify().damping(12).mass(0.9)} style={styles.titleContainer}>
          <Text style={styles.titleText}>REEF</Text>
          <Text style={styles.titleTextHighlight}>RUNNER</Text>
        </Animated.View>

        {/* Instructions */}
        <Animated.View entering={SlideInDown.delay(300).duration(600)} style={styles.instructionsContainer}>
          <Ionicons name="finger-print-outline" size={28} color="#60a5fa" style={{ marginBottom: 8 }} />
          <Text style={styles.instructionText}>Tap or Drag to swim.</Text>
          <Text style={styles.instructionSubtext}>Avoid obstacles, collect coins & diamonds!</Text>
        </Animated.View>

        {/* Start Button */}
        <Animated.View entering={SlideInDown.delay(500).duration(600).springify()}>
          <TouchableOpacity style={styles.startButton} onPress={onStartGame} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>START GAME</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* High Score Badge */}
        {highScore > 0 && (
          <Animated.View entering={FadeIn.delay(800)} style={styles.highScoreContainer}>
            <Ionicons name="trophy" size={20} color="#fbbf24" style={{ marginRight: 8 }} />
            <Text style={styles.highScoreText}>Best Score: {highScore}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a1628",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 15, 30, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  settingsButton: {
    position: "absolute",
    top: 60,
    right: 32,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 24,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  titleText: {
    fontSize: 56,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  titleTextHighlight: {
    fontSize: 64,
    fontWeight: "900",
    color: "#38bdf8",
    letterSpacing: 6,
    marginTop: -10,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  instructionsContainer: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.3)",
    marginBottom: 40,
  },
  instructionText: {
    color: "#e2e8f0",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 1,
  },
  instructionSubtext: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 48,
    paddingVertical: 20,
    borderRadius: 100,
    shadowColor: "#60a5fa",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#93c5fd",
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 2,
  },
  highScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 50,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  highScoreText: {
    color: "#fbbf24",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
