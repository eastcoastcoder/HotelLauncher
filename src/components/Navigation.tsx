import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useBackground } from '../context/BackgroundContext';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { MenuItem, ScreenId } from '../types';
import { Focusable } from './Focusable';
import { NavIcon } from './NavIcon';

type Props = {
  active: ScreenId;
  onSelect: (screen: ScreenId | null) => void;
  enabled?: boolean;
  menuItems: readonly MenuItem[];
};

export function Navigation({
  active,
  onSelect,
  menuItems,
  enabled = true,
}: Props) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const {
    setHoveredMenuItem,
    clearHoveredMenuItem,
    setActiveMenuItem,
    releaseMenuItems,
  } = useBackground();
  const menuItemKey = menuItems.map(item => item.id).join('\0');

  useEffect(() => {
    const ids = new Set(menuItemKey === '' ? [] : menuItemKey.split('\0'));
    return () => releaseMenuItems(ids);
  }, [menuItemKey, releaseMenuItems]);

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
            focusable={enabled}
            hasTVPreferredFocus={index === 0}
            onPress={() => {
              setActiveMenuItem(item.id);
              onSelect(item.screen);
            }}
            onFocusChange={focused => {
              setFocusedId(current => {
                if (focused) {
                  return item.id;
                }
                return current === item.id ? null : current;
              });
              if (focused) {
                setHoveredMenuItem(item.id);
              } else {
                clearHoveredMenuItem(item.id);
              }
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
    width: 200,
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
