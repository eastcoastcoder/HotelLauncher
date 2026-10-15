import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InstalledApp } from '../services/installedApps';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { MenuItem } from '../types';
import { Focusable } from './Focusable';

type Props = {
  item: MenuItem;
  apps: readonly InstalledApp[];
  status: 'loading' | 'ready' | 'error';
  armed: boolean;
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
    return label ? `Custom app: ${label}` : `Custom app: ${item.customAppId}`;
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
  armed,
  onChoose,
  onClear,
  onClose,
}: Props) {
  // This is an overlay in the same window, not a Modal. A Modal takes window
  // focus while Select is still down, and the key-up is delivered inside the
  // new window. Rows stay non-pressable until the stream row that opened the
  // dialog has handled that key-up itself.
  const rowsOn = armed && status === 'ready' && apps.length > 0;
  const clearOn = armed && status !== 'loading';
  const holdFocus = armed && !rowsOn && !clearOn;

  const preferredAppId =
    item.customAppId != null && apps.some(app => app.appId === item.customAppId)
      ? item.customAppId
      : apps[0]?.appId ?? null;

  return (
    <View style={styles.scrim}>
      <BackClose onRequestClose={onClose} />
      <View style={styles.card} testID="custom-app-dialog">
        <Text style={styles.kicker}>CUSTOM APP</Text>
        <Text style={styles.title}>{item.title}</Text>
        {holdFocus ? (
          <Focusable
            hasTVPreferredFocus
            onPress={() => {}}
            style={styles.summary}
            testID="custom-app-select-guard"
          >
            <Text style={styles.summaryText}>
              {selectionSummary(item, apps)}
            </Text>
          </Focusable>
        ) : (
          <Text style={[styles.summary, styles.summaryText]}>
            {selectionSummary(item, apps)}
          </Text>
        )}
        {status === 'loading' ? (
          <Text style={styles.messageText}>Loading installed apps</Text>
        ) : null}
        {status === 'error' ? (
          <Text style={styles.messageText}>
            Installed apps could not be loaded.
          </Text>
        ) : null}
        {status === 'ready' && apps.length === 0 ? (
          <Text style={styles.messageText}>No other apps are installed.</Text>
        ) : null}
        {status === 'ready' && apps.length > 0 ? (
          <ScrollView
            style={styles.list}
            testID="custom-app-list"
            focusable={false}
          >
            {apps.map(app => (
              <AppChoice
                key={app.appId}
                app={app}
                selected={app.appId === item.customAppId}
                selectable={rowsOn}
                preferred={rowsOn && app.appId === preferredAppId}
                onChoose={onChoose}
              />
            ))}
          </ScrollView>
        ) : null}
        {clearOn ? (
          <Focusable
            onPress={onClear}
            style={styles.clear}
            testID="custom-app-clear"
            hasTVPreferredFocus={!rowsOn}
          >
            <Text style={styles.clearLabel}>Clear</Text>
          </Focusable>
        ) : (
          <View style={styles.clear} testID="custom-app-clear">
            <Text style={styles.clearLabel}>Clear</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function BackClose({ onRequestClose }: { onRequestClose: () => void }) {
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onRequestClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [onRequestClose]);
  return null;
}

function AppChoice({
  app,
  selected,
  selectable,
  preferred,
  onChoose,
}: {
  app: InstalledApp;
  selected: boolean;
  selectable: boolean;
  preferred: boolean;
  onChoose: (appId: string) => void;
}) {
  const body = (
    <>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{app.label}</Text>
        <Text style={styles.rowId}>{app.appId}</Text>
      </View>
      {selected ? <Text style={styles.selected}>Selected</Text> : null}
    </>
  );
  if (!selectable) {
    return (
      <View style={styles.row} testID={`custom-app-${app.appId}`}>
        {body}
      </View>
    );
  }
  return (
    <Focusable
      hasTVPreferredFocus={preferred}
      onPress={() => onChoose(app.appId)}
      style={styles.row}
      testID={`custom-app-${app.appId}`}
    >
      {body}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 3,
    elevation: 6,
    backgroundColor: colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxHeight: '200%',
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
    marginTop: 6,
    marginBottom: 16,
  },
  summaryText: {
    ...type.body,
    color: colors.textSecondary,
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
