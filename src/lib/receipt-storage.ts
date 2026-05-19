/**
 * Local-only receipt image management.
 *
 * Images picked from camera or gallery are temp files the OS may garbage
 * collect. We copy them into our app's document directory under
 * `receipts/<uuid>.jpg` so they survive across sessions and are wiped on
 * uninstall. Nothing leaves the device — `expo-file-system` provides
 * sandboxed paths only.
 *
 * Native module loaded lazily inside try/catch so jest / web bundles stay
 * importable (helpers become no-ops there).
 */

import * as Crypto from 'expo-crypto';

type FileSystemAPI = typeof import('expo-file-system');

let FS: FileSystemAPI | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  FS = require('expo-file-system') as FileSystemAPI;
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[receipt-storage] expo-file-system unavailable — receipts stay in temp', err);
}

const RECEIPTS_FOLDER = 'receipts';

/**
 * Ensure the receipts/ directory exists under the app's document root.
 * Idempotent.
 */
export async function ensureReceiptDirectory(): Promise<void> {
  if (!FS) return;
  try {
    const dir = new FS.Directory(FS.Paths.document, RECEIPTS_FOLDER);
    if (!dir.exists) dir.create();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[receipt-storage] mkdir failed', err);
  }
}

/**
 * Copy a picker-provided temp URI into our document directory and return
 * the persistent `file://` URI. Throws on empty input. Returns null when
 * the native module is unavailable.
 */
export async function saveReceiptImage(sourceUri: string): Promise<string | null> {
  if (!sourceUri || sourceUri.trim() === '') {
    throw new Error('saveReceiptImage: sourceUri is required');
  }
  if (!FS) return null;
  try {
    await ensureReceiptDirectory();
    const ext = guessExtension(sourceUri);
    const filename = `${Crypto.randomUUID()}.${ext}`;
    const source = new FS.File(sourceUri);
    const destDir = new FS.Directory(FS.Paths.document, RECEIPTS_FOLDER);
    const dest = new FS.File(destDir, filename);
    source.copy(dest);
    return dest.uri;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[receipt-storage] saveReceiptImage failed', err);
    return null;
  }
}

/**
 * Delete a persisted receipt file. Silent on missing — callers can call
 * this defensively before re-saving a new image.
 */
export async function deleteReceiptImage(uri: string): Promise<void> {
  if (!FS) return;
  if (!uri) return;
  try {
    const file = new FS.File(uri);
    if (file.exists) file.delete();
  } catch (err) {
    // Best-effort cleanup — never blocks UI.
    // eslint-disable-next-line no-console
    console.warn('[receipt-storage] deleteReceiptImage failed', err);
  }
}

function guessExtension(uri: string): string {
  const match = uri.match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
  return match?.[1]?.toLowerCase() ?? 'jpg';
}
