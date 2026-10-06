# HotelLauncher — Sony BRAVIA A90K

Configurable hotel-TV home screen for **Android TV**, targeted at a **Sony BRAVIA A90K**.
Built with **React Native TV** (`react-native-tvos`). Branding is data-driven so it is not locked to one hotel.

## Scope

Android TV only. Do not add iOS, tvOS, phone, tablet, or web targets.
The A90K may refuse a third-party app as the permanent system Home. The app must stay launchable from the TV apps row and recoverable if Home replacement is declined.

## Stack

- `react-native-tvos@0.83.0-0` via `react-native: npm:react-native-tvos@0.83.0-0`
- TypeScript, React 19
- Android package `com.hotellauncher`
- Design canvas 3840×2160, laid out in density-independent units so 1080p TVs scale

Video uses a styled stage (not a native player) until a `react-native-tvos`-compatible ExoPlayer package is verified. Do not add `react-native-video` until that check passes.

## Layout

```text
Header          logo | welcome | weather + clock
Body            side nav | main stage | now playing
Footer          promotional banner
```

Menu: Discover, Watch TV, Stream, My Media, Hotel Info, Settings, Privacy Center.

D-pad only: Up, Down, Left, Right, Select, Back. Focus must be obvious. Back returns to Discover.

## Phases

### Phase 1 — MVP (this execution)

- [x] TV project scaffold (Community CLI + `@react-native-tvos/template-tv@0.83.0-0`)
- [x] iOS target removed
- [x] Dark hotel theme, header, nav, focus, stage, now playing, banner, clock
- [x] Placeholder screens driven by `src/config/launcherConfig.ts`
- [x] `LEANBACK_LAUNCHER` plus optional `HOME` / `DEFAULT` (user can decline)
- [x] `npm install` and TypeScript check
- [x] Sideload debug APK onto the A90K (needs Android SDK + device)

### Phase 2 — Functional TV

Installed-app discovery (PackageManager bridge), launch external apps, persistent settings, network/HLS video, promo rotation, QR, weather, screensaver.

### Phase 3 — Sony

Tuner, HDMI input, volume, power, boot, real Home replacement. Only if the A90K allows it. Do not block Phase 1 on these.

### Phase 4 — Hotel mode

Locked admin config (branding, video, promos, hotel info, menu) without source edits.

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
