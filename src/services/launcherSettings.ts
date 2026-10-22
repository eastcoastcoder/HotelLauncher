import AsyncStorage from '@react-native-async-storage/async-storage';
import { launcherConfig } from '../config/launcherConfig';
import { loadMainStageMediaConfig } from '../config/mainStageMedia';
import { SettingId } from '../types';

const STORAGE_KEY = 'launcher_settings';

/** Former Discover Channel default. A saved copy is unset, not a channel. */
const DISCOVER_CHANNEL_PLACEHOLDER = 'https://www.youtube.com/@username';

function isUnsetDiscoverChannel(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === DISCOVER_CHANNEL_PLACEHOLDER;
}

export type LauncherSettingValues = Record<SettingId, string> & {
  /** Absolute path of a copied gallery logo. Null uses the bundled logo. */
  logoPath: string | null;
  /** Randomize Discover channel videos. Off keeps channel-page order. */
  shuffleVideos: boolean;
};

type EditedSetting = SettingId | 'logoPath' | 'shuffleVideos';

export function defaultLauncherSettings(): LauncherSettingValues {
  const values = {
    logoPath: null,
    shuffleVideos: true,
  } as LauncherSettingValues;
  for (const item of launcherConfig.settings) {
    values[item.id] = item.value;
  }
  // Playback used the local stage file before this field was wired up.
  if (isUnsetDiscoverChannel(values.discoverChannel)) {
    const fromStage = loadMainStageMediaConfig().channel.trim();
    if (fromStage !== '') {
      values.discoverChannel = fromStage;
    }
  }
  return values;
}

export function sameLauncherSettings(
  left: LauncherSettingValues,
  right: LauncherSettingValues,
): boolean {
  return (
    left.logoPath === right.logoPath &&
    left.shuffleVideos === right.shuffleVideos &&
    launcherConfig.settings.every(item => left[item.id] === right[item.id])
  );
}

/**
 * Overlay saved strings on the config defaults. Empty strings stay empty.
 * Keys the guest already edited this session keep the typed value.
 */
export function mergeLauncherSettings(
  stored: unknown,
  current: LauncherSettingValues = defaultLauncherSettings(),
  edited: ReadonlySet<EditedSetting> = new Set(),
): LauncherSettingValues {
  const next = defaultLauncherSettings();
  const record =
    stored != null && typeof stored === 'object'
      ? (stored as Record<string, unknown>)
      : {};
  for (const item of launcherConfig.settings) {
    if (edited.has(item.id)) {
      next[item.id] = current[item.id];
      continue;
    }
    const value = record[item.id];
    if (typeof value === 'string') {
      if (item.id === 'discoverChannel' && value.trim() === DISCOVER_CHANNEL_PLACEHOLDER) {
        continue;
      }
      next[item.id] = value;
    }
  }
  if (edited.has('logoPath')) {
    next.logoPath = current.logoPath;
  } else if (typeof record.logoPath === 'string' && record.logoPath.trim() !== '') {
    next.logoPath = record.logoPath;
  }
  if (edited.has('shuffleVideos')) {
    next.shuffleVideos = current.shuffleVideos;
  } else if (typeof record.shuffleVideos === 'boolean') {
    next.shuffleVideos = record.shuffleVideos;
  }
  return next;
}

export async function loadLauncherSettings(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === '') {
    return {};
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
}

export async function saveLauncherSettings(
  values: LauncherSettingValues,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}
