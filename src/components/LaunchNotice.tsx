import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLaunchNotice } from '../context/LaunchNoticeContext';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

export function LaunchNotice() {
  const { notice } = useLaunchNotice();
  if (notice == null) {
    return null;
  }
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Text style={styles.text} testID="stream-launch-notice">
        {notice}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    elevation: 4,
    alignItems: 'flex-end',
    padding: 8,
  },
  text: {
    ...type.body,
    color: colors.textPrimary,
    backgroundColor: colors.scrim,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: 480,
  },
});
