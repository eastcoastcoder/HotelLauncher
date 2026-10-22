export type NowPlayingTrack = {
  videoId: string;
  title: string;
  paused: boolean;
};

export type StageTransport = {
  previous: () => void;
  next: () => void;
  togglePlay: () => void;
};
