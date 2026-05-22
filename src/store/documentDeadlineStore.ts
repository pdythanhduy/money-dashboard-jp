/**
 * Persisted list of `DocumentDeadline`s — the canonical source for
 * Dashboard upcoming-reminder UI.
 *
 * Capped at MAX_DOCUMENT_DEADLINES. Validation is light: we trust
 * the UI to pass YYYY-MM-DD strings (a regex check in `addDocumentDeadline`
 * normalises obviously-bad input to today's date, not silently dropping).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DocumentDeadline, DocumentType } from '@/types/document-deadline';

export const MAX_DOCUMENT_DEADLINES = 50;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeIsoDate(input: string): string {
  if (ISO_DATE_RE.test(input)) return input;
  // Try Date parse; if that yields a valid date, format back to YYYY-MM-DD.
  const d = new Date(input);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  // Fallback: today.
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export interface AddDocumentDeadlineResult {
  added: boolean;
  document?: DocumentDeadline;
  reason?: 'limit_reached';
}

interface AddInput {
  type: DocumentType;
  title: string;
  expiryDate: string;
  remindBeforeDays: number;
  note?: string;
}

interface DocumentDeadlineStore {
  documents: DocumentDeadline[];

  addDocumentDeadline: (input: AddInput) => AddDocumentDeadlineResult;
  updateDocumentDeadline: (
    id: string,
    partial: Partial<Omit<DocumentDeadline, 'id' | 'createdAt'>>,
  ) => void;
  removeDocumentDeadline: (id: string) => void;
  clearDocumentDeadlines: () => void;
  getDocumentDeadline: (id: string) => DocumentDeadline | undefined;
}

function sortByExpiry(list: DocumentDeadline[]): DocumentDeadline[] {
  return [...list].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

export const useDocumentDeadlineStore = create<DocumentDeadlineStore>()(
  persist(
    (set, get) => ({
      documents: [],

      addDocumentDeadline: (input) => {
        const current = get().documents;
        if (current.length >= MAX_DOCUMENT_DEADLINES) {
          return { added: false, reason: 'limit_reached' };
        }
        const nowIso = new Date().toISOString();
        const doc: DocumentDeadline = {
          id: Crypto.randomUUID(),
          type: input.type,
          title: input.title,
          expiryDate: normalizeIsoDate(input.expiryDate),
          remindBeforeDays: input.remindBeforeDays,
          createdAt: nowIso,
          updatedAt: nowIso,
          ...(input.note ? { note: input.note } : {}),
        };
        set({ documents: sortByExpiry([...current, doc]) });
        return { added: true, document: doc };
      },

      updateDocumentDeadline: (id, partial) => {
        set({
          documents: sortByExpiry(
            get().documents.map((d) =>
              d.id === id
                ? {
                    ...d,
                    ...partial,
                    ...(partial.expiryDate
                      ? { expiryDate: normalizeIsoDate(partial.expiryDate) }
                      : {}),
                    updatedAt: new Date().toISOString(),
                  }
                : d,
            ),
          ),
        });
      },

      removeDocumentDeadline: (id) => {
        set({ documents: get().documents.filter((d) => d.id !== id) });
      },

      clearDocumentDeadlines: () => set({ documents: [] }),

      getDocumentDeadline: (id) => get().documents.find((d) => d.id === id),
    }),
    {
      name: 'kakei-document-deadlines-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ documents: state.documents }),
    },
  ),
);
