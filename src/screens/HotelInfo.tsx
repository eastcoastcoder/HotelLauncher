import { Panel } from '../components/Panel';
import { Navigation } from '../components/Navigation';
import { hotelInfoMenuItems } from '../config/launcherConfig';

export function HotelInfo({ screen }: { screen: string }) {
  return (
    <Panel>
      <Navigation
        active={screen}
        menuItems={hotelInfoMenuItems}
        onSelect={next => {
          console.log('Selected screen:', next);
        }}
      />
    </Panel>
  );
}
