import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppProviders } from './src/context/AppProviders';
import { TVApp } from './src/navigation/TVApp';
import { useTVCanvasDimensions } from './src/theme/tvCanvas';

function TVCanvas({ children }: { children: ReactNode }) {
  const { width, height, scale } = useTVCanvasDimensions();
  return (
    <View style={styles.viewport}>
      <View
        style={[
          styles.canvas,
          { width, height, transform: [{ scale }] },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function App() {
  return (
    <AppProviders>
      <TVCanvas>
        <TVApp />
      </TVCanvas>
    </AppProviders>
  );
}

export default App;

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canvas: {
    overflow: 'hidden',
  },
});
