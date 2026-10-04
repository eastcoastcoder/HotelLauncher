import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { Focusable } from './Focusable';

export function NowPlayingPanel() {
  const item = launcherConfig.nowPlaying;

  return (
    <View style={styles.panel}>
      <View style={styles.art}>
        <Text style={styles.artMark}>▶</Text>
      </View>
      <Text style={styles.kicker}>{item.kicker}</Text>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.description}</Text>
      <Focusable style={styles.cta}>
        <Text style={styles.ctaText}>{item.cta} →</Text>
      </Focusable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 280,
    marginLeft: 16,
    borderRadius: 16,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 16,
  },
  art: {
    height: 120,
    borderRadius: 12,
    backgroundColor: '#101A28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  artMark: {
    color: colors.accent,
    fontSize: 28,
  },
  kicker: {
    ...type.kicker,
    color: colors.accent,
  },
  title: {
    ...type.title,
    fontSize: 22,
    color: colors.textPrimary,
    marginTop: 8,
  },
  body: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: 8,
    flex: 1,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  ctaText: {
    ...type.cta,
    color: colors.accent,
  },
});
