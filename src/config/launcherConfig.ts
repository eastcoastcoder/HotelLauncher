import cobrandedLogo from '../assets/dogebonk-cheemsyard-cobranded-logo.png';
import dogeBonk from '../assets/doge-bonk.png';
import { LauncherConfig, MenuItem, StreamMenuItem } from '../types';

export const launcherConfig: LauncherConfig = {
  hotelName: 'Hotel Launcher',
  hotelBrand: 'STAY',
  logo: cobrandedLogo,
  welcomeKicker: 'BIG SPENDER MEMBER',
  welcomeMessage: 'Good Evening, Ethan',
  weather: {
    summary: 'Clear',
    fahrenheit: 72,
    celsius: 22,
  },
  mainStage: {
    kicker: 'FEATURED',
    title: 'Your room. Your stay.',
    subtitle: 'Welcome in. The room is ready when you are.',
  },
  nowPlaying: {
    kicker: 'NOW PLAYING',
    title: 'Welcome film',
    description: 'A short welcome loop for the lobby and in-room televisions.',
    cta: 'LEARN MORE',
  },
  promoBanner: {
    image: dogeBonk,
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
  settings: [
    { label: 'Hotel Logo', value: 'Hotel Launcher' },
    { label: 'Guest Name', value: 'Ethan' },
    { label: 'Discover Channel', value: 'https://www.youtube.com/@username' },
    { label: 'Autoplay', value: 'On' },
    { label: 'Weather', value: 'Placeholder' },
  ],
};

export const menuItems: MenuItem[] = [
  { id: 'discover', title: 'Discover', screen: 'Discover', icon: 'home' },
  { id: 'watch-tv', title: 'Watch TV', screen: 'WatchTV', icon: 'tv' },
  { id: 'stream', title: 'Stream', screen: 'Stream', icon: 'stream' },
  { id: 'my-media', title: 'My Media', screen: 'MyMedia', icon: 'play' },
  { id: 'hotel-info', title: 'Hotel Info', screen: 'HotelInfo', icon: 'hotel' },
  { id: 'settings', title: 'Settings', screen: 'Settings', icon: 'settings' },
];

export const streamMenuItems: StreamMenuItem[] = [
  {
    id: 'bonkflix',
    title: 'Bonkflix',
    screen: null,
    icon: null,
    appId: 'com.netflix.ninja',
    customAppId: null,
  },
  {
    id: 'dogetube',
    title: 'DogeTube',
    screen: null,
    icon: null,
    appId: 'com.google.android.youtube.tv',
    customAppId: null,
  },
  {
    id: 'prime',
    title: 'Amazon Prime Video',
    screen: null,
    icon: null,
    appId: 'com.amazon.amazonvideo.livingroom',
    customAppId: null,
  },
  {
    id: 'disney',
    title: 'Disney+',
    screen: null,
    icon: null,
    appId: 'com.disney.disneyplus',
    customAppId: null,
  },
  {
    id: 'hulu',
    title: 'Hulu',
    screen: null,
    icon: null,
    appId: 'com.hulu.livingroomplus',
    customAppId: null,
  },
  {
    id: 'max',
    title: 'Max',
    screen: null,
    icon: null,
    appId: 'com.wbd.stream',
    customAppId: null,
  },
];

export const mediaMenuItems: MenuItem[] = [
  {
    id: 'chromecast',
    title: 'Chromecast',
    screen: null,
    icon: null,
  },
  {
    id: 'headphones',
    title: 'Connect My Headphones',
    screen: null,
    icon: null,
  },
  {
    id: 'tv-as-speaker',
    title: 'TV As My Speaker',
    screen: null,
    icon: null,
  },
  {
    id: 'hdmi',
    title: 'HDMI Direct Connect',
    screen: null,
    icon: null,
  },
];

export const hotelInfoMenuItems: MenuItem[] = [
  {
    id: 'dining',
    title: 'Dining',
    screen: null,
    icon: null,
  },
  {
    id: 'fitness',
    title: 'Fitness',
    screen: null,
    icon: null,
  },
  {
    id: 'swimming',
    title: 'Swimming',
    screen: null,
    icon: null,
  },
  {
    id: 'amenities',
    title: 'Amenities',
    screen: null,
    icon: null,
  },
  {
    id: 'local-area',
    title: 'Local Area',
    screen: null,
    icon: null,
  },
  {
    id: 'transportation',
    title: 'Transportation',
    screen: null,
    icon: null,
  },
  {
    id: 'internet',
    title: 'Internet',
    screen: null,
    icon: null,
  },
  {
    id: 'safety-and-security',
    title: 'Safety and Security',
    screen: null,
    icon: null,
  },
];
