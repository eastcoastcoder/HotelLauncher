import React from 'react';
import { Panel } from '../components/Panel';
import { Navigation } from '../components/Navigation';
import { streamMenuItems } from '../config/launcherConfig';

export function Stream({ screen }: { screen: string }) {
  return (
    <Panel>
      <Navigation
        active={screen}
        menuItems={streamMenuItems}
        onSelect={next => {
          console.log('Selected screen:', next);
        }}
      />
    </Panel>
  );
}
