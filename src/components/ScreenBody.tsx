import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Panel } from './Panel';
import { launcherConfig } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { ScreenId } from '../types';
import { Discover } from '../screens/Discover';
import { WatchTV } from '../screens/WatchTV';
import { Stream } from '../screens/Stream';
import { MyMedia } from '../screens/MyMedia';
import { HotelInfo } from '../screens/HotelInfo';

type Props = {
  screen: ScreenId;
  videoFullscreen: boolean;
  setVideoFullscreen: (fullscreen: boolean) => void;
  showChrome: boolean;
};

// TODO: Replace with proper routing mechanism
export function ScreenBody({
  screen,
  videoFullscreen,
  setVideoFullscreen,
  showChrome,
}: Props) {
  if (screen === 'Discover') {
    return (
      <Discover
        videoFullscreen={videoFullscreen}
        setVideoFullscreen={setVideoFullscreen}
        showChrome={showChrome}
      />
    );
  }

  if (screen === 'WatchTV') {
    return <WatchTV />;
  }

  if (screen === 'Stream') {
    return <Stream screen={screen} />;
  }

  if (screen === 'MyMedia') {
    return <MyMedia screen={screen} />;
  }

  if (screen === 'HotelInfo') {
    return <HotelInfo screen={screen} />;
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

const styles = StyleSheet.create({
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
