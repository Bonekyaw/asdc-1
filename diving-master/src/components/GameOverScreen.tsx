import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn, ZoomIn, SlideInDown } from "react-native-reanimated";

export interface GameOverScreenProps {
  score: number;
  highScore: number;
  level: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function GameOverScreen({
  score,
  highScore,
  level,
  onPlayAgain,
  onMainMenu,
}: GameOverScreenProps) {
  const isNewHighScore = score > 0 && score >= highScore;

  return (
    <Animated.View entering={FadeIn.duration(800)} style={styles.overlay}>
      <Animated.View entering={ZoomIn.duration(600).springify()} style={styles.container}>
        <Text style={styles.title}>Game Over</Text>

        <Animated.View entering={SlideInDown.delay(200).duration(400)} style={styles.statsContainer}>
          <Text style={styles.statLabel}>Level Reached</Text>
          <Text style={styles.statValue}>{level}</Text>

          <Text style={styles.statLabel}>Final Score</Text>
          <Text style={styles.statValue}>{score}</Text>

          {isNewHighScore ? (
            <Text style={styles.newHighScoreText}>🎉 New High Score! 🎉</Text>
          ) : (
            <>
              <Text style={styles.statLabel}>High Score</Text>
              <Text style={styles.statValue}>{highScore}</Text>
            </>
          )}
        </Animated.View>

        <Animated.View entering={SlideInDown.delay(400).duration(400)} style={styles.buttonContainer}>
          <TouchableOpacity style={styles.playAgainButton} onPress={onPlayAgain} activeOpacity={0.8}>
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={onMainMenu} activeOpacity={0.8}>
            <Text style={styles.menuText}>Main Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 22, 40, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  container: {
    width: "80%",
    maxWidth: 400,
    backgroundColor: "rgba(20, 40, 70, 0.95)",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(60, 120, 200, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#f87171",
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 2,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  statsContainer: {
    alignItems: "center",
    marginBottom: 32,
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 16,
    padding: 20,
  },
  statLabel: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#f8fafc",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  newHighScoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fbbf24",
    marginTop: 20,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
  playAgainButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playAgainText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  menuButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#475569",
  },
  menuText: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
