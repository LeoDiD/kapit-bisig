import * as MediaLibrary from 'expo-media-library/legacy';
import { captureRef, type CaptureOptions } from 'react-native-view-shot';

type CapturableView = Parameters<typeof captureRef>[0];

export type SaveViewToMediaLibraryResult = 'saved' | 'permission-denied';

/**
 * Captures a React Native view as a PNG and adds it to the device's photo library.
 * Both APIs used here are bundled with Expo Go, so this works in Expo Go as well
 * as development and production builds.
 */
export async function saveViewToMediaLibrary(
  view: CapturableView,
  captureOptions: CaptureOptions = {},
): Promise<SaveViewToMediaLibraryResult> {
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) return 'permission-denied';

  const uri = await captureRef(view, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
    ...captureOptions,
  });

  await MediaLibrary.createAssetAsync(uri);
  return 'saved';
}
