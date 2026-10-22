import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CustomAppDialog } from '../components/CustomAppDialog';
import { HiddenAppsDialog } from '../components/HiddenAppsDialog';
import { Navigation } from '../components/Navigation';
import { Panel } from '../components/Panel';
import { StreamPoster } from '../components/StreamPoster';
import { streamMenuItems } from '../config/launcherConfig';
import { useBackground } from '../context/BackgroundContext';
import { useLaunchNotice } from '../context/LaunchNoticeContext';
import {
  InstalledApp,
  clearCustomAppId,
  getCustomAppIds,
  launchApp,
  listInstalledApps,
  setCustomAppId,
} from '../services/installedApps';
import {
  buildStreamMenu,
  focusNeighbor,
  hiddenDefaultRows,
  resolveLaunchAppId,
  streamRowKind,
} from '../services/streamLaunch';
import {
  StreamLayout,
  addedStreamAppId,
  emptyStreamLayout,
  loadStreamLayout,
  saveStreamLayout,
} from '../services/streamLayout';
import { MenuItem, ScreenId } from '../types';

const defaultIds = streamMenuItems.map(item => item.id);

export function Stream({ screen }: { screen: ScreenId }) {
  const [customAppIds, setCustomAppIds] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<StreamLayout>(emptyStreamLayout());
  const [pickerId, setPickerId] = useState<string | null>(null);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [appsStatus, setAppsStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const { setNotice } = useLaunchNotice();
  const { hoveredMenuItemId } = useBackground();
  const pickerIdRef = useRef<string | null>(null);
  const [dialogArmed, setDialogArmed] = useState(false);
  const [preferredFocusId, setPreferredFocusId] = useState<string | null>(null);
  const [preferredFocusNonce, setPreferredFocusNonce] = useState(0);
  const listRequest = useRef(0);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const appsRef = useRef(apps);
  appsRef.current = apps;

  useEffect(() => {
    return () => {
      listRequest.current += 1;
      setNotice(null);
    };
  }, [setNotice]);

  useEffect(() => {
    let active = true;
    getCustomAppIds()
      .then(stored => {
        if (active) {
          setCustomAppIds(stored);
        }
      })
      .catch(() => {
        if (active) {
          setNotice('Saved custom apps could not be loaded.');
        }
      });
    loadStreamLayout(defaultIds)
      .then(stored => {
        if (active) {
          setLayout(stored);
        }
      })
      .catch(() => {
        if (active) {
          setNotice('Saved stream apps could not be loaded.');
        }
      });
    return () => {
      active = false;
    };
  }, [setNotice]);

  const items = useMemo(
    () =>
      buildStreamMenu(
        streamMenuItems,
        customAppIds,
        layout.hiddenDefaultIds,
        layout.addedApps,
      ),
    [customAppIds, layout],
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const addedIds = useMemo(
    () => new Set(layout.addedApps.map(app => app.id)),
    [layout.addedApps],
  );
  const pickerKind =
    pickerId == null ? null : streamRowKind(pickerId, addedIds);
  const pickerItem = items.find(item => item.id === pickerId) ?? null;
  const hiddenRows = useMemo(
    () => hiddenDefaultRows(streamMenuItems, layout.hiddenDefaultIds),
    [layout.hiddenDefaultIds],
  );

  const closePicker = useCallback(() => {
    setPreferredFocusId(pickerIdRef.current);
    setPreferredFocusNonce(nonce => nonce + 1);
    pickerIdRef.current = null;
    setPickerId(null);
    setDialogArmed(false);
  }, []);

  const finishLayout = useCallback(
    (next: StreamLayout, focusId: string | null, close: boolean) => {
      saveStreamLayout(next)
        .then(() => {
          setLayout(next);
          setNotice(null);
          if (!close) {
            return;
          }
          if (focusId != null) {
            setPreferredFocusId(focusId);
            setPreferredFocusNonce(nonce => nonce + 1);
          }
          pickerIdRef.current = null;
          setPickerId(null);
          setDialogArmed(false);
        })
        .catch(() => {
          setNotice('The stream list could not be saved.');
        });
    },
    [setNotice],
  );

  const loadApps = useCallback((menuItemId: string, armed: boolean) => {
    const request = listRequest.current + 1;
    listRequest.current = request;
    pickerIdRef.current = menuItemId;
    setDialogArmed(armed);
    setPickerId(menuItemId);
    setAppsStatus('loading');
    setApps([]);
    listInstalledApps()
      .then(installed => {
        if (listRequest.current !== request) {
          return;
        }
        setApps(installed);
        setAppsStatus('ready');
      })
      .catch(() => {
        if (listRequest.current !== request) {
          return;
        }
        setApps([]);
        setAppsStatus('error');
      });
  }, []);

  const openPicker = useCallback(
    (menuItemId: string) => {
      const kind = streamRowKind(menuItemId, addedIds);
      if (kind === 'add' || kind === 'hidden') {
        return;
      }
      loadApps(menuItemId, false);
    },
    [addedIds, loadApps],
  );

  const onPickerPressOut = useCallback(() => {
    if (pickerIdRef.current == null) {
      return;
    }
    setDialogArmed(true);
  }, []);

  const onItemPress = useCallback(
    (item: MenuItem) => {
      if (pickerIdRef.current != null) {
        return;
      }
      const kind = streamRowKind(item.id, addedIds);
      if (kind === 'add') {
        loadApps(item.id, true);
        return;
      }
      if (kind === 'hidden') {
        pickerIdRef.current = item.id;
        setDialogArmed(true);
        setPickerId(item.id);
        return;
      }
      const appId = resolveLaunchAppId(item);
      if (appId == null) {
        setNotice(`Hold Select to choose an app for ${item.title}.`);
        return;
      }
      launchApp(appId)
        .then(() => {
          setNotice(null);
        })
        .catch(() => {
          setNotice(
            `${item.title} could not open ${appId}. Hold Select to pick an installed app.`,
          );
        });
    },
    [addedIds, loadApps, setNotice],
  );

  const onChoose = useCallback(
    (appId: string) => {
      const menuItemId = pickerIdRef.current;
      if (menuItemId == null) {
        return;
      }
      const kind = streamRowKind(
        menuItemId,
        new Set(layoutRef.current.addedApps.map(app => app.id)),
      );
      if (kind === 'default') {
        setCustomAppId(menuItemId, appId)
          .then(() => {
            setCustomAppIds(current => ({ ...current, [menuItemId]: appId }));
            setNotice(null);
            setPreferredFocusId(menuItemId);
            setPreferredFocusNonce(nonce => nonce + 1);
            pickerIdRef.current = null;
            setPickerId(null);
            setDialogArmed(false);
          })
          .catch(() => {
            setNotice('The custom app could not be saved.');
          });
        return;
      }
      const label =
        appsRef.current.find(app => app.appId === appId)?.label ?? appId;
      const current = layoutRef.current;
      if (kind === 'add') {
        const existing = current.addedApps.find(app => app.appId === appId);
        if (existing) {
          setPreferredFocusId(existing.id);
          setPreferredFocusNonce(nonce => nonce + 1);
          pickerIdRef.current = null;
          setPickerId(null);
          setDialogArmed(false);
          return;
        }
        const entry = {
          id: addedStreamAppId(appId),
          title: label,
          appId,
        };
        finishLayout(
          { ...current, addedApps: [...current.addedApps, entry] },
          entry.id,
          true,
        );
        return;
      }
      const editing = current.addedApps.find(app => app.id === menuItemId);
      if (editing == null) {
        return;
      }
      const duplicate = current.addedApps.find(
        app => app.appId === appId && app.id !== editing.id,
      );
      if (duplicate) {
        finishLayout(
          {
            ...current,
            addedApps: current.addedApps.filter(app => app.id !== editing.id),
          },
          duplicate.id,
          true,
        );
        return;
      }
      const nextId = addedStreamAppId(appId);
      finishLayout(
        {
          ...current,
          addedApps: current.addedApps.map(app =>
            app.id === editing.id ? { id: nextId, title: label, appId } : app,
          ),
        },
        nextId,
        true,
      );
    },
    [finishLayout, setNotice],
  );

  const onClear = useCallback(() => {
    if (pickerIdRef.current == null) {
      return;
    }
    const menuItemId = pickerIdRef.current;
    clearCustomAppId(menuItemId)
      .then(() => {
        setCustomAppIds(current => {
          const next = { ...current };
          delete next[menuItemId];
          return next;
        });
        setNotice(null);
      })
      .catch(() => {
        setNotice('The custom app could not be cleared.');
      });
  }, [setNotice]);

  const onHide = useCallback(() => {
    const menuItemId = pickerIdRef.current;
    if (menuItemId == null) {
      return;
    }
    const current = layoutRef.current;
    if (current.hiddenDefaultIds.includes(menuItemId)) {
      return;
    }
    const focusId = focusNeighbor(itemsRef.current, menuItemId);
    finishLayout(
      {
        ...current,
        hiddenDefaultIds: [...current.hiddenDefaultIds, menuItemId],
      },
      focusId,
      true,
    );
  }, [finishLayout]);

  const onRemove = useCallback(() => {
    const menuItemId = pickerIdRef.current;
    if (menuItemId == null) {
      return;
    }
    const focusId = focusNeighbor(itemsRef.current, menuItemId);
    finishLayout(
      {
        ...layoutRef.current,
        addedApps: layoutRef.current.addedApps.filter(
          app => app.id !== menuItemId,
        ),
      },
      focusId,
      true,
    );
  }, [finishLayout]);

  const onRestore = useCallback(
    (menuItemId: string) => {
      const current = layoutRef.current;
      const hiddenDefaultIds = current.hiddenDefaultIds.filter(
        id => id !== menuItemId,
      );
      finishLayout(
        { ...current, hiddenDefaultIds },
        hiddenDefaultIds.length === 0 ? menuItemId : null,
        hiddenDefaultIds.length === 0,
      );
    },
    [finishLayout],
  );

  const dialogMode =
    pickerKind === 'add' ? 'add' : pickerKind === 'added' ? 'added' : 'override';

  const dialog =
    pickerKind === 'hidden' ? (
      <HiddenAppsDialog
        items={hiddenRows}
        armed={dialogArmed}
        onRestore={onRestore}
        onClose={closePicker}
      />
    ) : pickerItem ? (
      <CustomAppDialog
        item={pickerItem}
        apps={apps}
        status={appsStatus}
        armed={dialogArmed}
        mode={dialogMode}
        onChoose={onChoose}
        onClear={pickerKind === 'default' ? onClear : undefined}
        onHide={pickerKind === 'default' ? onHide : undefined}
        onRemove={pickerKind === 'added' ? onRemove : undefined}
        onClose={closePicker}
      />
    ) : null;

  return (
    <Panel overlay={dialog}>
      <View style={styles.row}>
        <Navigation
          active={screen}
          menuItems={items}
          scrollable
          enabled={pickerItem == null || !dialogArmed}
          preferredFocusId={preferredFocusId}
          preferredFocusNonce={preferredFocusNonce}
          onSelect={() => {}}
          onItemPress={onItemPress}
          onItemPressOut={onPickerPressOut}
          onItemLongPress={item => openPicker(item.id)}
        />
        <StreamPoster menuItemId={hoveredMenuItemId} />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
});
