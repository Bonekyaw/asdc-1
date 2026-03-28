import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

interface GameCrashBoundaryProps {
  children: ReactNode;
}

interface GameCrashBoundaryState {
  hasError: boolean;
}

export class GameCrashBoundary extends Component<
  GameCrashBoundaryProps,
  GameCrashBoundaryState
> {
  state: GameCrashBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): GameCrashBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Game screen crashed", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Game failed to load</Text>
          <Text style={styles.body}>
            A rendering error occurred while opening the game screen.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a1628",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  body: {
    color: "#cbd5e1",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
