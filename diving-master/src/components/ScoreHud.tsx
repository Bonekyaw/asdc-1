import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ScoreManagerState } from "@/src/hooks/useScoreManager";

interface ScoreHudProps {
  scoreState: ScoreManagerState;
}

export function ScoreHud({ scoreState }: ScoreHudProps) {
  const insets = useSafeAreaInsets();
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!scoreState.didIncrease) {
      return;
    }

    pulseScale.setValue(0.92);
    Animated.sequence([
      Animated.timing(pulseScale, {
        toValue: 1.1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulseScale, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pulseScale, scoreState.didIncrease, scoreState.score]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          paddingTop: Math.max(insets.top, 12) + 6,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.scoreCard,
          {
            transform: [{ scale: pulseScale }],
          },
        ]}
      >
        <MaterialIcons name="monetization-on" size={18} color="#fbbf24" />
        <Text style={styles.scoreText}>{scoreState.displayedScore}</Text>
      </Animated.View>
      <Text style={styles.highScoreText}>Best {scoreState.highScore}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  scoreCard: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10, 22, 40, 0.84)",
  },
  scoreText: {
    color: "#f8fafc",
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  highScoreText: {
    marginTop: 6,
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
});
