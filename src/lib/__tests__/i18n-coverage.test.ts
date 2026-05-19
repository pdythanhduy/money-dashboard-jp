/**
 * i18n coverage detector — pure node fs scan, no React/Jest-render needed.
 *
 * Two contracts:
 *   1. vi.json and ja.json must declare the exact same set of leaf paths.
 *   2. Every literal `t('foo.bar')` / `t("foo.bar")` site in src/ must
 *      resolve to a real leaf path in vi.json (and thus, by 1, in ja.json).
 *
 * Dynamic-key sites like `t(\`calculator.prefectures.${p}.label\`)` cannot
 * be statically checked here — they are intentionally ignored. If a future
 * dynamic key is missing the runtime fallback shows the literal key, which
 * is loud enough during manual QA.
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(REPO_ROOT, 'src');
const VI = path.join(SRC, 'locales/vi.json');
const JA = path.join(SRC, 'locales/ja.json');

type LeafMap = Record<string, true>;

function flattenLeaves(node: unknown, prefix = '', out: LeafMap = {}): LeafMap {
  if (node === null || typeof node !== 'object') {
    out[prefix] = true;
    return out;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    flattenLeaves(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // skip tests + locales + node_modules
      if (e.name === '__tests__' || e.name === 'locales' || e.name === 'node_modules') continue;
      listSourceFiles(full, acc);
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      acc.push(full);
    }
  }
  return acc;
}

const T_CALL_RE = /\bt\(\s*(?:'([^'\\]+)'|"([^"\\]+)")\s*[,)]/g;

function extractKeys(content: string): string[] {
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = T_CALL_RE.exec(content)) !== null) {
    const key = m[1] ?? m[2];
    if (key && /^[a-zA-Z][a-zA-Z0-9_.]+$/.test(key)) keys.push(key);
  }
  return keys;
}

describe('i18n coverage', () => {
  const vi = JSON.parse(fs.readFileSync(VI, 'utf8'));
  const ja = JSON.parse(fs.readFileSync(JA, 'utf8'));
  const viLeaves = flattenLeaves(vi);
  const jaLeaves = flattenLeaves(ja);

  it('vi.json and ja.json have identical leaf-key sets', () => {
    const onlyInVi = Object.keys(viLeaves).filter((k) => !jaLeaves[k]).sort();
    const onlyInJa = Object.keys(jaLeaves).filter((k) => !viLeaves[k]).sort();
    expect({ onlyInVi, onlyInJa }).toEqual({ onlyInVi: [], onlyInJa: [] });
  });

  it('every literal t() call in src/ resolves to a real key in vi.json', () => {
    const files = listSourceFiles(SRC);
    const usedKeys = new Set<string>();
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const k of extractKeys(content)) usedKeys.add(k);
    }
    const missing = [...usedKeys].filter((k) => !viLeaves[k]).sort();
    expect(missing).toEqual([]);
  });
});
