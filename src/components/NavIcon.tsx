import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavIconName } from '../types';

type Props = {
  name: NavIconName;
  color: string;
};

export function NavIcon({ name, color }: Props) {
  if (name === 'home') {
    return <Home color={color} />;
  }
  if (name === 'tv') {
    return <Tv color={color} />;
  }
  if (name === 'stream') {
    return <Stream color={color} />;
  }
  if (name === 'play') {
    return <Play color={color} />;
  }
  if (name === 'hotel') {
    return <Hotel color={color} />;
  }
  return <Settings color={color} />;
}

function Home({ color }: { color: string }) {
  return (
    <View style={styles.box}>
      <View style={[styles.roofLeft, { backgroundColor: color }]} />
      <View style={[styles.roofRight, { backgroundColor: color }]} />
      <View style={[styles.walls, { borderColor: color }]} />
    </View>
  );
}

function Tv({ color }: { color: string }) {
  return (
    <View style={styles.box}>
      <View style={[styles.screen, { borderColor: color }]} />
    </View>
  );
}

function Stream({ color }: { color: string }) {
  return (
    <View style={styles.box}>
      <View style={styles.streamRow}>
        <Triangle color={color} kind="stream" />
        <Triangle color={color} kind="stream" />
      </View>
    </View>
  );
}

function Play({ color }: { color: string }) {
  return (
    <View style={[styles.box, styles.center]}>
      <Triangle color={color} kind="play" />
    </View>
  );
}

function Hotel({ color }: { color: string }) {
  return (
    <View style={styles.box}>
      <View style={[styles.penthouse, { borderColor: color }]} />
      <View style={[styles.building, { borderColor: color }]} />
      <View
        style={[styles.window, styles.windowA, { backgroundColor: color }]}
      />
      <View
        style={[styles.window, styles.windowB, { backgroundColor: color }]}
      />
      <View
        style={[styles.window, styles.windowC, { backgroundColor: color }]}
      />
      <View
        style={[styles.window, styles.windowD, { backgroundColor: color }]}
      />
    </View>
  );
}

function Settings({ color }: { color: string }) {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <View style={styles.box}>
      {teeth.map(deg => (
        <View
          key={deg}
          style={[styles.toothWrap, { transform: [{ rotate: `${deg}deg` }] }]}
        >
          <View style={[styles.tooth, { backgroundColor: color }]} />
        </View>
      ))}
      <View style={[styles.gearRing, { borderColor: color }]} />
    </View>
  );
}

function Triangle({ color, kind }: { color: string; kind: 'stream' | 'play' }) {
  return (
    <View
      style={[
        kind === 'stream' ? styles.streamTriangle : styles.playTriangle,
        { borderLeftColor: color },
      ]}
    />
  );
}

const stroke = 1.7;

const styles = StyleSheet.create({
  box: {
    width: 24,
    height: 24,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  roofLeft: {
    position: 'absolute',
    left: 3.6,
    top: 7.1,
    width: 10.3,
    height: stroke,
    borderRadius: 1,
    transform: [{ rotate: '-51deg' }],
  },
  roofRight: {
    position: 'absolute',
    left: 10.1,
    top: 7.1,
    width: 10.3,
    height: stroke,
    borderRadius: 1,
    transform: [{ rotate: '51deg' }],
  },
  walls: {
    position: 'absolute',
    left: 5.5,
    top: 12,
    width: 13,
    height: 9.2,
    borderWidth: stroke,
    borderTopWidth: 0,
  },
  screen: {
    position: 'absolute',
    left: 2,
    top: 5,
    width: 20,
    height: 14,
    borderWidth: stroke,
    borderRadius: 3,
  },
  streamRow: {
    position: 'absolute',
    left: 2,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streamTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 11,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  penthouse: {
    position: 'absolute',
    left: 8,
    top: 3,
    width: 8,
    height: 5.5,
    borderWidth: stroke,
    borderBottomWidth: 0,
  },
  building: {
    position: 'absolute',
    left: 3.5,
    top: 7.5,
    width: 17,
    height: 13,
    borderWidth: stroke,
    borderRadius: 1,
  },
  window: {
    position: 'absolute',
    width: 3,
    height: 2.4,
  },
  windowA: { left: 6.5, top: 11 },
  windowB: { left: 13.5, top: 11 },
  windowC: { left: 6.5, top: 15.2 },
  windowD: { left: 13.5, top: 15.2 },
  toothWrap: {
    position: 'absolute',
    width: 24,
    height: 24,
    alignItems: 'center',
  },
  tooth: {
    width: 3,
    height: 7,
    borderRadius: 0.6,
  },
  gearRing: {
    position: 'absolute',
    left: 5,
    top: 5,
    width: 14,
    height: 14,
    borderWidth: 2.2,
    borderRadius: 7,
  },
});
