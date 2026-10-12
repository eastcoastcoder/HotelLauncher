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

Menu: Discover, Watch TV, Stream, My Media, Hotel Info, Settings, Privacy Center.

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
