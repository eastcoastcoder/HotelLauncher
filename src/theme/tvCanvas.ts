import { Platform, useWindowDimensions } from 'react-native';

const TV_CANVAS_SCALE =
  Platform.OS === 'ios' && Platform.isTV ? 2 : 1;

export function useTVCanvasDimensions() {
  const { width, height } = useWindowDimensions();
  return {
    width: width / TV_CANVAS_SCALE,
    height: height / TV_CANVAS_SCALE,
    scale: TV_CANVAS_SCALE,
  };
}
