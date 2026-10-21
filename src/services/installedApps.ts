import { NativeModules } from 'react-native';

export type InstalledApp = {
  appId: string;
  label: string;
};

type InstalledAppsNative = {
  listInstalledApps: () => Promise<unknown>;
  launchApp: (appId: string) => Promise<boolean>;
  getCustomAppIds: () => Promise<unknown>;
  setCustomAppId: (menuItemId: string, appId: string) => Promise<void>;
  clearCustomAppId: (menuItemId: string) => Promise<void>;
};

function nativeModule(): InstalledAppsNative {
  const native = NativeModules.InstalledApps as InstalledAppsNative | undefined;
  if (native == null) {
    throw new Error('InstalledApps native module is unavailable');
  }
  return native;
}

export function normalizeInstalledApps(value: unknown): InstalledApp[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const apps: InstalledApp[] = [];
  for (const entry of value) {
    if (entry == null || typeof entry !== 'object') {
      continue;
    }
    const record = entry as { appId?: unknown; label?: unknown };
    const appId = typeof record.appId === 'string' ? record.appId.trim() : '';
    if (appId === '') {
      continue;
    }
    const label = typeof record.label === 'string' ? record.label.trim() : '';
    apps.push({ appId, label: label === '' ? appId : label });
  }
  return apps;
}

export function normalizeCustomAppIds(value: unknown): Record<string, string> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const customAppIds: Record<string, string> = {};
  for (const [menuItemId, appId] of Object.entries(value)) {
    if (typeof appId === 'string' && appId.trim() !== '') {
      customAppIds[menuItemId] = appId.trim();
    }
  }
  return customAppIds;
}

export async function listInstalledApps(): Promise<InstalledApp[]> {
  return normalizeInstalledApps(await nativeModule().listInstalledApps());
}

export function launchApp(appId: string): Promise<boolean> {
  return nativeModule().launchApp(appId);
}

export async function getCustomAppIds(): Promise<Record<string, string>> {
  // Apple TV has no installed-app store. An empty map keeps Stream from
  // showing a load error on every visit.
  if (NativeModules.InstalledApps == null) {
    return {};
  }
  return normalizeCustomAppIds(await nativeModule().getCustomAppIds());
}

export function setCustomAppId(
  menuItemId: string,
  appId: string,
): Promise<void> {
  return nativeModule().setCustomAppId(menuItemId, appId);
}

export function clearCustomAppId(menuItemId: string): Promise<void> {
  return nativeModule().clearCustomAppId(menuItemId);
}
