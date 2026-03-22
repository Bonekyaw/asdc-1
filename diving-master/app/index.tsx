import { StyleSheet, View } from "react-native";

import { GameCanvas } from "@/src/components/GameCanvas";

export default function GameScreen() {
  return (
    <View style={styles.screen}>
      <GameCanvas />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
