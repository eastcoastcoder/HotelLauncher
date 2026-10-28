import { View, StyleSheet } from 'react-native';
import { Panel } from '../components/Panel';
import { Navigation } from '../components/Navigation';
import { mediaMenuItems } from '../config/launcherConfig';
import { ScreenId } from '../types';
import { openHeadphoneSettings } from '../services/bluetoothSettings';

export function MyMedia({ screen }: { screen: ScreenId }) {
  return (
    <Panel>
      <View style={styles.row}>
        <Navigation
          active={screen}
          menuItems={mediaMenuItems}
          width={280}
          onSelect={next => {
            console.log('Selected screen:', next);
          }}
          onItemPress={item => {
            if (item.id === 'headphones') {
              openHeadphoneSettings();
              return;
            }
            console.log('Selected screen:', item.screen);
          }}
        />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: 50,
  },
});
