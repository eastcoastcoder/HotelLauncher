# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Grok and other agents in this repo should follow it the same way.

`PLAN.md` is the living plan. Read the phase you are touching before changing behavior. This file is the short operating guide. It does not replace `PLAN.md`.

## What this is

HotelLauncher is a D-pad hotel home screen for Android TV, aimed at a Sony BRAVIA A90K. The same UI also builds for Apple TV (tvOS 15.1). Phone, tablet, and web are out of scope.

Stack: React 19.2, TypeScript, `react-native` aliased to `react-native-tvos@0.83.0-0`, New Architecture and Hermes on (`android/gradle.properties`). Application id `com.hotellauncher`. Launch activity `.MainActivity`.

`App.tsx` renders `AppProviders` and `TVApp`. Global state is React context, not a third-party store. `BackgroundProvider` owns menu backgrounds. A later theme context belongs beside it in `src/context/AppProviders.tsx`. The current dark look stays the default.

## Commands

```sh
npm install          # postinstall patches webview codegen, fmt, and the CLI simulator lookup
npm start            # Metro on 8081
npm run android      # device; use --device, not --deviceId
npm run android:emulator
npm run tvos         # Apple TV 4K (3rd generation) simulator, tvOS 18.0
npm test
npm run lint
npx tsc --noEmit
```

Sideload when the TV should not depend on Metro:

```sh
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Native Kotlin, new native modules, and Gradle dependency changes reach the TV only after an install. A Metro reload is enough for JavaScript.

tvOS builds need a full Xcode, not Command Line Tools: `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`. Open `ios/HotelLauncher.xcworkspace` after `pod install`, not the `.xcodeproj`. `react-native/scripts/cocoapods/utils.rb` requires Xcode >= 16.1. This machine has Xcode 16.0. A one-off bypass of that check has been used for `pod install` and must be restored in `node_modules`. Do not `brew install cocoapods` on this macOS 14 host.

## Layout

```text
Header     logo | welcome | weather + clock
Body       side nav | screen | (Discover only: now playing)
Footer     promo banner, Discover only
```

Menu: Discover, Watch TV, Stream, My Media, Hotel Info, Settings. Copy and branding live in `src/config/launcherConfig.ts`. Screens are `src/screens/*`, chosen by `ScreenId` in `src/navigation/TVApp.tsx`. Back returns to Discover, or leaves stage fullscreen first.

Column sizes that match the hotel reference: side nav width 200 (`SideNavigation`), now playing width 188 and art height 72 (`NowPlayingPanel`), body `paddingHorizontal` 28. The A90K panel is 3840×2160 at density 320. The app is checked under a `wm` override of 1920×1080 at density 320.

Default screen background is hard black through 75%, then the gradient in `defaultScreenGradient` (`src/theme/screenBackground.ts`). `colors.background` is `#000000`. Menu hover and select swap that gradient for a photo plus scrim from `menuBackgrounds`, keyed by menu id. Hover wins over the last selected id. A row with no image restores the default gradient.

Android `Image` sizing: do not put `aspectRatio` on the `Image`. Size an `overflow: 'hidden'` frame and fill it with `width`/`height` `100%` and `resizeMode="contain"`. Do not add `StyleSheet.absoluteFillObject`. It is deprecated. `StyleSheet.absoluteFill` is the replacement. Existing uses in `YouTubeStage.tsx` and `MainStage.tsx` are leftovers.

## Focus

D-pad only. Focus must be obvious. `Focusable` is the shared pressable. `onFocusChange` drives the emphasized row.

Nested menus (Stream, My Media, Hotel Info) stay unselected until the user arrows into them. Screen content changes on Select, not on focus. Left returns to the main-menu row that opened that screen. `NavReturnProvider` (`src/navigation/NavReturn.tsx`) stores per-screen native tags and sets `nextFocusLeft` / `nextFocusRight`. It does not use `TVFocusGuideView` `autoFocus`. That prop does not apply reliably under the New Architecture.

`hasTVPreferredFocus` belongs only on the active main-menu row. Do not fall back to index 0. Submenu rows use `screen: null` and must not claim preferred focus unless `preferredFocusId` is set.

`Focusable` sets `android_disableSound` on focusable rows so Android TV's click listener is the only click. A second `playTouchSound` on key-up was the double-click.

Select key-down often never reaches JavaScript. `ReactFeatureFlags.enableKeyDownEvents` defaults to false, so the activity helper emits key-up and `longSelect`, not ACTION_DOWN. `Pressable` fires `onPress` from key-up. A long press cancels `onPress` only on the `Pressable` that received the long press. A view that gains focus mid-hold can still receive the release.

## Discover stage

`src/config/mainStage.local.json` is gitignored. Metro falls back to `src/config/mainStage.example.json` when it is missing. Fields are `channel` (URL, `@handle`, or channel id) and `exclude` (bare video ids). A missing file, a blank channel, or no videos left after exclusions keeps the static stage.

Do not edit `mainStage.local.json`. Do not quote its channel, handle, or hotel name in tracked source, tests, docs, or commit messages. Tracked examples use `@hotelchannel`.

Playback shuffles the channel, plays one video, then advances, and reshuffles when the deck wraps so the video that just ended is not first. Android TV uses the YouTube IFrame API inside `react-native-webview` 13.16.2 (`YouTubeStage`). tvOS has no WebKit, so `YouTubeStage` mounts `NativeYouTubePlayer` (`AVPlayer`) when `Platform.OS === 'ios' && Platform.isTV`. Do not add `react-native-video` until a `react-native-tvos`-compatible ExoPlayer package is verified. Do not add the Android YouTube player library. Leave captions as they are.

The stage is the D-pad target. Focus unmutes, blur mutes. Enter hides chrome and fills the screen. Back leaves fullscreen and returns focus to the stage. The WebView is not focusable (`tvFocusable={false}`).

RN 0.83 codegen rejects `react-native-webview`'s `navigationType` union. `scripts/patch-react-native-webview.js` collapses it to `string`. The Gradle task must be named `patchWebViewSpec`. A name containing `codegen` makes the patch task depend on itself.

`URL` in this runtime has no `hostname` or `searchParams`. HTTP parsing goes through `src/services/parseHttpUrl.ts`.

## Stream

Rows launch an Android package on Select. Built-in ids are in `launcherConfig`. `customAppId` overrides `appId` and lives in the native `InstalledApps` module (`SharedPreferences` `stream_custom_apps`). The manifest `<queries>` block is required for Android 11+ package visibility. `InstalledApps` is a legacy native module (`isTurboModule: false`), registered from `MainApplication`.

Hold Select on a default row opens an in-window overlay, not a `Modal`. A `Modal` steals window focus while Select is still down and the release closes the dialog. Rows stay non-pressable until that row's `onPressOut`, and `Navigation` stays enabled until the dialog is armed. Read `PLAN.md` "Hold Select still closes the custom-app dialog" before changing this gate.

Guest add / hide / restore is separate AsyncStorage key `stream_layout` (`src/services/streamLayout.ts`). Do not store those keys in `stream_custom_apps`. `getCustomAppIds` treats every string in that file as a package override. Order: visible defaults, added apps, Hidden apps (only while something is hidden), then Add app. Only Stream's `Navigation` is `scrollable`. Hide keeps a default's `customAppId`.

The YouTube row title is DogeTube, menu id `dogetube`. Do not look it up by a YouTube label. Posters are `src/theme/streamPosters.ts`.

On tvOS there is no `InstalledApps` module. Missing native module must leave overrides empty instead of failing the Stream screen.

## Settings and other persistence

Text settings are Guest Name, Discover Channel, and Weather. They persist as one JSON object in AsyncStorage key `launcher_settings` (`src/services/launcherSettings.ts`). There is no settings Kotlin module. Discover Channel starts as the channel read from `mainStage.local.json` (or the example file when that override is missing). A saved channel replaces it for Discover playback. The exclude list still comes from that file. The old placeholder `https://www.youtube.com/@username` is unset. A blank Discover Channel keeps the stage static. Weather is stored only and does not change the weather readout. Welcome text is `welcomeMessageForGuest` over `"Good Evening, {guestName}"`. A blank name leaves `"Good Evening"`.

Hotel Logo is a gallery pick (`react-native-image-picker` plus `react-native-blob-util`), copied to `DocumentDir`. Only `logoPath` is stored. The header falls back to the bundled logo. Those libraries are Android-only. Settings on Apple TV uses `TvAsyncStorage` (`ios/HotelLauncher/TvAsyncStorage.m`), registered as `RNAsyncStorage`.

Settings rows sit in a `TVFocusGuideView` with `trapFocusUp` and `trapFocusDown`. Android TV focus search starts at the text caret, on the left edge, and jumps to the sidebar. `nextFocus*` on `TextInput` does nothing. `ReactTextInputManager` does not apply them. Left stays untrapped so focus can still reach the sidebar.

`react-native.config.js` disables iOS autolinking for `react-native-webview`, AsyncStorage, blob-util, and image-picker. Android autolinking is unchanged.

## Types and JavaScript style

`ScreenId` and `NavIconName` are closed unions. Do not widen them with `| string`. `Navigation` takes `readonly MenuItem[]`. Submenu rows use `screen: null`. `TVApp` ignores a null selection.

JSX runtime is `react-native`. Do not `import React from 'react'`. Import `useEffect`, `forwardRef`, `Component`, and types by name.

`npx tsc --noEmit` still fails on older `ScreenBackground` / `experimental_backgroundImage` nullability. Do not treat that as a failure of unrelated work. Say so when you report typecheck.

## Tests

Jest mocks AsyncStorage with an in-memory `mockStore` in `jest.setup.js`. The package mock is ESM and does not parse. A `jest.mock` factory may only close over variables whose names start with `mock`. The setup also stubs blob-util and image-picker.

`Header` runs a 1s clock interval. The suite can pass and then hang on an open handle. `npx jest --forceExit` is the known way through that.

Jest is not Android TV. `BackHandler` does not subscribe. Stream dialog tests close through `onRequestClose`.

## Verification

A change is done on Android TV when it has been exercised on the A90K with the remote, or you say clearly that it has not. A screenshot during startup is not confirmation. Force-stop, restart `MainActivity`, wake the panel (`KEYCODE_WAKEUP`; `com.sony.dtv.livingfit` can cover the app), then capture.

`sendevent` on the Sony remote is permission denied, so a Select hold cannot be injected. Hold-Select behavior needs the physical remote.

tvOS work is done when the Apple TV simulator launches HotelLauncher and the A90K app still launches. Do not let a tvOS change alter the Android sideload.

## Repo

Remote: `https://github.com/eastcoastcoder/HotelLauncher.git`.

Commit subjects: `type(Scope): sentence`, for example `feat(Stream): launch rows by Android package id`.

`/reference` is gitignored. It holds layout photos. Do not commit it.

When a task is unfinished because the session is out of room, write the remaining work into `PLAN.md` instead of leaving it only in the chat.
