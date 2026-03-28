import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { LivesManagerState } from "@/src/hooks/useLivesManager";

interface LivesHudProps {
  livesState: LivesManagerState;
}

export function LivesHud({ livesState }: LivesHudProps) {
  const insets = useSafeAreaInsets();
  const shakeValuesRef = useRef(
    Array.from({ length: livesState.totalLives }, () => new Animated.Value(0)),
  );
  const opacityValuesRef = useRef(
    Array.from({ length: livesState.totalLives }, (_, index) =>
      new Animated.Value(livesState.heartStates[index] ? 1 : 0.3),
    ),
  );

  useEffect(() => {
    livesState.heartStates.forEach((isFilled, index) => {
      Animated.timing(opacityValuesRef.current[index], {
        toValue: isFilled ? 1 : 0.3,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  }, [livesState.heartStates]);

  useEffect(() => {
    if (livesState.lostHeartIndex == null) {
      return;
    }

    const shake = shakeValuesRef.current[livesState.lostHeartIndex];
    const opacity = opacityValuesRef.current[livesState.lostHeartIndex];

    shake.setValue(0);
    opacity.setValue(1);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(shake, {
          toValue: -6,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 6,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -4,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [livesState.lossAnimationKey, livesState.lostHeartIndex]);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingLeft: Math.max(insets.left, 0) + 16,
          paddingRight: Math.max(insets.right, 0) + 16,
          paddingBottom: Math.max(insets.bottom, 0) + 34,
        },
      ]}
    >
      <View style={styles.heartsRow}>
        {livesState.heartStates.map((isFilled, index) => (
          <Animated.View
            key={`heart-${index}`}
            style={[
              styles.heartSlot,
              {
                opacity: opacityValuesRef.current[index],
                transform: [{ translateX: shakeValuesRef.current[index] }],
              },
            ]}
          >
            <Text style={[styles.heart, isFilled ? styles.heartFilled : styles.heartEmpty]}>
              ♥
            </Text>
          </Animated.View>
        ))}
      </View>
      {livesState.isGameOver ? (
        <View style={styles.gameOverCard}>
          <Text style={styles.gameOverTitle}>Game Over</Text>
          <Text style={styles.gameOverBody}>You ran out of hearts.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  heartsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heartSlot: {
    width: 24,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    textShadowColor: "rgba(0, 0, 0, 0.28)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heartFilled: {
    color: "#ef4444",
  },
  heartEmpty: {
    color: "#fca5a5",
  },
  gameOverCard: {
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(10, 22, 40, 0.84)",
  },
  gameOverTitle: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "800",
  },
  gameOverBody: {
    marginTop: 4,
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "600",
  },
});
