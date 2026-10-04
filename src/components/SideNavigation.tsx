import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { menuItems } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { ScreenId } from '../types';
import { Focusable } from './Focusable';

type Props = {
  active: ScreenId;
  onSelect: (screen: ScreenId) => void;
};

export function SideNavigation({ active, onSelect }: Props) {
  return (
    <View style={styles.column}>
      {menuItems.map((item, index) => {
        const selected = item.screen === active;
        return (
          <Focusable
            key={item.id}
            hasTVPreferredFocus={index === 0}
            onPress={() => onSelect(item.screen)}
            style={[styles.item, selected && styles.itemSelected]}
          >
            <View style={[styles.tick, selected && styles.tickOn]} />
            <Text style={[styles.label, selected && styles.labelOn]}>
              {item.title}
            </Text>
          </Focusable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 240,
    paddingVertical: 8,
    paddingRight: 12,
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    gap: 12,
  },
  itemSelected: {
    backgroundColor: colors.accentSoft,
  },
  tick: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  tickOn: {
    backgroundColor: colors.accent,
  },
  label: {
    ...type.nav,
    color: colors.textSecondary,
  },
  labelOn: {
    color: colors.textPrimary,
  },
});
