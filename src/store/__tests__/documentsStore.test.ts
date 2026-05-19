jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(storage[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        storage[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete storage[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `doc-${++n}`) };
});

import { DEFAULT_NOTIFY_DAYS, MAX_DOCUMENTS, useDocumentsStore } from '@/store/documentsStore';

beforeEach(() => {
  useDocumentsStore.setState({ documents: [] });
});

describe('documentsStore.addDocument', () => {
  it('returns added=true with crypto id and ISO expiry preserved', () => {
    const r = useDocumentsStore.getState().addDocument({
      kind: 'zairyu_card',
      expiryDate: '2027-03-15',
    });
    expect(r.added).toBe(true);
    expect(r.document?.id).toMatch(/^doc-/);
    expect(r.document?.expiryDate).toBe('2027-03-15');
    expect(r.document?.notifyDaysBefore).toEqual([...DEFAULT_NOTIFY_DAYS]);
  });

  it('honors custom notifyDaysBefore when provided', () => {
    const r = useDocumentsStore.getState().addDocument({
      kind: 'passport_vn',
      expiryDate: '2030-01-01',
      notifyDaysBefore: [90, 14],
    });
    expect(r.document?.notifyDaysBefore).toEqual([90, 14]);
  });

  it('refuses past MAX_DOCUMENTS', () => {
    const store = useDocumentsStore.getState();
    for (let i = 0; i < MAX_DOCUMENTS; i++) {
      store.addDocument({ kind: 'mynumber_card', expiryDate: '2030-01-01' });
    }
    const r = store.addDocument({ kind: 'driving_license_jp', expiryDate: '2030-01-01' });
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useDocumentsStore.getState().documents).toHaveLength(MAX_DOCUMENTS);
  });
});

describe('documentsStore.updateDocument', () => {
  it('mutates only matching id', () => {
    const { addDocument, updateDocument } = useDocumentsStore.getState();
    const a = addDocument({ kind: 'zairyu_card', expiryDate: '2027-01-01' }).document!;
    const b = addDocument({ kind: 'passport_vn', expiryDate: '2030-01-01' }).document!;
    updateDocument(a.id, { customName: 'My zairyu' });
    const found = useDocumentsStore.getState().getDocument(a.id);
    expect(found?.customName).toBe('My zairyu');
    const other = useDocumentsStore.getState().getDocument(b.id);
    expect(other?.customName).toBeUndefined();
  });
});

describe('documentsStore.removeDocument + clearAll', () => {
  it('remove deletes one entry; clearAll wipes', () => {
    const { addDocument, removeDocument, clearAll } = useDocumentsStore.getState();
    const a = addDocument({ kind: 'zairyu_card', expiryDate: '2027-01-01' }).document!;
    addDocument({ kind: 'passport_vn', expiryDate: '2030-01-01' });
    removeDocument(a.id);
    expect(useDocumentsStore.getState().documents).toHaveLength(1);
    clearAll();
    expect(useDocumentsStore.getState().documents).toEqual([]);
  });
});

describe('documentsStore.getDocument', () => {
  it('returns undefined for missing id', () => {
    expect(useDocumentsStore.getState().getDocument('nope')).toBeUndefined();
  });
});
