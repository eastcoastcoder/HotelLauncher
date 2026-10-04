import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

export function MainStage() {
  const stage = launcherConfig.mainStage;

  return (
    <View style={styles.stage}>
      <View style={styles.glow} />
      <Text style={styles.kicker}>{stage.kicker}</Text>
      <Text style={styles.title}>{stage.title}</Text>
      <Text style={styles.subtitle}>{stage.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.stage,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 28,
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(231, 164, 106, 0.16)',
  },
  kicker: {
    ...type.kicker,
    color: colors.accent,
    marginBottom: 8,
  },
  title: {
    ...type.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: 8,
    maxWidth: 520,
  },
});
