import { Panel } from '../components/Panel';
import { Navigation } from '../components/Navigation';
import { mediaMenuItems } from '../config/launcherConfig';

export function MyMedia({ screen }: { screen: string }) {
  return (
    <Panel>
      <Navigation
        active={screen}
        menuItems={mediaMenuItems}
        onSelect={next => {
          console.log('Selected screen:', next);
        }}
      />
    </Panel>
  );
}
