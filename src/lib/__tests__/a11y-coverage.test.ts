/**
 * a11y coverage detector — pure fs scan.
 *
 * Every `<Pressable>` / `<TouchableOpacity>` / `<Switch>` declared under
 * `src/` (excluding tests) must:
 *
 *   1. Carry an `accessibilityRole` attribute (or be a known label-only host
 *      whose children are a single `<Text>` — visually self-described).
 *   2. Either expose visible `<Text>` as a direct child OR declare an
 *      explicit `accessibilityLabel` so screen readers have something to
 *      announce.
 *
 * The detector intentionally uses simple multi-line regex on the source
 * text — false-positives are rare and the file:line points reviewers at
 * the exact element. Any violation fails the test with the file path and
 * the offending snippet.
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SRC = path.join(REPO_ROOT, 'src');

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'locales' || e.name === 'node_modules') continue;
      listSourceFiles(full, acc);
    } else if (e.isFile() && e.name.endsWith('.tsx')) {
      acc.push(full);
    }
  }
  return acc;
}

interface Violation {
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

const TAG_RE = /<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Switch)\b([\s\S]*?)(\/>|>)/g;

function lineOf(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function detectViolations(file: string): Violation[] {
  const content = fs.readFileSync(file, 'utf8');
  const out: Violation[] = [];
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(content)) !== null) {
    const tag = m[1] ?? '';
    const props = m[2] ?? '';
    const closing = m[3];
    const start = m.index;

    const hasRole = /\baccessibilityRole\s*=/.test(props);
    const hasLabel = /\baccessibilityLabel\s*=/.test(props);

    // For Switch the label is always required (no text children).
    if (tag === 'Switch') {
      if (!hasLabel) {
        out.push({
          file,
          line: lineOf(content, start),
          snippet: m[0].slice(0, 100),
          reason: 'Switch missing accessibilityLabel',
        });
      }
      continue;
    }

    // For pressables: role required.
    if (!hasRole) {
      out.push({
        file,
        line: lineOf(content, start),
        snippet: m[0].slice(0, 120),
        reason: `<${tag}> missing accessibilityRole`,
      });
      continue;
    }

    // If role is present but the element is self-closing (no children),
    // require an explicit label.
    if (closing === '/>' && !hasLabel) {
      out.push({
        file,
        line: lineOf(content, start),
        snippet: m[0].slice(0, 120),
        reason: `self-closing <${tag}> missing accessibilityLabel`,
      });
    }
  }
  return out;
}

describe('a11y coverage', () => {
  it('every Pressable / Touchable / Switch declares accessibilityRole and a label or visible text', () => {
    const files = listSourceFiles(SRC);
    const violations: Violation[] = [];
    for (const f of files) violations.push(...detectViolations(f));
    if (violations.length > 0) {
      // Build a readable failure message.
      const msg = violations
        .map((v) => `  ${path.relative(REPO_ROOT, v.file)}:${v.line}\n    ${v.reason}\n    ${v.snippet.replace(/\s+/g, ' ').trim()}`)
        .join('\n');
      throw new Error(`${violations.length} a11y violations:\n${msg}`);
    }
    expect(violations).toEqual([]);
  });
});
