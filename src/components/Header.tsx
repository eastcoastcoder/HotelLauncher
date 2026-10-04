import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { launcherConfig } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function Header() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { weather } = launcherConfig;

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Text style={styles.markText}>
            {launcherConfig.hotelBrand.slice(0, 1)}
          </Text>
        </View>
        <Text style={styles.brandText}>{launcherConfig.hotelBrand}</Text>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.kicker}>{launcherConfig.welcomeKicker}</Text>
        <Text style={styles.welcomeText}>{launcherConfig.welcomeMessage}</Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {weather.summary} {weather.fahrenheit}°F / {weather.celsius}°C
        </Text>
        <Text style={styles.clock}>{formatClock(now)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 88,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  brandText: {
    ...type.brand,
    color: colors.textPrimary,
  },
  welcome: {
    flex: 1,
    alignItems: 'center',
  },
  kicker: {
    ...type.welcomeKicker,
    color: colors.accent,
  },
  welcomeText: {
    ...type.welcome,
    color: colors.textPrimary,
    marginTop: 2,
  },
  meta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 18,
  },
  metaText: {
    ...type.meta,
    color: colors.textSecondary,
  },
  clock: {
    ...type.meta,
    color: colors.textPrimary,
    minWidth: 88,
    textAlign: 'right',
  },
});
