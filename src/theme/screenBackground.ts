import { ViewStyle } from 'react-native';
import bonkflixBg from '../assets/bonkflixbg.png';

type GradientLayer = Extract<
  NonNullable<ViewStyle['experimental_backgroundImage']>,
  readonly unknown[]
>;

type GradientStop = GradientLayer[number] extends { colorStops: infer Stops }
  ? Stops extends readonly (infer Stop)[]
    ? Stop
    : never
  : never;

export type MenuBackground = {
  image: number;
  overlay: GradientLayer;
};

function stop(position: string, alpha: string): GradientStop {
  return {
    color: `rgba(0, 0, 0, ${alpha})`,
    positions: [position],
  };
}

// Hard black through the top three quarters, then the wash from Gradient.jpg
// through to hard white at the bottom edge.
export const defaultScreenGradient: GradientLayer = [
  {
    type: 'linear-gradient',
    direction: 'to bottom',
    colorStops: [
      { color: '#000000', positions: ['0%'] },
      { color: '#000000', positions: ['75%'] },
      { color: '#0F182D', positions: ['79%'] },
      { color: '#293A68', positions: ['82%'] },
      { color: '#38569E', positions: ['85%'] },
      { color: '#4A6BAF', positions: ['88%'] },
      { color: '#6E8ABF', positions: ['91%'] },
      { color: '#A9B7D6', positions: ['94%'] },
      { color: '#E4E8F2', positions: ['97%'] },
      { color: '#FFFFFF', positions: ['100%'] },
    ],
  },
];

// Scrim from PLAN.md user notes. The 0% and 100% stops extend the ramp to the
// edges the same way a CSS linear-gradient does.
export const bonkflixScrim: GradientLayer = [
  {
    type: 'linear-gradient',
    direction: '7deg',
    colorStops: [
      stop('0%', '0.8500'),
      stop('10%', '0.8500'),
      stop('17.25%', '0.8465'),
      stop('24.50%', '0.8361'),
      stop('31.75%', '0.8187'),
      stop('39%', '0.7944'),
      stop('46.25%', '0.7632'),
      stop('53.50%', '0.7250'),
      stop('60.75%', '0.6868'),
      stop('68%', '0.6556'),
      stop('75.25%', '0.6312'),
      stop('82.50%', '0.6139'),
      stop('89.75%', '0.6035'),
      stop('97%', '0.6000'),
      stop('100%', '0.6000'),
    ],
  },
];

/**
 * Screen backgrounds keyed by MenuItem.id.
 * A later theme can replace this map without changing menu items.
 */
export const menuBackgrounds: Readonly<Record<string, MenuBackground>> = {
  bonkflix: {
    image: bonkflixBg,
    overlay: bonkflixScrim,
  },
};
