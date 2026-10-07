import { StyleSheet, View } from 'react-native';
import { MainStage } from '../components/MainStage';
import { NowPlayingPanel } from '../components/NowPlayingPanel';

export function Discover({
  videoFullscreen,
  setVideoFullscreen,
  showChrome,
}: {
  videoFullscreen: boolean;
  setVideoFullscreen: (fullscreen: boolean) => void;
  showChrome: boolean;
}) {
  return (
    <View style={styles.discover}>
      <MainStage
        fullscreen={videoFullscreen}
        onEnterFullscreen={() => setVideoFullscreen(true)}
        onExitFullscreen={() => setVideoFullscreen(false)}
      />
      <View style={showChrome ? undefined : styles.hidden}>
        <NowPlayingPanel enabled={showChrome} />
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  discover: {
    flex: 1,
    flexDirection: 'row',
  },
  hidden: {
    display: 'none',
  },
});
