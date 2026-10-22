import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MainStage } from '../components/MainStage';
import { NowPlayingPanel } from '../components/NowPlayingPanel';
import {
  type NowPlayingTrack,
  type StageTransport,
} from '../components/stageTransport';

export function Discover({
  videoFullscreen,
  setVideoFullscreen,
  showChrome,
}: {
  videoFullscreen: boolean;
  setVideoFullscreen: (fullscreen: boolean) => void;
  showChrome: boolean;
}) {
  const transportRef = useRef<StageTransport | null>(null);
  const [track, setTrack] = useState<NowPlayingTrack | null>(null);

  return (
    <View style={styles.discover}>
      <MainStage
        fullscreen={videoFullscreen}
        onEnterFullscreen={() => setVideoFullscreen(true)}
        onExitFullscreen={() => setVideoFullscreen(false)}
        onNowPlaying={setTrack}
        transportRef={transportRef}
      />
      <View style={showChrome ? undefined : styles.hidden}>
        <NowPlayingPanel
          enabled={showChrome}
          track={track}
          onPrevious={() => transportRef.current?.previous()}
          onNext={() => transportRef.current?.next()}
          onTogglePlay={() => transportRef.current?.togglePlay()}
        />
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
