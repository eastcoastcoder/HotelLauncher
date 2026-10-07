import { StyleSheet, Text } from 'react-native';
import { Panel } from '../components/Panel';
import { type } from '../theme/typography';
import { colors } from '../theme/colors';

export function WatchTV() {
  return (
    <Panel title="Watch TV">
      <Text style={styles.body}>
        Live television integration will be added here. Sony tuner and HDMI
        input access are not assumed.
      </Text>
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
});
