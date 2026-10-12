import { MenuItem } from '../types';

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
