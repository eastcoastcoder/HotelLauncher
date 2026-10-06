import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { menuItems } from '../config/launcherConfig';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { ScreenId } from '../types';
import { Focusable } from './Focusable';
import { NavIcon } from './NavIcon';

type Props = {
  active: ScreenId;
  onSelect: (screen: ScreenId) => void;
};

export function SideNavigation({ active, onSelect }: Props) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  return (
    <View style={styles.column}>
      {menuItems.map((item, index) => {
        const selected = item.screen === active;
        const emphasized =
          focusedId === null ? selected : focusedId === item.id;
        const color = emphasized ? colors.navActive : colors.navIdle;
        return (
          <Focusable
            key={item.id}
            hasTVPreferredFocus={index === 0}
            onPress={() => onSelect(item.screen)}
            onFocusChange={focused => {
              setFocusedId(current => {
                if (focused) {
                  return item.id;
                }
                return current === item.id ? null : current;
              });
            }}
            style={[styles.item, emphasized && styles.itemOn]}
            focusedStyle={styles.itemOn}
          >
            <View style={styles.barSlot}>
              {emphasized ? <View style={styles.bar} /> : null}
            </View>
            {item.icon ? <NavIcon name={item.icon} color={color} /> : null}
            <Text style={[styles.label, { color }]}>{item.title}</Text>
          </Focusable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 260,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingLeft: 6,
    paddingRight: 10,
    gap: 12,
    borderRadius: 6,
    borderWidth: 0,
  },
  itemOn: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  barSlot: {
    width: 7,
    height: '100%',
    justifyContent: 'center',
  },
  bar: {
    width: '100%',
    height: '100%',
    borderRadius: 1,
    backgroundColor: colors.navBar,
  },
  label: {
    ...type.nav,
  },
});
