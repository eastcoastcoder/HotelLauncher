import { StyleSheet, Text, View } from 'react-native';
import { GuideMark } from '../screens/guideData';

type Props = {
  mark: GuideMark;
  size?: number;
};

export function ChannelMark({ mark, size = 36 }: Props) {
  if (mark === 'hotel') {
    return <HotelMark size={size} />;
  }
  if (mark === 'abc') {
    return (
      <View style={[styles.abc, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.abcText, { fontSize: size * 0.28 }]}>abc</Text>
      </View>
    );
  }
  if (mark === 'cbs') {
    return <CbsMark size={size} />;
  }
  if (mark === 'cw') {
    return (
      <View style={[styles.cw, { width: size * 0.92, height: size * 0.62 }]}>
        <Text style={[styles.cwText, { fontSize: size * 0.34 }]}>CW</Text>
      </View>
    );
  }
  if (mark === 'fox') {
    return (
      <View style={[styles.foxBox, { width: size * 1.15, height: size * 0.72 }]}>
        <Text style={[styles.foxText, { fontSize: size * 0.34 }]}>FOX</Text>
      </View>
    );
  }
  return <NbcMark size={size} />;
}

function HotelMark({ size }: { size: number }) {
  return (
    <View style={[styles.centered, { width: size, height: size }]}>
      <View
        style={[
          styles.tvBody,
          { width: size * 0.78, height: size * 0.56, borderRadius: size * 0.08 },
        ]}
      >
        <View
          style={[
            styles.tvScreen,
            { borderRadius: size * 0.04 },
          ]}
        />
      </View>
      <View style={[styles.tvNeck, { height: size * 0.08 }]} />
      <View style={[styles.tvStand, { width: size * 0.36, height: Math.max(2, size * 0.06) }]} />
    </View>
  );
}

function CbsMark({ size }: { size: number }) {
  const pupil = size * 0.16;
  return (
    <View
      style={[
        styles.cbsOuter,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <View
        style={[
          styles.cbsInner,
          {
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: size * 0.21,
          },
        ]}
      >
        <View
          style={[
            styles.pupil,
            { width: pupil, height: pupil, borderRadius: pupil / 2 },
          ]}
        />
      </View>
    </View>
  );
}

function NbcMark({ size }: { size: number }) {
  const dot = Math.max(4, size * 0.16);
  return (
    <View style={[styles.nbc, { width: size, height: size }]}>
      {NBC_COLORS.map(color => (
        <View
          key={color}
          style={{
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

const NBC_COLORS = ['#F37021', '#FFD200', '#00A651', '#00AEEF', '#7B2D8E', '#E10600'];

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tvBody: {
    borderWidth: 1.5,
    borderColor: '#F2F5F8',
    padding: 3,
  },
  tvScreen: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(242, 245, 248, 0.7)',
  },
  tvNeck: {
    width: 2,
    backgroundColor: '#F2F5F8',
  },
  tvStand: {
    backgroundColor: '#F2F5F8',
    borderRadius: 1,
  },
  abc: {
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  abcText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  cbsOuter: {
    borderWidth: 1.5,
    borderColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cbsInner: {
    borderWidth: 1.5,
    borderColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pupil: {
    backgroundColor: '#F4F7FB',
  },
  cw: {
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cwText: {
    color: '#121418',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  foxBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  foxText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  nbc: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
