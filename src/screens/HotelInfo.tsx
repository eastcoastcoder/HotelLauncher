import { StyleSheet, View } from 'react-native';
import { Panel } from '../components/Panel';
import { Navigation } from '../components/Navigation';
import { hotelInfoMenuItems } from '../config/launcherConfig';
import { ScreenId } from '../types';

export function HotelInfo({ screen }: { screen: ScreenId }) {
  return (
    <Panel>
      <View style={styles.row}>
        <Navigation
          active={screen}
          menuItems={hotelInfoMenuItems}
          onSelect={next => {
            console.log('Selected screen:', next);
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
