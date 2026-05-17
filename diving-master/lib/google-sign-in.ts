import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";
import { completeSignIn } from "@/lib/auth-session";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? "";
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || undefined;

let configured = false;

/** Native Google Sign-In requires a dev build; Expo Go uses browser OAuth instead. */
export function canUseNativeGoogleSignIn(): boolean {
  if (Platform.OS === "web") {
    return false;
  }
  if (!webClientId) {
    return false;
  }
  if (Constants.appOwnership === "expo") {
    return false;
  }
  return true;
}

export function configureGoogleSignIn(): void {
  if (!canUseNativeGoogleSignIn() || configured) {
    return;
  }

  GoogleSignin.configure({
    webClientId,
    iosClientId,
    offlineAccess: false,
  });
  configured = true;
}

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; message: string; cancelled?: boolean };

function nativeSetupError(): GoogleSignInResult | null {
  if (!webClientId) {
    return {
      ok: false,
      message: "Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in app env.",
    };
  }
  if (Platform.OS === "ios" && !iosClientId) {
    return {
      ok: false,
      message:
        "Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID. Add an iOS OAuth client from Google Cloud and rebuild the dev app.",
    };
  }
  return null;
}

/**
 * Native Google Sign-In → Better Auth `signIn.social` with ID token (no browser redirect).
 */
export async function signInWithGoogleNative(): Promise<GoogleSignInResult> {
  const setupError = nativeSetupError();
  if (setupError) {
    return setupError;
  }

  configureGoogleSignIn();

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { ok: false, message: "Google sign-in was not completed.", cancelled: true };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return {
        ok: false,
        message: "Google did not return an ID token. Check webClientId and OAuth client setup.",
      };
    }

    const tokens = await GoogleSignin.getTokens();

    const result = await authClient.signIn.social({
      provider: "google",
      idToken: {
        token: idToken,
        accessToken: tokens.accessToken,
      },
    });

    if (result.error) {
      return {
        ok: false,
        message: result.error.message ?? "Server rejected Google sign-in.",
      };
    }

    // Cookies may be stored without toggling the session atom (e.g. unchanged cookie values).
    authClient.$store.notify("$sessionSignal");

    return completeSignIn();
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { ok: false, message: "Sign-in cancelled.", cancelled: true };
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        return { ok: false, message: "Sign-in already in progress." };
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { ok: false, message: "Google Play Services is not available." };
      }
    }

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Google sign-in failed.",
    };
  }
}

/**
 * Browser-based OAuth via Better Auth Expo plugin (Expo Go and web only).
 */
export async function signInWithGoogleBrowser(): Promise<GoogleSignInResult> {
  try {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });

    if (result.error) {
      return {
        ok: false,
        message: result.error.message ?? "Sign-in failed.",
      };
    }

    authClient.$store.notify("$sessionSignal");

    return completeSignIn();
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Sign-in failed.",
    };
  }
}

/**
 * Dev build: native only (no browser fallback). Expo Go / web: browser OAuth.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (canUseNativeGoogleSignIn()) {
    return signInWithGoogleNative();
  }

  return signInWithGoogleBrowser();
}
