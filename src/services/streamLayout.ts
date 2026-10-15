import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'stream_layout';

export type AddedStreamApp = {
  id: string;
  title: string;
  appId: string;
};

export type StreamLayout = {
  hiddenDefaultIds: string[];
  addedApps: AddedStreamApp[];
};

export function emptyStreamLayout(): StreamLayout {
  return { hiddenDefaultIds: [], addedApps: [] };
}

export function addedStreamAppId(appId: string): string {
  return `added:${appId}`;
}

export function normalizeStreamLayout(
  value: unknown,
  defaultIds: readonly string[],
): StreamLayout {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return emptyStreamLayout();
  }
  const record = value as {
    hiddenDefaultIds?: unknown;
    addedApps?: unknown;
  };
  const known = new Set(defaultIds);
  const hiddenDefaultIds: string[] = [];
  if (Array.isArray(record.hiddenDefaultIds)) {
    for (const id of record.hiddenDefaultIds) {
      if (typeof id !== 'string' || !known.has(id) || hiddenDefaultIds.includes(id)) {
        continue;
      }
      hiddenDefaultIds.push(id);
    }
  }
  const addedApps: AddedStreamApp[] = [];
  const seenPackages = new Set<string>();
  if (Array.isArray(record.addedApps)) {
    for (const entry of record.addedApps) {
      if (entry == null || typeof entry !== 'object') {
        continue;
      }
      const app = entry as { title?: unknown; appId?: unknown };
      const appId = typeof app.appId === 'string' ? app.appId.trim() : '';
      if (appId === '' || seenPackages.has(appId)) {
        continue;
      }
      seenPackages.add(appId);
      const title = typeof app.title === 'string' ? app.title.trim() : '';
      addedApps.push({
        id: addedStreamAppId(appId),
        title: title === '' ? appId : title,
        appId,
      });
    }
  }
  return { hiddenDefaultIds, addedApps };
}

export async function loadStreamLayout(
  defaultIds: readonly string[],
): Promise<StreamLayout> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw == null || raw === '') {
    return emptyStreamLayout();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('stream layout is not json');
  }
  return normalizeStreamLayout(parsed, defaultIds);
}

export async function saveStreamLayout(layout: StreamLayout): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}
