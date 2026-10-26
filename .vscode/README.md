# Debugging Setup for HotelLauncher

## Using the Debug Dropdown (Ctrl+Shift+D)

The following configurations are available in **Run and Debug** → Select Type:

### Configurations:
- **Launch Android App** - Builds and runs the app on connected Android device/emulator
- **Launch tvOS Simulator** - Builds and runs on Apple TV simulator
- **Debug iOS Simulator App** - Opens the iOS workspace in Xcode
- **Debug Android App** - Builds the Android debug APK

For VS Code editor breakpoints, use the third-party Radon IDE extension
(`swmansion.react-native-ide`) in **Connect Mode**. Connect Mode is intended for
existing Metro servers and out-of-tree platforms such as TV. React Native Tools'
Hermes debugger is experimental in this project and may fail to attach.

## Quick Start

### For Metro Bundler Development:
1. Open the Command Palette and run **Tasks: Run Task**.
2. Select **Start Metro Bundler**. This starts Metro as a task, not as a
   debugger session, so it won't block the editor's attach/debug button.

### For Android JavaScript Breakpoints:
1. Install **Radon IDE** (`swmansion.react-native-ide`) and reload VS Code.
2. Start this project's Metro server and app as usual, or keep the app running
   against this Metro server.
3. Enable **Radon Connect** from the Radon IDE activity-bar view.
4. Set a breakpoint in a TypeScript/JavaScript file's VS Code gutter. Radon
   Connect should attach to the running app and pause when execution reaches it.

Do not connect a second JavaScript debugger at the same time. To use the
standalone React Native DevTools instead, open it from the app's Dev Menu or
press `j` in the Metro terminal, then set breakpoints in its Sources panel.

### For Testing on Device/TV:
1. Connect your device or open simulator
2. Open Debug dropdown (Ctrl+Shift+D)
3. Select **"Launch Android App"** or **"Launch tvOS Simulator"**
4. Wait for build to complete

### For Native iOS Debugging:
1. Select **"Debug iOS Simulator App"** from Debug dropdown
2. In Xcode, press `Cmd+R` to run
3. Use Xcode's debugger for native code.
4. For JavaScript breakpoints, open React Native DevTools from the app's Dev
   Menu or press `j` in the Metro terminal, then use the Sources panel.

## Tasks (Ctrl+Shift+P → Run Task)

Available tasks:
- **Start Metro Bundler** - Runs Metro server with hot reload without occupying a debugger session
- **Clean React Native Cache** - Runs the Android clean task and removes the Metro cache
- **Run All Tests** - Runs the Jest test suite

## React Native Dev Settings

Metro bundler automatically enables:
- Hermes (New Architecture) for better performance
- Hot Reload for instant code updates
- Source Maps for stack traces

## Common Debugging Workflows

### Debug a Screen Change:
1. Modify screen code in `src/screens/*`
2. Save the file - Metro picks up changes automatically
3. Shake your TV device / press Cmd+D on simulator
4. Select "Reload" from dev menu

### Debug with Breakpoints:
1. Enable **Radon Connect** and set a breakpoint in the VS Code editor gutter.
2. For a temporary breakpoint in code, add a `debugger;` statement while Radon
   Connect is active.
3. If Radon IDE is unavailable, use React Native DevTools from the app's Dev
   Menu or press `j` in the Metro terminal, then set the breakpoint in its
   Sources panel.

### Debug Native Code (iOS):
1. Select **"Debug iOS Simulator App"** from the Debug dropdown to open Xcode
2. Run the app on simulator/device
3. Use Xcode's built-in debugger

## Troubleshooting

**Metro won't start:**
```bash
# Clean and restart Metro
npx react-native start --reset-cache
```

**App not reloading after code changes:**
1. Shake device / press Cmd+D on simulator
2. Select "Reload" or "Reload All Modules"

**Native debugging errors:**
- Ensure iOS build supports debug (check `ios/HotelLauncher.xcworkspace` → Project Settings)
- Run `pod install` in iOS folder if dependencies are missing

**Android device not detected:**
```bash
adb devices  # Check connected devices
cd android && ./gradlew --stop  # Stop running gradle instances
```

## Additional Files

- `src/services/parseHttpUrl.ts` - HTTP URL parsing utilities
- Android: `android/app/build.gradle` - Native module configuration
