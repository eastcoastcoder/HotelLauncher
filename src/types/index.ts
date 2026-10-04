export interface MenuItem {
  id: string;
  title: string;
  screen: ScreenId;
}

export type ScreenId =
  | 'Discover'
  | 'WatchTV'
  | 'Stream'
  | 'MyMedia'
  | 'HotelInfo'
  | 'Settings'
  | 'Privacy';

export interface HotelFact {
  label: string;
  value: string;
}

export interface StreamApp {
  id: string;
  label: string;
  packageName: string;
  verified: boolean;
}

export interface LauncherConfig {
  hotelName: string;
  hotelBrand: string;
  welcomeKicker: string;
  welcomeMessage: string;
  weather: {
    summary: string;
    fahrenheit: number;
    celsius: number;
  };
  mainStage: {
    kicker: string;
    title: string;
    subtitle: string;
  };
  nowPlaying: {
    kicker: string;
    title: string;
    description: string;
    cta: string;
  };
  promoBanner: {
    kicker: string;
    title: string;
    description: string;
    cta: string;
  };
  hotelInfo: HotelFact[];
  streamApps: StreamApp[];
  settings: { label: string; value: string }[];
}
