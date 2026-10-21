import { requireNativeComponent, type ViewProps } from 'react-native';

export type YouTubePlayerStatus = 'playing' | 'ended' | 'error';

interface YouTubePlayerProps extends ViewProps {
  videoId: string;
  play?: boolean;
  muted?: boolean;
  onStatus?: (event: { nativeEvent: { state: YouTubePlayerStatus } }) => void;
}

// tvOS view manager. Android TV keeps the WebView and does not mount this.
export const NativeYouTubePlayer =
  requireNativeComponent<YouTubePlayerProps>('NativeYouTubePlayer');
