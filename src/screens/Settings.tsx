import { Text } from 'react-native';
import { Panel } from '../components/Panel';
import { ScreenId } from '../types';
import { StyleSheet, View } from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { type } from '../theme/typography';
import { colors } from '../theme/colors';

export function Settings({}: { screen?: ScreenId }) {
  return (
    <Panel title="Settings">
      <Text style={styles.body}>
        Values come from launcherConfig. Persistent edits are not wired yet.
      </Text>
      {launcherConfig.settings.map(item => (
        <View key={item.label} style={styles.fact}>
          <Text style={styles.factLabel}>{item.label}</Text>
          <Text style={styles.factValue}>{item.value}</Text>
        </View>
      ))}
    </Panel>
  );
}

const styles = StyleSheet.create({
  body: {
    ...type.body,
    color: colors.textSecondary,
    marginBottom: 16,
    maxWidth: 640,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: 10,
    maxWidth: 720,
  },
  factLabel: {
    ...type.body,
    color: colors.textSecondary,
  },
  factValue: {
    ...type.body,
    color: colors.textPrimary,
  },
});
