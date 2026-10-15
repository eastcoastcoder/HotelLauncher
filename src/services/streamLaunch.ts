import { MenuItem, StreamMenuItem } from '../types';
import { AddedStreamApp } from './streamLayout';

export const STREAM_ADD_APP_ID = 'stream-add-app';
export const STREAM_HIDDEN_APPS_ID = 'stream-hidden-apps';

export type StreamRowKind = 'default' | 'added' | 'add' | 'hidden';

export function resolveLaunchAppId(
  item: Pick<MenuItem, 'appId' | 'customAppId'>,
): string | null {
  const custom = item.customAppId?.trim() ?? '';
  if (custom !== '') {
    return custom;
  }
  const appId = item.appId?.trim() ?? '';
  return appId === '' ? null : appId;
}

export function streamRowKind(
  id: string,
  addedIds: ReadonlySet<string>,
): StreamRowKind {
  if (id === STREAM_ADD_APP_ID) {
    return 'add';
  }
  if (id === STREAM_HIDDEN_APPS_ID) {
    return 'hidden';
  }
  if (addedIds.has(id)) {
    return 'added';
  }
  return 'default';
}

export function hiddenDefaultRows(
  defaults: readonly StreamMenuItem[],
  hiddenIds: readonly string[],
): { id: string; title: string }[] {
  const hidden = new Set(hiddenIds);
  return defaults
    .filter(item => hidden.has(item.id))
    .map(item => ({ id: item.id, title: item.title }));
}

export function buildStreamMenu(
  defaults: readonly StreamMenuItem[],
  customAppIds: Readonly<Record<string, string>>,
  hiddenDefaultIds: readonly string[],
  addedApps: readonly AddedStreamApp[],
): MenuItem[] {
  const hidden = new Set(hiddenDefaultIds);
  const visible = applyCustomAppIds(
    defaults.filter(item => !hidden.has(item.id)),
    customAppIds,
  );
  const added: MenuItem[] = addedApps.map(app => ({
    id: app.id,
    title: app.title,
    screen: null,
    icon: null,
    appId: app.appId,
    customAppId: null,
  }));
  const utility: MenuItem[] = [];
  if (hiddenDefaultIds.length > 0) {
    utility.push({
      id: STREAM_HIDDEN_APPS_ID,
      title: 'Hidden apps',
      screen: null,
      icon: null,
      appId: null,
      customAppId: null,
    });
  }
  utility.push({
    id: STREAM_ADD_APP_ID,
    title: 'Add app',
    screen: null,
    icon: null,
    appId: null,
    customAppId: null,
  });
  return [...visible, ...added, ...utility];
}

export function focusNeighbor(
  items: readonly { id: string }[],
  removedId: string,
): string {
  const index = items.findIndex(item => item.id === removedId);
  return items[index + 1]?.id ?? items[index - 1]?.id ?? STREAM_ADD_APP_ID;
}

export function applyCustomAppIds<T extends MenuItem>(
  items: readonly T[],
  customAppIds: Readonly<Record<string, string>>,
): T[] {
  return items.map(item => {
    const stored = customAppIds[item.id]?.trim() ?? '';
    return {
      ...item,
      customAppId: stored === '' ? null : stored,
    };
  });
}
