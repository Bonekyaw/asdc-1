import type { ConfigContext, ExpoConfig } from "expo/config";

import appJson from "./app.json";

function iosUrlSchemeFromClientId(iosClientId: string): string {
  const clientPart = iosClientId.replace(/\.apps\.googleusercontent\.com$/i, "");
  return `com.googleusercontent.apps.${clientPart}`;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = { ...config, ...appJson.expo } as ExpoConfig;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

  const plugins: ExpoConfig["plugins"] = (base.plugins ?? []).map((plugin) => {
    if (plugin === "@react-native-google-signin/google-signin" && iosClientId) {
      return [
        "@react-native-google-signin/google-signin",
        { iosUrlScheme: iosUrlSchemeFromClientId(iosClientId) },
      ];
    }
    return plugin;
  });

  return {
    ...base,
    plugins,
  };
};
