/**
 * Strict-mode detector — pure fs scan (no Babel/TS parsing).
 *
 * Bans two regressions:
 *   1. `: any` type annotations in `src/` outside `__tests__/`. Tests are
 *      allowed because Jest mocks frequently need `any` for cross-module
 *      stubs. An escape hatch comment `// allow-any` on the same line lets
 *      reviewers explicitly opt out.
 *   2. `@ts-ignore` / `@ts-expect-error` directives outside an
 *      explicit whitelist.
 *
 * Simple multi-line regex over the source text — false-positives are rare
 * and the file:line points to the offending location. If a violation is
 * unavoidable, prefer fixing it; otherwise add to ALLOWED_FILES with a
 * one-line justification comment.
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(REPO_ROOT, 'src');

/**
 * Files explicitly allowed to use `any` or ts-ignore directives.
 * KEEP THIS LIST SMALL — every entry is technical debt.
 */
const ALLOWED_FILES = new Set<string>([
  // (empty — add `path/relative/from/src/file.ts` with justification if needed)
]);

const ESCAPE_HATCH = /\/\/\s*allow-any\b/;

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'locales' || e.name === 'node_modules') continue;
      listSourceFiles(full, acc);
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      acc.push(full);
    }
  }
  return acc;
}

interface Violation {
  file: string;
  line: number;
  reason: string;
  snippet: string;
}

function isAllowed(file: string): boolean {
  const rel = path.relative(SRC, file).replaceAll('\\', '/');
  return ALLOWED_FILES.has(rel);
}

/**
 * Match `: any` as a type annotation. We exclude:
 *   - `: any[]` and `: any<` cases too (still flagged — they're real anys)
 *   - inside strings / comments — handled by simple state-machine below
 *   - words like `Company`, `Many`, `anything` (the \b at end is the guard)
 */
function findAnyAnnotations(content: string): Array<{ line: number; snippet: string }> {
  const out: Array<{ line: number; snippet: string }> = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    // Skip lines that opt out explicitly.
    if (ESCAPE_HATCH.test(raw)) continue;
    // Strip line-comments and string contents (rough — but sufficient for our codebase
    // which doesn't write `: any` inside string literals).
    const stripped = raw.replace(/\/\/.*$/, '').replace(/(['"`])(?:\\.|(?!\1).)*\1/g, '""');
    if (/:\s*any\b/.test(stripped)) {
      out.push({ line: i + 1, snippet: raw.trim().slice(0, 120) });
    }
  }
  return out;
}

function findTsDirectives(content: string): Array<{ line: number; snippet: string }> {
  const out: Array<{ line: number; snippet: string }> = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? '';
    if (/@ts-ignore\b|@ts-expect-error\b/.test(raw)) {
      out.push({ line: i + 1, snippet: raw.trim().slice(0, 120) });
    }
  }
  return out;
}

describe('strict-mode detector', () => {
  const files = listSourceFiles(SRC);

  it('no `: any` annotations in src/ (outside __tests__/, unless `// allow-any`)', () => {
    const violations: Violation[] = [];
    for (const file of files) {
      if (isAllowed(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      for (const v of findAnyAnnotations(content)) {
        violations.push({
          file,
          line: v.line,
          snippet: v.snippet,
          reason: '`: any` annotation',
        });
      }
    }
    if (violations.length > 0) {
      const msg = violations
        .map(
          (v) =>
            `  ${path.relative(REPO_ROOT, v.file)}:${v.line}\n    ${v.reason}\n    ${v.snippet}`,
        )
        .join('\n');
      throw new Error(`${violations.length} strict-mode violations:\n${msg}`);
    }
    expect(violations).toEqual([]);
  });

  it('no `@ts-ignore` / `@ts-expect-error` directives outside the whitelist', () => {
    const violations: Violation[] = [];
    for (const file of files) {
      if (isAllowed(file)) continue;
      const content = fs.readFileSync(file, 'utf8');
      for (const v of findTsDirectives(content)) {
        violations.push({
          file,
          line: v.line,
          snippet: v.snippet,
          reason: 'TypeScript error suppression',
        });
      }
    }
    if (violations.length > 0) {
      const msg = violations
        .map(
          (v) =>
            `  ${path.relative(REPO_ROOT, v.file)}:${v.line}\n    ${v.reason}\n    ${v.snippet}`,
        )
        .join('\n');
      throw new Error(`${violations.length} suppression-directive violations:\n${msg}`);
    }
    expect(violations).toEqual([]);
  });
});
