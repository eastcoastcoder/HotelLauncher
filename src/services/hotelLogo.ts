import { launchImageLibrary } from 'react-native-image-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';

const LOGO_NAME = 'hotel-logo';

export function imageUriForPath(path: string): string {
  if (path.startsWith('file://') || path.startsWith('content://')) {
    return path;
  }
  return `file://${path}`;
}

export function filePathFromUri(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

export function logoFileExtension(
  mime?: string | null,
  fileName?: string | null,
  uri?: string,
): string {
  const fromMime = extensionFromMime(mime);
  if (fromMime != null) {
    return fromMime;
  }
  return (
    extensionFromName(fileName) ??
    extensionFromName(uri?.split('?')[0]) ??
    'jpg'
  );
}

function extensionFromMime(mime?: string | null): string | null {
  if (mime === 'image/png') {
    return 'png';
  }
  if (mime === 'image/webp') {
    return 'webp';
  }
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    return 'jpg';
  }
  return null;
}

function extensionFromName(name?: string | null): string | null {
  if (name == null) {
    return null;
  }
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match?.[1]?.toLowerCase();
  if (ext === 'png' || ext === 'webp' || ext === 'jpg' || ext === 'jpeg') {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return null;
}

async function removeFile(path: string | null): Promise<void> {
  if (path == null || path === '') {
    return;
  }
  const filePath = filePathFromUri(path);
  if (await ReactNativeBlobUtil.fs.exists(filePath)) {
    await ReactNativeBlobUtil.fs.unlink(filePath);
  }
}

/**
 * Copy a gallery file into the app files directory and drop the previous logo.
 * Returns the absolute path to store in AsyncStorage.
 */
export async function importHotelLogo(
  sourceUri: string,
  options: {
    mime?: string | null;
    fileName?: string | null;
    previousPath: string | null;
  },
): Promise<string> {
  const ext = logoFileExtension(options.mime, options.fileName, sourceUri);
  const dest = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${LOGO_NAME}.${ext}`;
  const source = filePathFromUri(sourceUri);
  if (source !== dest) {
    await removeFile(dest);
    if (sourceUri.startsWith('content://')) {
      const data = await ReactNativeBlobUtil.fs.readFile(sourceUri, 'base64');
      await ReactNativeBlobUtil.fs.writeFile(dest, data, 'base64');
    } else {
      await ReactNativeBlobUtil.fs.cp(source, dest);
    }
  }
  if (options.previousPath != null && filePathFromUri(options.previousPath) !== dest) {
    await removeFile(options.previousPath);
  }
  return dest;
}

/** Opens the gallery. Null means the guest cancelled. */
export async function pickHotelLogo(
  previousPath: string | null,
): Promise<string | null> {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: 1,
  });
  if (result.didCancel) {
    return null;
  }
  if (result.errorCode != null) {
    throw new Error(result.errorMessage ?? 'Could not open the gallery');
  }
  const asset = result.assets?.[0];
  if (asset?.uri == null) {
    throw new Error('The gallery did not return an image');
  }
  return importHotelLogo(asset.uri, {
    mime: asset.type,
    fileName: asset.fileName,
    previousPath,
  });
}

export async function clearHotelLogo(path: string | null): Promise<void> {
  await removeFile(path);
}
