import HomeIcon from '../assets/home-icon.svg';
import HotelIcon from '../assets/hotel-icon.svg';
import PauseIcon from '../assets/pause-icon.svg';
import PlayIcon from '../assets/play-icon.svg';
import PrevIcon from '../assets/prev-icon.svg';
import NextIcon from '../assets/next-icon.svg';
import SettingsIcon from '../assets/settings-icon.svg';
import StreamIcon from '../assets/stream-icon.svg';
import TvIcon from '../assets/tv-icon.svg';
import { NavIconName } from '../types';

type Props = {
  name: NavIconName;
  color: string;
};

export function NavIcon({ name, color }: Props) {
  switch (name) {
    case 'home':
      return <HomeIcon width={24} height={24} stroke={color} />;
    case 'tv':
      return <TvIcon width={24} height={24} fill={color} stroke={color} />;
    case 'stream':
      return <StreamIcon width={24} height={24} fill={color} />;
    case 'prev':
      return <PrevIcon width={24} height={24} fill={color} />;
    case 'play':
      return <PlayIcon width={24} height={24} fill={color} />;
    case 'next':
      return <NextIcon width={24} height={24} fill={color} />;
    case 'pause':
      return <PauseIcon width={24} height={24} fill={color} />;
    case 'hotel':
      return <HotelIcon width={24} height={24} fill={color} stroke={color} />;
    case 'settings':
      return (
        <SettingsIcon width={24} height={24} fill={color} stroke={color} />
      );
    default: {
      const unexpected: never = name;
      return unexpected;
    }
  }
}
