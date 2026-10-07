import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  launcherConfig,
  streamMenuItems,
  mediaMenuItems,
  hotelInfoMenuItems,
} from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { ScreenId } from '../types';
import { Navigation } from './Navigation';

type Props = {
  screen: Exclude<ScreenId, 'Discover'>;
};

export function ScreenBody({ screen }: Props) {
  if (screen === 'WatchTV') {
    return (
      <Panel title="Watch TV">
        <Text style={styles.body}>
          Live television integration will be added here. Sony tuner and HDMI
          input access are not assumed.
        </Text>
      </Panel>
    );
  }

  if (screen === 'Stream') {
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

  if (screen === 'MyMedia') {
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

  if (screen === 'HotelInfo') {
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

  if (screen === 'Settings') {
    return (
      <Panel title="Settings">
        <Text style={styles.body}>
          Values come from launcherConfig. Persistent edits are not wired yet.
        </Text>
        {launcherConfig.settings.map(item => (
          <View key={item.label} style={styles.fact}>
            <Text style={styles.factLabel}>{item.label}</Text>
            <Text style={styles.factValue}>{item.value}</Text>
          </View>
        ))}
      </Panel>
    );
  }

  return (
    <Panel title="Privacy Center">
      <Text style={styles.body}>
        This television does not collect guest accounts in this build. Streaming
        apps, when added, open under their own privacy terms.
      </Text>
    </Panel>
  );
}

function Panel({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.panel}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    borderRadius: 16,
    // backgroundColor: colors.stage,
    borderWidth: 1,
    // borderColor: colors.divider,
    padding: 28,
  },
  title: {
    ...type.title,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
    marginBottom: 16,
    maxWidth: 640,
  },
  row: {
    ...type.body,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  muted: {
    color: colors.textMuted,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: 10,
    maxWidth: 720,
  },
  factLabel: {
    ...type.body,
    color: colors.textSecondary,
  },
  factValue: {
    ...type.body,
    color: colors.textPrimary,
  },
});
