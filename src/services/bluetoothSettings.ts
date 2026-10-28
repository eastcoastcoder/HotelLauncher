import { Linking, Platform } from 'react-native';

// Sony's connected-devices activity is the HDMI input setup dialog. The
// headphones list lives in the TV settings accessories slice.
const ACCESSORIES_SLICE =
  'content://com.android.tv.settings.accessories.sliceprovider/general';

export async function openHeadphoneSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    await Linking.sendIntent('android.settings.SLICE_SETTINGS', [
      { key: 'slice_uri', value: ACCESSORIES_SLICE },
    ]);
    return true;
  } catch (error) {
    console.warn('Could not open headphone settings:', error);
    return false;
  }
}
