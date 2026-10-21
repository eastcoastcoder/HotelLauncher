# Hotel Launcher

Android TV home screen for a Sony BRAVIA A90K, built with React Native TV (`react-native-tvos@0.83.0-0`). An Apple TV (tvOS) Xcode project is in `ios/` with deployment target 15.1. Phone, tablet, and a web app are not part of this project.

The UI is a configurable hotel layout: header, D-pad menu, featured stage, now playing panel, and promo banner. Copy and branding live in `src/config/launcherConfig.ts`.

Apple TV runs the same UI. The Discover stage uses a native player there because tvOS has no WebKit. Android TV still uses the WebView. Installed-app launch and the settings photo gallery stay on Android TV.

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

Apple TV simulator (Xcode with the tvOS SDK, after `pod install` succeeds):

```sh
npm run tvos
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

- Discover streams a YouTube channel (WebView on Android TV, native player on Apple TV)
- Installed streaming-app discovery
- Sony tuner, HDMI, boot, or volume hooks
- Persistent settings
