# Hotel Launcher

Android TV home screen for a Sony BRAVIA A90K, built with React Native TV (`react-native-tvos@0.83.0-0`).

The UI is a configurable hotel layout: header, D-pad menu, featured stage, now playing panel, and promo banner. Copy and branding live in `src/config/launcherConfig.ts`.

iOS is not part of this project.

## Requirements

- Node.js 20+
- Android SDK with an Android TV system image, or a TV in developer mode
- `adb` on `PATH`

`ANDROID_HOME` was not set when this project was created. Install the SDK before `npm run android`.

## Run

```sh
npm install
npm start
npm run android
```

Sideload a debug build when an A90K is connected:

```sh
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Home replacement

The manifest includes `LEANBACK_LAUNCHER` and an optional `HOME` / `DEFAULT` filter. On first launch the TV may ask which home app to use. Choose **Hotel Launcher** only for a test.

To restore the stock launcher, hold the remote Home button, or open Settings, Apps, Hotel Launcher, Open by default, and clear the home preference. You can also pick Google TV or Android TV Home from the chooser.

## Remote

Up and Down move through the menu. Select opens a section. Back returns to Discover.

## Not in this build

- Native video playback (the stage is a placeholder until a TV-compatible player is verified)
- Installed streaming-app discovery
- Sony tuner, HDMI, boot, or volume hooks
- Persistent settings
