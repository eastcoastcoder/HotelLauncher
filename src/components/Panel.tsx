import { useState, type ReactNode } from 'react';
import {
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';

export function Panel({
  title,
  children,
  overlay,
}: {
  title?: string;
  children: ReactNode;
  // Drawn over the visible panel, so dialogs stay put while the body scrolls.
  overlay?: ReactNode;
}) {
  const [viewportHeight, setViewportHeight] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    setViewportHeight(current => (current === next ? current : next));
  };

  return (
    <View style={styles.panel}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          viewportHeight > 0 ? { minHeight: viewportHeight } : null,
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        onLayout={onLayout}
        testID="screen-scroll"
      >
        {children}
      </ScrollView>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    padding: 28,
  },
  title: {
    ...type.title,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
