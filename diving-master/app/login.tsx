import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { setOAuthInProgress } from "@/lib/auth-sign-in-state";
import {
  canUseNativeGoogleSignIn,
  configureGoogleSignIn,
  signInWithGoogle,
} from "@/lib/google-sign-in";

export default function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    setOAuthInProgress(true);

    try {
      const result = await signInWithGoogle();
      if (!result.ok && !result.cancelled) {
        setError(result.message);
      }
    } finally {
      setOAuthInProgress(false);
      setBusy(false);
    }
  };

  const usesNative = canUseNativeGoogleSignIn();
  const inExpoGo = Constants.appOwnership === "expo";

  return (
    <View style={styles.root}>
      <Text style={styles.title}>REEF RUNNER</Text>
      <Text style={styles.subtitle}>Sign in to play</Text>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={handleGoogle}
        disabled={busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-google" size={22} color="#fff" />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </>
        )}
      </Pressable>
      {inExpoGo ? (
        <Text style={styles.hint}>
          Expo Go uses browser sign-in. For native Google Sign-In, use a development build.
        </Text>
      ) : null}
      {usesNative && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? (
        <Text style={styles.hint}>
          On iOS, set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and rebuild the dev app for native sign-in.
        </Text>
      ) : null}
      {!usesNative && !inExpoGo && !process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? (
        <Text style={styles.hint}>
          Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env for native Google Sign-In on Android.
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a1628",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: "#f8fafc",
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#94a3b8",
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#2563eb",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    minWidth: 260,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  hint: {
    marginTop: 20,
    color: "#64748b",
    fontSize: 13,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 18,
  },
  error: {
    marginTop: 24,
    color: "#f87171",
    fontSize: 14,
    textAlign: "center",
  },
});
