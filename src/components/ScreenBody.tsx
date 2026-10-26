import { ScreenId } from '../types';
import { Discover } from '../screens/Discover';
import { WatchTV } from '../screens/WatchTV';
import { Stream } from '../screens/Stream';
import { MyMedia } from '../screens/MyMedia';
import { HotelInfo } from '../screens/HotelInfo';
import { Settings } from '../screens/Settings';

type Props = {
  screen: ScreenId;
  videoFullscreen: boolean;
  setVideoFullscreen: (fullscreen: boolean) => void;
  showChrome: boolean;
  onWatchTVFullscreenChange: (fullscreen: boolean) => void;
  onWatchTVCloseHandlerChange: (close: (() => void) | null) => void;
};

// TODO: Replace with proper routing mechanism
export function ScreenBody({
  screen,
  videoFullscreen,
  setVideoFullscreen,
  showChrome,
  onWatchTVFullscreenChange,
  onWatchTVCloseHandlerChange,
}: Props) {
  if (screen === 'Discover') {
    return (
      <Discover
        videoFullscreen={videoFullscreen}
        setVideoFullscreen={setVideoFullscreen}
        showChrome={showChrome}
      />
    );
  }

  if (screen === 'WatchTV') {
    return (
      <WatchTV
        onFullscreenChange={onWatchTVFullscreenChange}
        onCloseHandlerChange={onWatchTVCloseHandlerChange}
      />
    );
  }

  if (screen === 'Stream') {
    return <Stream screen={screen} />;
  }

  if (screen === 'MyMedia') {
    return <MyMedia screen={screen} />;
  }

  if (screen === 'HotelInfo') {
    return <HotelInfo screen={screen} />;
  }

  if (screen === 'Settings') {
    return <Settings />;
  }

  const unexpected: never = screen;
  return unexpected;
}
