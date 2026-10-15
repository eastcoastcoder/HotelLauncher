import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  defaultLauncherSettings,
  LauncherSettingValues,
  loadLauncherSettings,
  mergeLauncherSettings,
  sameLauncherSettings,
  saveLauncherSettings,
} from '../services/launcherSettings';
import { SettingId } from '../types';

type EditedSetting = SettingId | 'logoPath';

type LauncherSettingsController = {
  values: LauncherSettingValues;
  setValue: (id: SettingId, value: string) => void;
  setLogoPath: (path: string | null) => void;
};

const LauncherSettingsContext =
  React.createContext<LauncherSettingsController | null>(null);

export function LauncherSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [values, setValues] = useState(defaultLauncherSettings);
  const edited = useRef(new Set<EditedSetting>());

  useEffect(() => {
    let cancelled = false;
    loadLauncherSettings()
      .then(stored => {
        if (cancelled) {
          return;
        }
        setValues(current => {
          const next = mergeLauncherSettings(stored, current, edited.current);
          return sameLauncherSettings(current, next) ? current : next;
        });
      })
      .catch(error => {
        console.warn('Could not load launcher settings', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const write = useCallback((next: LauncherSettingValues) => {
    saveLauncherSettings(next).catch(error => {
      console.warn('Could not save launcher settings', error);
    });
  }, []);

  const setValue = useCallback(
    (id: SettingId, value: string) => {
      edited.current.add(id);
      setValues(current => {
        if (current[id] === value) {
          return current;
        }
        const next = { ...current, [id]: value };
        write(next);
        return next;
      });
    },
    [write],
  );

  const setLogoPath = useCallback(
    (path: string | null) => {
      edited.current.add('logoPath');
      setValues(current => {
        if (current.logoPath === path) {
          return current;
        }
        const next = { ...current, logoPath: path };
        write(next);
        return next;
      });
    },
    [write],
  );

  const api = useMemo(
    () => ({ values, setValue, setLogoPath }),
    [values, setValue, setLogoPath],
  );

  return (
    <LauncherSettingsContext.Provider value={api}>
      {children}
    </LauncherSettingsContext.Provider>
  );
}

export function useLauncherSettings(): LauncherSettingsController {
  const context = useContext(LauncherSettingsContext);
  if (context == null) {
    throw new Error('useLauncherSettings must be used within LauncherSettingsProvider');
  }
  return context;
}
