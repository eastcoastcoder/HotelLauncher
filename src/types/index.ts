export type NavIconName =
  | 'home'
  | 'tv'
  | 'stream'
  | 'play'
  | 'hotel'
  | 'settings'
  | string;

export interface MenuItem {
  id: string;
  title: string;
  screen: ScreenId | null;
  icon: NavIconName | null;
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
    image: number;
  };
  hotelInfo: HotelFact[];
  settings: { label: string; value: string }[];
}
