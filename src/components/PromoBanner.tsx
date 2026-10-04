import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { Focusable } from './Focusable';

export function PromoBanner() {
  const promo = launcherConfig.promoBanner;

  return (
    <View style={styles.banner}>
      <View style={styles.swatch} />
      <View style={styles.copy}>
        <Text style={styles.kicker}>{promo.kicker}</Text>
        <Text style={styles.title}>{promo.title}</Text>
        <Text style={styles.body}>{promo.description}</Text>
      </View>
      <Focusable style={styles.cta}>
        <Text style={styles.ctaText}>{promo.cta} →</Text>
      </Focusable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 96,
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  swatch: {
    width: 88,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  copy: {
    flex: 1,
  },
  kicker: {
    ...type.kicker,
    color: colors.accent,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  cta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ctaText: {
    ...type.cta,
    color: colors.accent,
  },
});
