import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CustomAppDialog } from '../components/CustomAppDialog';
import { Navigation } from '../components/Navigation';
import { Panel } from '../components/Panel';
import { streamMenuItems } from '../config/launcherConfig';
import { useLaunchNotice } from '../context/LaunchNoticeContext';
import {
  InstalledApp,
  clearCustomAppId,
  getCustomAppIds,
  launchApp,
  listInstalledApps,
  setCustomAppId,
} from '../services/installedApps';
import { applyCustomAppIds, resolveLaunchAppId } from '../services/streamLaunch';
import { MenuItem, ScreenId } from '../types';

export function Stream({ screen }: { screen: ScreenId }) {
  const [customAppIds, setCustomAppIds] = useState<Record<string, string>>({});
  const [pickerId, setPickerId] = useState<string | null>(null);
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [appsStatus, setAppsStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const { setNotice } = useLaunchNotice();
  const pickerIdRef = useRef<string | null>(null);
  const [dialogArmed, setDialogArmed] = useState(false);
  const [preferredFocusId, setPreferredFocusId] = useState<string | null>(null);
  const [preferredFocusNonce, setPreferredFocusNonce] = useState(0);
  const listRequest = useRef(0);

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
    return () => {
      active = false;
    };
  }, [setNotice]);

  const items = useMemo(
    () => applyCustomAppIds(streamMenuItems, customAppIds),
    [customAppIds],
  );
  const pickerItem = items.find(item => item.id === pickerId) ?? null;

  const closePicker = useCallback(() => {
    setPreferredFocusId(pickerIdRef.current);
    setPreferredFocusNonce(nonce => nonce + 1);
    pickerIdRef.current = null;
    setPickerId(null);
    setDialogArmed(false);
  }, []);

  const openPicker = useCallback((menuItemId: string) => {
    const request = listRequest.current + 1;
    listRequest.current = request;
    pickerIdRef.current = menuItemId;
    setDialogArmed(false);
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
    [setNotice],
  );

  const onChoose = useCallback(
    (appId: string) => {
      if (pickerIdRef.current == null) {
        return;
      }
      const menuItemId = pickerIdRef.current;
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
    },
    [setNotice],
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

  return (
    <Panel>
      <Navigation
        active={screen}
        menuItems={items}
        enabled={pickerItem == null || !dialogArmed}
        preferredFocusId={preferredFocusId}
        preferredFocusNonce={preferredFocusNonce}
        onSelect={() => {}}
        onItemPress={onItemPress}
        onItemPressOut={onPickerPressOut}
        onItemLongPress={item => openPicker(item.id)}
      />
      {pickerItem ? (
        <CustomAppDialog
          item={pickerItem}
          apps={apps}
          status={appsStatus}
          armed={dialogArmed}
          onChoose={onChoose}
          onClear={onClear}
          onClose={closePicker}
        />
      ) : null}
    </Panel>
  );
}
