import { LauncherConfig, MenuItem } from '../types';

export const launcherConfig: LauncherConfig = {
  hotelName: 'Hotel Launcher',
  hotelBrand: 'STAY',
  welcomeKicker: 'WELCOME',
  welcomeMessage: 'Enjoy your stay',
  weather: {
    summary: 'Clear',
    fahrenheit: 72,
    celsius: 22,
  },
  mainStage: {
    kicker: 'FEATURED',
    title: 'Your room. Your stay.',
    subtitle: 'Live video will play here once a TV-compatible player is added.',
  },
  nowPlaying: {
    kicker: 'NOW PLAYING',
    title: 'Welcome film',
    description: 'A short welcome loop for the lobby and in-room televisions.',
    cta: 'LEARN MORE',
  },
  promoBanner: {
    kicker: 'TONIGHT',
    title: 'A quieter kind of luxury.',
    description: 'Ask the front desk about late dining and sunrise swims.',
    cta: 'LEARN MORE',
  },
  hotelInfo: [
    { label: 'Front Desk', value: 'Dial 0' },
    { label: 'Restaurant', value: 'Lobby, 6:30 AM – 10:00 PM' },
    { label: 'Pool', value: 'Level 2, 7:00 AM – 9:00 PM' },
    { label: 'Fitness Center', value: 'Level 2, open 24 hours' },
    { label: 'Parking', value: 'Valet at the main entrance' },
    { label: 'Wi-Fi', value: 'Network STAY · password on your key packet' },
    { label: 'Check-out', value: '11:00 AM' },
    { label: 'Contact', value: 'front.desk@example.com' },
  ],
  streamApps: [
    {
      id: 'netflix',
      label: 'Netflix',
      packageName: 'unverified',
      verified: false,
    },
    {
      id: 'youtube',
      label: 'YouTube',
      packageName: 'unverified',
      verified: false,
    },
    {
      id: 'prime',
      label: 'Prime Video',
      packageName: 'unverified',
      verified: false,
    },
    {
      id: 'disney',
      label: 'Disney+',
      packageName: 'unverified',
      verified: false,
    },
    { id: 'hulu', label: 'Hulu', packageName: 'unverified', verified: false },
    { id: 'max', label: 'Max', packageName: 'unverified', verified: false },
  ],
  settings: [
    { label: 'Hotel name', value: 'Hotel Launcher' },
    { label: 'Main video', value: 'Placeholder stage' },
    { label: 'Autoplay', value: 'On' },
    { label: 'Video mute', value: 'On' },
    { label: 'Weather', value: 'Placeholder' },
    { label: 'Debug', value: 'On' },
  ],
};

export const menuItems: MenuItem[] = [
  { id: 'discover', title: 'Discover', screen: 'Discover', icon: 'home' },
  { id: 'watch-tv', title: 'Watch TV', screen: 'WatchTV', icon: 'tv' },
  { id: 'stream', title: 'Stream', screen: 'Stream', icon: 'stream' },
  { id: 'my-media', title: 'My Media', screen: 'MyMedia', icon: 'play' },
  { id: 'hotel-info', title: 'Hotel Info', screen: 'HotelInfo', icon: 'hotel' },
  { id: 'settings', title: 'Settings', screen: 'Settings', icon: 'settings' },
  { id: 'privacy', title: 'Privacy Center', screen: 'Privacy', icon: null },
];
