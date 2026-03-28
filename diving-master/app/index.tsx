import { StyleSheet, View } from "react-native";

import { GameCrashBoundary } from "@/src/components/GameCrashBoundary";
import { GameCanvas } from "@/src/components/GameCanvas";

export default function GameScreen() {
  return (
    <View style={styles.screen}>
      <GameCrashBoundary>
        <GameCanvas />
      </GameCrashBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
