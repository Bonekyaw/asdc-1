import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { LevelManagerState } from "@/src/hooks/useLevelManager";

interface LevelHudProps {
  levelState: LevelManagerState;
}

export function LevelHud({ levelState }: LevelHudProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          paddingTop: Math.max(insets.top, 12) + 8,
          paddingRight: Math.max(insets.right, 0) + 16,
        },
      ]}
    >
      <View style={styles.levelCard}>
        <MaterialIcons name="waves" size={18} color="#7dd3fc" />
        <Text style={styles.levelText}>LEVEL {levelState.level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "flex-end",
  },
  levelCard: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(10, 22, 40, 0.84)",
  },
  levelText: {
    color: "#e0f2fe",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
});
