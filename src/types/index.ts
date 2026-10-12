export type NavIconName =
  | 'home'
  | 'tv'
  | 'stream'
  | 'play'
  | 'hotel'
  | 'settings';

export interface MenuItem {
  id: string;
  title: string;
  screen: ScreenId | null;
  icon: NavIconName | null;
  /** Android package launched on Select. Null when the row has no built-in app. */
  appId?: string | null;
  /** Guest override of appId. Null uses appId. Persisted outside this config. */
  customAppId?: string | null;
}

export interface StreamMenuItem extends MenuItem {
  appId: string | null;
  customAppId: string | null;
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
  logo: number;
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
