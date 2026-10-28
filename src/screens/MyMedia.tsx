import { Panel } from '../components/Panel';
import { Navigation } from '../components/Navigation';
import { mediaMenuItems } from '../config/launcherConfig';
import { ScreenId } from '../types';

export function MyMedia({ screen }: { screen: ScreenId }) {
  return (
    <Panel>
      <Navigation
        active={screen}
        menuItems={mediaMenuItems}
        width={280}
        onSelect={next => {
          console.log('Selected screen:', next);
        }}
      />
    </Panel>
  );
}
