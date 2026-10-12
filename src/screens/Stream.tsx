import React from 'react';
import { Panel } from '../components/Panel';
import { Navigation } from '../components/Navigation';
import { streamMenuItems } from '../config/launcherConfig';
import { ScreenId } from '../types';

export function Stream({ screen }: { screen: ScreenId }) {
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
