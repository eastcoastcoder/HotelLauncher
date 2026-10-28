import { useCallback, useEffect, useRef, useState } from 'react';
import { findNodeHandle, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useBackground } from '../context/BackgroundContext';
import { useNavReturn } from '../navigation/NavReturn';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { MenuItem, ScreenId } from '../types';
import { Focusable } from './Focusable';
import { NavIcon } from './NavIcon';

type Props = {
  active: ScreenId;
  onSelect: (screen: ScreenId | null) => void;
  onItemFocus?: (item: MenuItem) => void;
  onItemPress?: (item: MenuItem) => void;
  onItemPressOut?: (item: MenuItem) => void;
  onItemLongPress?: (item: MenuItem) => void;
  enabled?: boolean;
  menuItems: readonly MenuItem[];
  preferredFocusId?: string | null;
  preferredFocusNonce?: number;
  scrollable?: boolean;
  width?: number;
};

export function Navigation({
  active,
  onSelect,
  onItemFocus,
  onItemPress,
  onItemPressOut,
  onItemLongPress,
  menuItems,
  enabled = true,
  preferredFocusId = null,
  preferredFocusNonce = 0,
  scrollable = false,
  width = 200,
}: Props) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const {
    setHoveredMenuItem,
    clearHoveredMenuItem,
    setActiveMenuItem,
    releaseMenuItems,
  } = useBackground();
  const menuItemKey = menuItems.map(item => item.id).join('\0');
  // Screen menus name a ScreenId. Submenus (Stream, My Media, Hotel Info) do not.
  const directsScreen = menuItems.some(item => item.screen != null);
  const hasReceivedFocus = useRef(false);
  const menuItemsRef = useRef(menuItems);
  menuItemsRef.current = menuItems;
  const itemRefs = useRef(new Map<string, View | null>());
  const navReturn = useNavReturn();
  const navReturnRef = useRef(navReturn);
  navReturnRef.current = navReturn;
  const returnTarget = navReturn?.mains[active] ?? null;
  const entryTarget = navReturn?.entries[active] ?? null;

  const publishNavHandles = useCallback(() => {
    const link = navReturnRef.current;
    if (link == null) {
      return;
    }
    const items = menuItemsRef.current;
    if (directsScreen) {
      const item = items.find(entry => entry.screen === active);
      const node = item == null ? null : itemRefs.current.get(item.id);
      link.setMain(active, node == null ? null : findNodeHandle(node));
      return;
    }
    const first = items[0];
    const node = first == null ? null : itemRefs.current.get(first.id);
    link.setEntry(active, node == null ? null : findNodeHandle(node));
  }, [active, directsScreen]);

  useEffect(() => {
    publishNavHandles();
    return () => {
      const link = navReturnRef.current;
      if (directsScreen) {
        link?.setMain(active, null);
        return;
      }
      link?.setEntry(active, null);
    };
  }, [active, directsScreen, publishNavHandles]);

  useEffect(() => {
    const ids = new Set(menuItemKey === '' ? [] : menuItemKey.split('\0'));
    return () => releaseMenuItems(ids);
  }, [menuItemKey, releaseMenuItems]);

  const rows = menuItems.map(item => {
    const itemIndex = menuItems.indexOf(item);
    const previousItem = directsScreen ? menuItems[itemIndex - 1] : null;
    const nextItem = directsScreen ? menuItems[itemIndex + 1] : null;
    const previousNode =
      previousItem == null ? null : itemRefs.current.get(previousItem.id);
    const nextNode = nextItem == null ? null : itemRefs.current.get(nextItem.id);
    const selected = item.screen === active;
    const emphasized = focusedId === null ? selected : focusedId === item.id;
    const color = emphasized ? colors.navActive : colors.navIdle;
    const preferred =
      preferredFocusId != null
        ? preferredFocusId === item.id
        : directsScreen &&
          !hasReceivedFocus.current &&
          focusedId == null &&
          item.screen === active;
    return (
      <Focusable
        key={
          preferredFocusId === item.id
            ? `${item.id}:${preferredFocusNonce}`
            : item.id
        }
        ref={node => {
          itemRefs.current.set(item.id, node);
          if (item.screen != null) {
            navReturnRef.current?.registerMainNode(item.screen, node);
          } else if (!directsScreen && menuItems[0]?.id === item.id) {
            navReturnRef.current?.registerEntryNode(active, node);
          }
        }}
        focusable={enabled}
        hasTVPreferredFocus={preferred ? true : undefined}
        onLayout={publishNavHandles}
        nextFocusLeft={
          directsScreen || returnTarget == null ? undefined : returnTarget
        }
        nextFocusUp={
          previousNode == null ? undefined : findNodeHandle(previousNode) ?? undefined
        }
        nextFocusDown={
          nextNode == null ? undefined : findNodeHandle(nextNode) ?? undefined
        }
        nextFocusRight={
          directsScreen && item.screen === active && entryTarget != null
            ? entryTarget
            : undefined
        }
        onPress={() => {
          setActiveMenuItem(item.id);
          if (onItemPress) {
            onItemPress(item);
            return;
          }
          onSelect(item.screen);
          if (directsScreen && item.screen != null) {
            navReturnRef.current?.focusEntry(item.screen);
          }
        }}
        onPressOut={
          onItemPressOut == null
            ? undefined
            : () => {
                onItemPressOut(item);
              }
        }
        onLongPress={
          onItemLongPress == null
            ? undefined
            : () => {
                onItemLongPress(item);
              }
        }
        delayLongPress={700}
        onFocusChange={focused => {
          setFocusedId(current => {
            if (focused) {
              return item.id;
            }
            return current === item.id ? null : current;
          });
          if (focused) {
            hasReceivedFocus.current = true;
            setHoveredMenuItem(item.id);
            if (directsScreen) {
              onItemFocus?.(item);
            }
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
  });

  if (!scrollable) {
    return <View style={[styles.column, { width }]}>{rows}</View>;
  }
  return (
    <ScrollView
      style={[styles.scroll, { width }]}
      contentContainerStyle={styles.columnScroll}
    >
      {rows}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  column: {
    width: 200,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 4,
  },
  scroll: {
    width: 200,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  columnScroll: {
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
