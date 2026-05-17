import "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { authClient } from "@/lib/auth-client";
import { useOAuthInProgress } from "@/lib/auth-sign-in-state";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthGate />
      <StatusBar hidden />
    </GestureHandlerRootView>
  );
}

function AuthGate() {
  const { data: sessionData, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const oauthInProgress = useOAuthInProgress();
  const navigationReady = Boolean(navigationState?.key);
  const onLoginScreen = segments[0] === "login";
  const hasSession = Boolean(sessionData?.session);

  useEffect(() => {
    if (!isPending) {
      void SplashScreen.hideAsync();
    }
  }, [isPending]);

  useEffect(() => {
    if (isPending || !navigationReady || oauthInProgress) {
      return;
    }

    if (!hasSession && !onLoginScreen) {
      router.replace("/login");
      return;
    }

    if (hasSession && onLoginScreen) {
      router.replace("/");
    }
  }, [hasSession, isPending, navigationReady, oauthInProgress, onLoginScreen, router]);

  if (isPending || !navigationReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1628",
  },
});
