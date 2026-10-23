# HotelLauncher — Sony BRAVIA A90K

Configurable hotel-TV home screen for **Android TV**, targeted at a **Sony BRAVIA A90K**.
Built with **React Native TV** (`react-native-tvos`). Branding is data-driven so it is not locked to one hotel.

## Scope

Android TV on the Sony BRAVIA A90K stays the proven target for Phases 2–5. Do not add phone, tablet, or web targets. The tvOS Xcode project is restored so it can be fixed alongside that work. See Later — tvOS alongside Android TV.
The A90K may refuse a third-party app as the permanent system Home. The app must stay launchable from the TV apps row and recoverable if Home replacement is declined.

## Stack

- `react-native-tvos@0.83.0-0` via `react-native: npm:react-native-tvos@0.83.0-0`
- TypeScript, React 19
- Android package `com.hotellauncher`
- Design canvas 3840×2160, laid out in density-independent units so 1080p TVs scale

The Discover stage streams YouTube when `src/config/mainStage.local.json` names a channel. That file is gitignored. With no file, a blank channel, or no videos left after exclusions, the stage stays static. Do not add `react-native-video` until a `react-native-tvos`-compatible ExoPlayer package is verified.

## Layout

```text
Header          logo | welcome | weather + clock
Body            side nav | main stage | now playing
Footer          promotional banner
```

Menu: Discover, Watch TV, Stream, My Media, Hotel Info, Settings.

D-pad only: Up, Down, Left, Right, Select, Back. Focus must be obvious. Back returns to Discover.

## Phases

### Phase 1 — MVP

- [x] TV project scaffold (Community CLI + `@react-native-tvos/template-tv@0.83.0-0`)
- [x] iOS target removed
- [x] Dark hotel theme, header, nav, focus, stage, now playing, banner, clock
- [x] Placeholder screens driven by `src/config/launcherConfig.ts`
- [x] `LEANBACK_LAUNCHER` plus optional `HOME` / `DEFAULT` (user can decline)
- [x] `npm install` and TypeScript check
- [x] Sideload debug APK onto the A90K (needs Android SDK + device)

### Phase 2 — Clone

- [x] Add ability to make background change image on focus of Navigation, specifically use bonkflixbg when Bonkflix is active, see User Notes section
- [] Make "Connect my headphones" in My Media open bluetooth settings
- [] Introduce themes. The current layout stays the same. Switching to the retro theme can change the background, sidebar colors, and related surfaces. More themes can be added later to mirror other hotel brands.

### Phase 3 — Functional TV

Installed-app discovery (PackageManager bridge), launch external apps, persistent settings, network/HLS video, promo rotation, QR, weather, screensaver.

- [x] Stream rows launch their Android `appId`. Hold Select opens an installed-app picker, saves `customAppId`, and Clear restores the built-in app.
- [ ] Stream can add extra app rows, hide a default row, and restore hidden defaults one at a time. Code is in the tree. The A90K remote check is not done. See Stream rows the guest can change.

#### Hold Select still closes the custom-app dialog

Symptom on the A90K: hold Select on a Stream row. `CustomAppDialog` opens while Select is still down, then that same hold is delivered as another Select and the dialog closes immediately. Choosing a row calls `onChoose` in `src/screens/Stream.tsx`, which clears `pickerId` and closes the dialog. Back and `Modal` `onRequestClose` also close it, without saving an app.

What the TV stack actually does:

- `Pressable` on Android TV fires `onPress` from key-up. `ReactViewGroup.onKeyUp` always emits PressOut for DPAD_CENTER / ENTER. Pressability's TV `onPressOut` calls `onPress` unless that same Pressable already sent `onLongPress`. A row that gains focus during the hold never saw the key-down, so the release chooses it.
- A long press cancels `onPress` only on the Pressable that received the long press (the nav row).
- `ReactFeatureFlags.enableKeyDownEvents` defaults to false. `ReactRootView`'s Java `ReactAndroidHWInputDeviceHelper` therefore does not emit Select ACTION_DOWN. It emits ACTION_UP, and a long hold as `longSelect`.
- The dialog does not use that Java helper. `ReactModalHostView`'s `OnKeyListener` uses the Kotlin `ReactAndroidHWInputDeviceHelper`, which emits every Select down and up as `eventType: "select"` with `eventKeyAction` 0 or 1. It has no long-press tracking.
- `ReactAccessibilityDelegate` ACTION_CLICK / ACTION_LONG_CLICK emit `select` / `longSelect` with `eventKeyAction` hardcoded to 1, including while the key is still down.
- `Stream` sets `Navigation` `enabled={pickerItem == null}`, so the nav row loses focus as soon as the dialog opens. The release follows focus into the dialog.

Attempts:

1. **Press gate** (`selectPressGate.ts`, `useSelectPressGate.ts`, removed). Phases were `awaitRelease`, then `awaitDown`, then `armed`. Select or longSelect ACTION_UP never armed a choice. ACTION_DOWN armed only after the opening hold. Repeats of that hold stayed locked. `pickerIdRef` blocked the nav row from launching while the picker was open. `lockIfHeld()` ran from `openPicker`. `pressAllowed()` guarded choose and Clear. Jest covered an ignored release and a later Select (23 tests, `tsc`, eslint). Failed on the Android TV emulator: Select key-down never reached JavaScript, so the gate stayed in `awaitDown` and a choice could not arm. Not verified on the A90K before it was removed. Turning on `enableKeyDownEvents` was not tried. That flag would make the activity helper emit downs, but it would not stop PressOut on whichever dialog view is focused when the key comes up. The modal helper already emits those downs once the dialog window exists.

2. **Unfocusable rows until the frame after key-up** (replaced by attempt 3). `useTVEventHandler` waited for `select` or `longSelect` with `eventKeyAction === 1`, then `setTimeout(0)` set `choicesEnabled`. Until then every row and Clear were plain `View`s, and `testID="custom-app-select-guard"` held `hasTVPreferredFocus` with an empty `onPress`. `pickerIdRef` still blocked the nav launch. Jest, `tsc`, and eslint passed. Still closed on device. The key-up handler arms the rows in the same turn as the release, and `setTimeout(0)` can commit the real row and move focus before PressOut is delivered. The row then receives the opening release. A `longSelect` with a hardcoded action of 1 can also arm the rows while Select is still held.

3. **Current code.** Rows and Clear stay non-pressable until the guard's `onPress` runs. That `onPress` is the opening PressOut, so this event cannot be retargeted onto a row mounted while handling it. A `select` ACTION_UP only records that the hold ended. It does not show the rows. A later `select` ACTION_DOWN (the next press, which the modal helper does emit) shows the rows before that press's key-up. `longSelect` is ignored so a synthetic long-click cannot mark the hold as finished. `pickerIdRef` is unchanged. If this still closes the dialog, check which callback ran before changing the gate again:
   - `onChoose` means a choice `Focusable` was already mounted and focused on key-up. Do not show rows from the key-up event or from a timer started by that event.
   - `onClose` / `onRequestClose` means Back, not a row click. `ReactModalHostView` only requests close for KEYCODE_BACK and KEYCODE_ESCAPE. A Sony keycode that arrives as one of those would close the dialog with nothing saved.
   - Next native try: in the modal `OnKeyListener`, if the dialog has not yet seen a Select ACTION_DOWN, consume the first Select ACTION_UP (`return true`) so `ReactViewGroup` never emits PressOut for the opening release. Do not consume a later click. Leaving the nav row focusable until that consumed up is not enough by itself: the modal window takes focus as soon as it is shown, and the release is delivered inside the dialog.

Jest covers attempt 3 (`tsc`, eslint, `__tests__/streamScreen.test.tsx`). The A90K was awake on Discover after a Metro reload, but a 700ms Select hold could not be injected: `sendevent` on `SONY TV VRC 001` is permission denied, and `input keyevent --longpress` is not a timed hold. This attempt still needs the physical remote.

4. **Attempt 3 still closed on the A90K, and the last thing on screen was "Loading installed apps."** That string is rendered only while `listInstalledApps` has not resolved. No app row exists yet, so the close is not `onChoose`. The crash buffer has no `com.hotellauncher` tombstone (other processes: `statementservice`, `com.sony.dtv.interactivetvutil`, and Sony `kyildm` key-log HAL). The main log is flooded by `GPUAUX`, so a JS exception can rotate out. Checked 2026-10-12 around 20:53, process still the one that logged `Running "HotelLauncher"` at 20:51.

   **Current code.** The picker is an overlay in the Stream panel, not a `Modal`. A `Modal` opens a new window while Select is still down, so the key-up never reaches the row that already handled the long press. Rows and Clear stay non-pressable until that row's `onPressOut`. Until then `Navigation` stays `enabled`, so focus does not move into the overlay. `listInstalledApps` catches `Throwable` for the whole query and for each package's `loadLabel`. A bad package is logged as `InstalledApps: Skipped <package>` and kept with its package name as the label. One package can no longer fail the whole list. A native crash inside `PackageManager` would still kill the process; Java `try/catch` does not stop that. The native change is in the APK, so Metro reload alone does not install it.

#### Stream rows the guest can change

The six rows in `streamMenuItems` stay the defaults. Hold Select still assigns `customAppId` for that row, and Clear still drops the override. That native map stays `stream_custom_apps`.

- **Add app** is always the last Stream row. Select opens the installed-app list. Choosing an app appends a row named with that app's label. Select on the new row launches that package. The same package is not added twice. Hold Select on an added row can change the package or remove the row.
- **Hide** is on the hold-Select dialog for a default row. A hidden default leaves the list. Its saved `customAppId` stays, so restoring the row brings the override back.
- **Hidden apps** is a row above Add app, and only while at least one default is hidden. Select lists those defaults by their built-in titles. Select on one puts that row back. The others stay hidden. When none are hidden, the row goes away.

Order: visible defaults, then added apps, then Hidden apps, then Add app. The Stream list scrolls when it is taller than the nav column. The guest's added rows and hidden defaults are stored in AsyncStorage under `stream_layout`, separate from `stream_custom_apps`, so a new key is not read as a package override.

Stopped 2026-10-14. This is implemented in `src/screens/Stream.tsx`, `src/services/streamLayout.ts`, `src/services/streamLaunch.ts` (`buildStreamMenu`), `src/components/CustomAppDialog.tsx` (Hide on a default, Remove on an added row), `src/components/HiddenAppsDialog.tsx`, and `Navigation` `scrollable` for Stream only. Jest covered add, hide, restore one default while leaving another hidden, remove, and a failed save (`__tests__/streamScreen.test.tsx`, `streamLaunch.test.ts`, `streamLayout.test.ts`). Eslint passed on those files. `npx tsc --noEmit` still fails on the older `ScreenBackground` overlay nullability, not on these files.

Still open: on the A90K remote, hold Select, choose Hide, then open Hidden apps and restore one default at a time. Also confirm Add app, Remove, and that the scrolled list keeps D-pad focus. Do not check this item off until that remote pass.

Main stage streams recent uploads from a YouTube channel. Copy `src/config/mainStage.example.json` to `src/config/mainStage.local.json` (gitignored) and set:

- `channel`: channel URL, `@handle`, or channel id. For example `http://youtube.com/@hotelchannel`.
- `exclude`: video ids to skip. `https://www.youtube.com/watch?v=ADdXw-HMnwc` is entered as `ADdXw-HMnwc`.

Playback streams one video at a time in a WebView, then advances. It does not download the catalog. Settings → Discover Channel starts as this file's `channel` and then drives playback. Exclusions still come from the file. Do not edit `mainStage.local.json` to change the channel.

### Phase 4 — Sony

Tuner, HDMI input, volume, power, boot, real Home replacement. Only if the A90K allows it. Do not block Phase 1 on these.

- [ ] Watch TV lists channels TVirl published into Android TV live channels, and Select opens the system TV app on that channel. See Watch TV — TVirl live channels.

#### Watch TV — TVirl live channels

`src/screens/WatchTV.tsx` currently shows a dummy guide and a fullscreen guide so the screen can be walked with the remote before a tuner is connected. With Watch TV selected and focus still on that sidebar row, the main column shows the same guide grid as the fullscreen guide. Right from that row slides the whole launcher, including the header and navigation, off to the left while the fullscreen guide comes in from the right. Left or Back closes the guide and returns focus to the Watch TV row. Sample rows live in `src/screens/guideData.ts`. That list is not the TVirl query below.

`src/screens/WatchTV.tsx` should list channels the guest already added with **TVirl** and play the chosen one through Android TV's live-channel stack. Do not assume the Sony tuner or an HDMI input. TVirl does not ship streams. It is a TV input service that publishes the user's M3U playlist into the system TV provider. Package `by.stari4ek.tvirl`. It is closed source and not a player.

Playback belongs to the system TV app. That app creates a `TvInputManager` session and asks TVirl to tune. On Shield and Chromecast the app is Live Channels (`com.google.android.tv`). Sony ships its own TV app, and TVirl's guide UI on Sony is that app, not Live Channels. A BRAVIA Programme Guide activity observed in the field is `com.sony.dtv.tvx` / `com.sony.dtv.tvx.MainActivity`. Confirm the package on this A90K before hard-coding it. The system TV app is often hidden until a TV input such as TVirl is installed. TVirl's own setup expects that app to have been opened once.

Planned behavior, after the on-device check below:

1. Detect TVirl with `TvInputManager.getTvInputList()`. A normal app can see input id, label, and whether the input is passthrough. Match package `by.stari4ek.tvirl`. This call does not return channels.
2. Read that input's rows from `content://android.media.tv/channel` (`TvContract.Channels`, authority `android.media.tv`), filtered by `input_id`. Columns: `_id`, `display_name`, `display_number`, `browsable`. Show browsable channels on Watch TV, ordered by display number.
3. Select starts `ACTION_VIEW` on `TvContract.buildChannelUri(channelId)` with `FLAG_ACTIVITY_NEW_TASK`. The system TV app tunes that channel. HotelLauncher does not decode the stream.
4. If TVirl is not installed, say so and offer the Play Store page for `by.stari4ek.tvirl`. If the input exists and the channel query is empty or denied, say the channels cannot be listed here and offer to open the system TV app with no channel id.

On-device check before any bridge. The shell is privileged and the app is not, so these commands can succeed when the app cannot:

- `adb shell dumpsys tv_input` and look for an input id that starts with `by.stari4ek.tvirl/`.
- `adb shell content query --uri content://android.media.tv/channel --projection _id:display_name:display_number:input_id:package_name:browsable`
- `adb shell cmd package query-activities -a android.intent.action.VIEW -d content://android.media.tv/channel/1` to see which activity handles a channel URI.

A shell query is not proof that `com.hotellauncher` can list channels. Repeat the query from the app and record the result.

##### Quirks

- **Package lock.** Each TV-provider row is owned by the package that wrote it. A third-party app can read and write only its own rows. Reading every channel needs `ACCESS_ALL_EPG_DATA` or `READ_TV_LISTINGS`. Both are signature-or-privileged. A sideloaded HotelLauncher should expect an empty cursor or a security error. `COLUMN_SEARCHABLE` says other apps may read searchable rows only when they hold that permission. It is not a public grant.
- **Do not embed `TvView` first.** `TvInputManager.createSession` is not limited to the input's own package. The system binds the input. The database permission is the blocker, not session creation. Embedding `android.media.tv.TvView` in React Native is still the wrong first step: it needs a native view, a channel URI the app may not be allowed to read, and a check that TVirl accepts a tune from this app while Sony's TV app is installed. AOSP also says a third-party TV input may show its own channels or a manufacturer passthrough input such as HDMI, and may not show another app's IPTV input. That rule is about one input relaying another. It is a reason not to add HotelLauncher's own `TvInputService` to rebroadcast TVirl.
- **Stream URLs are private.** The playable URL, headers, and DRM fields sit in `COLUMN_INTERNAL_PROVIDER_DATA`, an opaque blob TVirl owns. Do not parse it.
- **New channels stay hidden.** Android TV leaves channels added after the first playlist install non-browsable. On Sony the guest enables them in system channel settings. `COLUMN_BROWSABLE` is read-only for a normal app. Watch TV should list browsable rows only, and say when TVirl is installed but nothing is browsable.
- **No M3U groups on Sony.** Grouping is per program, and only via the canonical uppercase genre list. It requires EPG programs. Live Channels can show genres. Sony's TV app does not. Watch TV lists channels, not playlist categories.
- **Playback features stay inside TVirl's session.** Custom `User-Agent` and per-channel HTTP headers, Widevine, PlayReady, ClearKey, UDP multicast, RTMP, HLS, DASH, and catch-up (time-shift and a remote archive TVirl exposes as DVR) are implemented by TVirl. An in-app player drops them. Tunneled playback is a TVirl setting and matters on Sony. Handoff keeps it.
- **The list can be stale.** Playlist and EPG refresh is a TVirl Plus feature. Titles are whatever encoding TVirl stored. A bad encoding shows garbage names. That is fixed in TVirl's playlist settings, not in this app.
- **TIF is an OEM-shaped API.** Google's guide says the TV Input Framework is for OEMs and documents it for API 21 through 25. The provider is still on current Android TV, which is why TVirl works on Sony. Do not add a HotelLauncher `TvInputService` unless the channel query is denied and handoff is not enough.
- **Logos use the same wall.** `TvContract.buildChannelLogoUri` points at the TV provider. Treat a failed logo load as normal.
- **Opening TVirl opens setup.** Its launcher activity is not a channel player.

##### Alternatives when the A90K denies the channel query

1. **Handoff only.** Watch TV detects the TVirl input and opens Sony's TV app, or Live Channels if that is the handler, with no channel id. The guest uses that app's guide. Smallest change. No channel list inside HotelLauncher.
2. **The same M3U in launcher config, played here later.** This ignores the channels TVirl already added. It also misses DRM, multicast, custom headers, and catch-up. This plan already blocks `react-native-video` until a `react-native-tvos`-compatible ExoPlayer package is verified.
3. **HotelLauncher as its own TV input** that imports the same M3U, then reads its own rows. That duplicates TVirl. Skip it unless handoff fails.
4. **Platform signature or install on the system partition** so the app can hold `ACCESS_ALL_EPG_DATA`. Out of scope for a sideload.

This item is done when TVirl is installed and at least one channel is browsable, and either Watch TV lists those channels and Select opens the system TV app on the chosen channel, or the A90K denies the query and Watch TV uses the handoff-only fallback. The Sony tuner and HDMI stay separate.

### Phase 5 — Hotel mode

Locked admin config (branding, video, promos, hotel info, menu) without source edits.

## Later — tvOS alongside Android TV

Phone, tablet, and web stay out. The tvOS app is not required to finish Phases 2–5.

The Xcode project is under `ios/`, from `@react-native-tvos/template-tv@0.83.0-0`, renamed to HotelLauncher. `SDKROOT` is `appletvos`. `TVOS_DEPLOYMENT_TARGET` is 15.1. The Podfile uses `platform :tvos`. The bundle id is `com.hotellauncher`. `npm run tvos` runs `react-native run-ios --simulator "Apple TV 4K (3rd generation) (18.0)"`.

tvOS has no WebKit. `youtube-ios-player-helper` is an iOS WebView wrapper (`s.platform = :ios`) and its latest release is 1.0.4, so it is not a tvOS player. Android TV keeps the Discover WebView. Apple TV mounts `NativeYouTubePlayer`: an `AVPlayer` view. It posts to YouTube's player endpoint with the Android client first and the iOS client second, ignores the URL cache because the video id is in the body, and plays an HLS manifest or a muxed MP4. Focus still unmutes and blur mutes. The deck shuffle matches the WebView page.

`react-native.config.js` turns off iOS autolinking for pods that declare iOS only and need WebKit or Photos: `react-native-webview`, `@react-native-async-storage/async-storage`, `react-native-blob-util`, and `react-native-image-picker`. Android autolinking is unchanged. `react-native-safe-area-context` already declares tvOS. Settings and the stream layout persist on Apple TV through `TvAsyncStorage`, registered as `RNAsyncStorage` and backed by `UserDefaults`. The hotel-logo gallery and installed-app launch stay Android-only. A missing `InstalledApps` module leaves custom app overrides empty instead of raising a Stream load error.

`scripts/patch-fmt-version.js` bumps fmt to 11.1.4 so Xcode 27 can compile it. `scripts/patch-cli-simulator.js` looks for `DeviceHub.app`, which replaced `Simulator.app` in Xcode 27. `scripts/patch-rn-cocoapods-utils.js` is not part of postinstall. The published `utils.rb` in `react-native-tvos@0.83.0-0` parses on its own.

Do not add the Android YouTube player library. The A90K sideload stays on the WebView.

- [ ] Apple TV Menu (the remote Back button) dismisses a dialog, leaves Discover fullscreen, and leaves a nested menu before it can exit the app. See Apple TV Menu button.

#### Apple TV Menu button

The Siri Remote Menu button exits HotelLauncher. It does not dismiss a dialog, leave Discover fullscreen, or leave a nested menu.

Those paths listen only to `BackHandler` `hardwareBackPress`, which this button does not send. `TVApp` uses that listener to leave fullscreen, then to return to Discover, then to allow exit. `CustomAppDialog` and `HiddenAppsDialog` `BackClose` use it to close without saving. tvOS gives Menu to the system unless the app is listening. `RCTTVRemoteHandler` starts with `__useMenuKey` off, so `TVEventControl.enableTVMenuKey()` has never run, the Menu recognizer is not attached, and tvOS exits the app. A long Menu press stays with the system and opens the Apple TV home screen. Do not intercept that.

Once the app is listening, one Menu press handles the first match and stops:

1. An open dialog closes. Nothing is saved.
2. Discover fullscreen ends and focus returns to the stage.
3. Focus inside a Stream, My Media, or Hotel Info submenu returns to the main-menu row that opened that screen. That is the same row Left already targets through `NavReturn`. It does not jump to Discover.
4. A main-menu row on any screen other than Discover returns to Discover.
5. On Discover, with no dialog and no fullscreen, Menu exits the app.

Android Back keeps its current `BackHandler` behavior. This item does not change the A90K.

This item is done when the Apple TV simulator Menu button follows that order.

- [ ] Apple TV layout is about half the size of the Android TV layout on the same screen. Scale tvOS to the Android dp canvas. See Apple TV scale.

#### Apple TV scale

On the Apple TV simulator, type, nav, padding, and chrome are tiny next to the A90K. Android is the reference and stays as it is.

This is a known platform difference, not a HotelLauncher regression. [react-native-tvos#57](https://github.com/react-native-tvos/react-native-tvos/issues/57) and [discussion #604](https://github.com/react-native-tvos/react-native-tvos/discussions/604) record it: `Dimensions` on Apple TV is 1920×1080 points, including Apple TV 4K. Android TV, Fire TV, and a Sony BRAVIA report about 960×540 at scale 2. The same style numbers are about half as large, relative to the screen, on Apple TV. The maintainer treats it as pixel density. React Native TV will not make the two windows match.

The A90K check uses a `wm` override of 1920×1080 at density 320, which is that 960×540 dp window. Nav width, `src/theme/typography.ts`, and the other raw `StyleSheet` numbers were written for it. There is no shared scale helper. Apple TV 4K reports `PixelRatio` 2, and so does the A90K, so scaling by pixel ratio would double Android as well.

When this is implemented, one tvOS scale of about `1920 / 960` applies to layout sizes and font sizes. Android scale stays 1. Do not change `wm` density or `PixelRatio` on the A90K. Do not add a scaling dependency.

This item is done when the Apple TV simulator shows the same relative sizes as the Android TV layout, and the A90K layout is unchanged.

This is done when the Apple TV simulator launches HotelLauncher and the A90K app still launches.

## Run

```bash
npm install
npm start
npm run android
```

Release APK (after the Android SDK is installed):

```bash
cd android && ./gradlew assembleRelease
```

## Recovery

If the TV offers this app as Home and navigation breaks, hold the remote Home button (or use Settings → Apps) and choose the stock Google TV / Android TV launcher. Uninstall from Settings → Apps → Hotel Launcher.

## User Notes

Apply this to Bonkflix background

linear-gradient(7deg, rgba(0, 0, 0, 0.8500) 10.00%, rgba(0, 0, 0, 0.8465) 17.25%, rgba(0, 0, 0, 0.8361) 24.50%, rgba(0, 0, 0, 0.8187) 31.75%, rgba(0, 0, 0, 0.7944) 39.00%, rgba(0, 0, 0, 0.7632) 46.25%, rgba(0, 0, 0, 0.7250) 53.50%, rgba(0, 0, 0, 0.6868) 60.75%, rgba(0, 0, 0, 0.6556) 68.00%, rgba(0, 0, 0, 0.6312) 75.25%, rgba(0, 0, 0, 0.6139) 82.50%, rgba(0, 0, 0, 0.6035) 89.75%, rgba(0, 0, 0, 0.6000) 97.00%)

## User Tech Debt

Figure out if I can make the types tighter. I losened them to avoid Typescript errors.
