import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Public URL of the diving-api Next.js app (same origin as `/api/auth/*`).
 * Set in `.env` as `EXPO_PUBLIC_AUTH_URL`. For a physical device, use your machine's LAN IP, not `localhost`.
 */
const baseURL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_AUTH_URL ?? "http://localhost:3000",
);

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    expoClient({
      scheme: "divingmaster",
      storagePrefix: "diving-master",
      storage: SecureStore,
    }),
  ],
});
