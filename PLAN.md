# HotelLauncher — Sony BRAVIA A90K

Configurable hotel-TV home screen for **Android TV**, targeted at a **Sony BRAVIA A90K**.
Built with **React Native TV** (`react-native-tvos`). Branding is data-driven so it is not locked to one hotel.

## Scope

Android TV only for Phases 2–5, on the Sony BRAVIA A90K. Do not add phone, tablet, or web targets. tvOS is a later goal; do not restore that target during Phases 2–5. See Later — tvOS alongside Android TV.
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

Main stage streams recent uploads from a YouTube channel. Copy `src/config/mainStage.example.json` to `src/config/mainStage.local.json` (gitignored) and set:

- `channel`: channel URL, `@handle`, or channel id. For example `http://youtube.com/@hotelchannel`.
- `exclude`: video ids to skip. `https://www.youtube.com/watch?v=ADdXw-HMnwc` is entered as `ADdXw-HMnwc`.

Playback streams one video at a time in a WebView, then advances. It does not download the catalog. The config object is the seam for a later settings screen, which should pass the same channel and exclude list instead of a source edit.

### Phase 4 — Sony

Tuner, HDMI input, volume, power, boot, real Home replacement. Only if the A90K allows it. Do not block Phase 1 on these.

### Phase 5 — Hotel mode

Locked admin config (branding, video, promos, hotel info, menu) without source edits.

## Later — tvOS alongside Android TV

Phone, tablet, and web stay out. This is not part of Phases 2–5.

Goal: bring the tvOS target back so one launcher runs on Android TV and tvOS. Start only after the Android TV app on the A90K is stable.

The open risk is one codebase serving both platforms. Shared UI, D-pad focus, and the Discover YouTube WebView must keep working on Android TV when the tvOS project returns. Platform-specific native code and builds must not break the A90K sideload.

This is done when both targets are proven and the A90K app is still launchable.

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
