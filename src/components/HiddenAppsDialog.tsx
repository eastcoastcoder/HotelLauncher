import { useEffect } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { Focusable } from './Focusable';

type HiddenApp = { id: string; title: string };

type Props = {
  items: readonly HiddenApp[];
  armed: boolean;
  onRestore: (id: string) => void;
  onClose: () => void;
};

export function HiddenAppsDialog({ items, armed, onRestore, onClose }: Props) {
  const rowsOn = armed && items.length > 0;
  return (
    <View style={styles.scrim}>
      <BackClose onRequestClose={onClose} />
      <View style={styles.card} testID="hidden-apps-dialog">
        <Text style={styles.kicker}>HIDDEN APPS</Text>
        <Text style={styles.title}>Hidden apps</Text>
        <Text style={styles.summary}>Choose one app to put back.</Text>
        {items.length === 0 ? (
          <Text style={styles.summary}>No default apps are hidden.</Text>
        ) : (
          <ScrollView style={styles.list} testID="hidden-apps-list">
            {items.map((item, index) => (
              <HiddenChoice
                key={item.id}
                item={item}
                selectable={rowsOn}
                preferred={rowsOn && index === 0}
                onRestore={onRestore}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function HiddenChoice({
  item,
  selectable,
  preferred,
  onRestore,
}: {
  item: HiddenApp;
  selectable: boolean;
  preferred: boolean;
  onRestore: (id: string) => void;
}) {
  if (!selectable) {
    return (
      <View style={styles.row} testID={`hidden-app-${item.id}`}>
        <Text style={styles.rowLabel}>{item.title}</Text>
      </View>
    );
  }
  return (
    <Focusable
      hasTVPreferredFocus={preferred}
      onPress={() => onRestore(item.id)}
      style={styles.row}
      testID={`hidden-app-${item.id}`}
    >
      <Text style={styles.rowLabel}>{item.title}</Text>
    </Focusable>
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
    ...type.body,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 16,
  },
  list: {
    maxHeight: 280,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  rowLabel: {
    ...type.nav,
    color: colors.textPrimary,
  },
});
