# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Authentication (diving-api)

This app signs in with **Better Auth** + **Google** against the [`diving-api`](../diving-api) Next.js backend.

1. Copy [`.env.example`](./.env.example) to `.env` and set **`EXPO_PUBLIC_AUTH_URL`** (no trailing slash). Use the **same host** as **`BETTER_AUTH_URL`** in `diving-api/.env` (e.g. both `http://127.0.0.1:3000` on simulator — do not mix `localhost` and `127.0.0.1`).
2. Configure **Google OAuth** and **`diving-api`** env vars as described in [`diving-api/README.md`](../diving-api/README.md) (especially **`BETTER_AUTH_URL`**, **`BETTER_AUTH_SECRET`**, **`GOOGLE_CLIENT_ID`**, **`GOOGLE_CLIENT_SECRET`**).
3. Set **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`** to the same **Web** OAuth client ID as **`GOOGLE_CLIENT_ID`** on the API (required for native Google Sign-In on Android).
4. **iOS dev builds:** set **`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`**, then rebuild the dev client. Native sign-in does **not** fall back to browser OAuth.
5. **Expo Go** uses browser OAuth only. **Development builds** use native Google Sign-In (one account picker, no second browser).
6. **Manual verification:** After signing in with Google once, confirm in Postgres that a row exists in **`user`** with **`role`** `PLAYER` and a linked **`account`** row for provider **`google`**.

If `npm install` hits peer dependency conflicts with `better-auth`, use:

```bash
npm install --legacy-peer-deps
```

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Performance Profiling

Use the React Native Performance Monitor while testing gameplay changes:

1. Start the app with `npx expo start`.
2. Open the developer menu on device or simulator.
3. Enable `Show Performance Monitor`.
4. Watch JS/UI FPS while spawning dense obstacle waves and collecting long item chains.

The current gameplay loop is tuned to keep active obstacle and collectible counts capped, recycle pooled objects, and drive runtime motion from Reanimated shared values so FPS drops are easier to isolate in the monitor.

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
