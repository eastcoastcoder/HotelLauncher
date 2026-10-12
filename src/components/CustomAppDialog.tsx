import React, { useEffect } from 'react';
import {
  BackHandler,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { InstalledApp } from '../services/installedApps';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { MenuItem } from '../types';
import { Focusable } from './Focusable';

type Props = {
  item: MenuItem;
  apps: readonly InstalledApp[];
  status: 'loading' | 'ready' | 'error';
  onChoose: (appId: string) => void;
  onClear: () => void;
  onClose: () => void;
};

function selectionSummary(
  item: MenuItem,
  apps: readonly InstalledApp[],
): string {
  if (item.customAppId) {
    const label = apps.find(app => app.appId === item.customAppId)?.label;
    return label
      ? `Custom app: ${label}`
      : `Custom app: ${item.customAppId}`;
  }
  if (item.appId) {
    return `Default app: ${item.appId}`;
  }
  return 'No default app';
}

export function CustomAppDialog({
  item,
  apps,
  status,
  onChoose,
  onClear,
  onClose,
}: Props) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onClose]);

  const preferredAppId =
    item.customAppId != null && apps.some(app => app.appId === item.customAppId)
      ? item.customAppId
      : apps[0]?.appId ?? null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <View style={styles.card} testID="custom-app-dialog">
          <Text style={styles.kicker}>CUSTOM APP</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.summary}>{selectionSummary(item, apps)}</Text>
          {status === 'loading' ? (
            <View focusable hasTVPreferredFocus>
              <Text style={styles.messageText}>Loading installed apps</Text>
            </View>
          ) : null}
          {status === 'error' ? (
            <View focusable hasTVPreferredFocus>
              <Text style={styles.messageText}>
                Installed apps could not be loaded.
              </Text>
            </View>
          ) : null}
          {status === 'ready' && apps.length === 0 ? (
            <Text style={styles.messageText}>No other apps are installed.</Text>
          ) : null}
          {status === 'ready' && apps.length > 0 ? (
            <ScrollView style={styles.list} testID="custom-app-list">
              {apps.map(app => {
                const selected = app.appId === item.customAppId;
                return (
                  <Focusable
                    key={app.appId}
                    hasTVPreferredFocus={app.appId === preferredAppId}
                    onPress={() => onChoose(app.appId)}
                    style={styles.row}
                    testID={`custom-app-${app.appId}`}
                  >
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{app.label}</Text>
                      <Text style={styles.rowId}>{app.appId}</Text>
                    </View>
                    {selected ? <Text style={styles.selected}>Selected</Text> : null}
                  </Focusable>
                );
              })}
            </ScrollView>
          ) : null}
          <Focusable
            onPress={onClear}
            style={styles.clear}
            testID="custom-app-clear"
            hasTVPreferredFocus={status === 'ready' && apps.length === 0}
          >
            <Text style={styles.clearLabel}>Clear</Text>
          </Focusable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: 560,
    maxHeight: '86%',
    backgroundColor: colors.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 24,
  },
  kicker: {
    ...type.kicker,
    color: colors.accent,
    marginBottom: 6,
  },
  title: {
    ...type.title,
    color: colors.textPrimary,
  },
  summary: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
  },
  messageText: {
    ...type.body,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  list: {
    maxHeight: 280,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  rowText: {
    flex: 1,
    paddingRight: 12,
  },
  rowLabel: {
    ...type.nav,
    color: colors.textPrimary,
  },
  rowId: {
    ...type.body,
    color: colors.textMuted,
  },
  selected: {
    ...type.cta,
    color: colors.accent,
  },
  clear: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.navFill,
  },
  clearLabel: {
    ...type.cta,
    color: colors.textPrimary,
  },
});
