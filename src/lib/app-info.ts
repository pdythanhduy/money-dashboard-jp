/**
 * Static app metadata shown in Settings → About.
 *
 * We don't import `expo-constants` here because it isn't an installed
 * dependency yet (and pulling it in just for two strings inflates the
 * bundle for no gain). Bump these manually on each release; they're
 * mirrored in `app.json` and `package.json`.
 */

export const APP_VERSION = '0.2.0';
export const APP_BUILD = '3';
