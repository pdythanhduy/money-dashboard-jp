/**
 * receipt-storage tests with expo-file-system fully mocked.
 *
 * Mock classes live inside the jest.mock factory to dodge the class TDZ
 * issue that bites if we reference outer classes. We expose a tiny shared
 * registry on globalThis so the tests can assert which paths were created
 * / copied / deleted.
 */

interface Registry {
  dirs: Set<string>;
  files: Set<string>;
  copyCalls: Array<[string, string]>;
  deleteCalls: string[];
  reset: () => void;
}

const REG_KEY = '__receiptStorageRegistry';

jest.mock('expo-file-system', () => {
  const g = globalThis as Record<string, unknown>;
  const reg: Registry = (g[REG_KEY] as Registry | undefined) ?? {
    dirs: new Set<string>(),
    files: new Set<string>(),
    copyCalls: [],
    deleteCalls: [],
    reset() {
      reg.dirs.clear();
      reg.files.clear();
      reg.copyCalls.length = 0;
      reg.deleteCalls.length = 0;
    },
  };
  g[REG_KEY] = reg;

  class Directory {
    uri: string;
    constructor(...parts: unknown[]) {
      this.uri = `dir://${parts.map(String).join('/')}`;
    }
    get exists(): boolean {
      return reg.dirs.has(this.uri);
    }
    create(): void {
      reg.dirs.add(this.uri);
    }
  }

  class File {
    uri: string;
    constructor(...parts: unknown[]) {
      const head = parts[0];
      if (head && typeof head === 'object' && 'uri' in head) {
        this.uri = `${(head as { uri: string }).uri}/${parts.slice(1).join('/')}`;
      } else {
        this.uri = String(head);
      }
    }
    get exists(): boolean {
      return reg.files.has(this.uri);
    }
    copy(dest: { uri: string }): void {
      reg.copyCalls.push([this.uri, dest.uri]);
      reg.files.add(dest.uri);
    }
    delete(): void {
      reg.deleteCalls.push(this.uri);
      reg.files.delete(this.uri);
    }
  }

  return { File, Directory, Paths: { document: 'document-root' } };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `rec-${++n}`) };
});

import {
  deleteReceiptImage,
  ensureReceiptDirectory,
  saveReceiptImage,
} from '@/lib/receipt-storage';

function registry(): Registry {
  return (globalThis as Record<string, unknown>)[REG_KEY] as Registry;
}

beforeEach(() => {
  registry().reset();
});

describe('ensureReceiptDirectory', () => {
  it('creates the receipts directory when missing', async () => {
    await ensureReceiptDirectory();
    expect(registry().dirs.has('dir://document-root/receipts')).toBe(true);
  });

  it('is idempotent — second call does not throw', async () => {
    await ensureReceiptDirectory();
    await expect(ensureReceiptDirectory()).resolves.toBeUndefined();
  });
});

describe('saveReceiptImage', () => {
  it('throws on empty uri', async () => {
    await expect(saveReceiptImage('')).rejects.toThrow(/sourceUri is required/);
  });

  it('copies source into receipts/ and returns the persistent uri', async () => {
    registry().files.add('file:///tmp/picker-abc.jpg');
    const out = await saveReceiptImage('file:///tmp/picker-abc.jpg');
    expect(out).toBe('dir://document-root/receipts/rec-1.jpg');
    expect(registry().copyCalls[0]).toEqual([
      'file:///tmp/picker-abc.jpg',
      'dir://document-root/receipts/rec-1.jpg',
    ]);
  });

  it('honors the source extension (.png stays .png)', async () => {
    registry().files.add('file:///tmp/foo.png');
    const out = await saveReceiptImage('file:///tmp/foo.png');
    expect(out?.endsWith('.png')).toBe(true);
  });
});

describe('deleteReceiptImage', () => {
  it('calls File.delete when the file exists', async () => {
    registry().files.add('dir://document-root/receipts/rec-x.jpg');
    await deleteReceiptImage('dir://document-root/receipts/rec-x.jpg');
    expect(registry().deleteCalls).toContain('dir://document-root/receipts/rec-x.jpg');
  });

  it('no-ops on missing file (no throw)', async () => {
    await expect(deleteReceiptImage('dir://nope.jpg')).resolves.toBeUndefined();
    expect(registry().deleteCalls).toHaveLength(0);
  });
});
