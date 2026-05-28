/**
 * i18n cross-language purity detector.
 *
 * vi.json values must not contain Japanese characters except whitelisted
 * Japanese technical tax / domain terms (税法用語 that have no Vietnamese
 * equivalent in this audience's vocabulary). Symmetric check for ja.json.
 *
 * Implementation: pure fs scan + Unicode regex — no parser, no i18next.
 *
 * Whitelist policy: keep it small. Each entry is a Japanese phrase that
 * Vietnamese-in-Japan users routinely encounter in tax/HR contexts and
 * recognize even when reading Vietnamese copy. If you find yourself
 * wanting to add a long phrase, prefer rewording the i18n value instead.
 */

import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const VI = path.join(REPO_ROOT, 'src/locales/vi.json');
const JA = path.join(REPO_ROOT, 'src/locales/ja.json');

const JAPANESE_CHAR_RE = /[぀-ゟ゠-ヿ㐀-䶿一-鿿豈-﫿]/;
// Vietnamese diacritic letters (Latin Extended ranges + composed VN forms).
const VIETNAMESE_DIACRITIC_RE =
  /[ăâêôơưđĂÂÊÔƠƯĐàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵằắẳẵặầấẩẫậềếểễệồốổỗộờớởỡợừứửữựÀÁẢÃẠÈÉẺẼẸÌÍỈĨỊÒÓỎÕỌÙÚỦŨỤỲÝỶỸỴẰẮẲẴẶẦẤẨẪẬỀẾỂỄỆỒỐỔỖỘỜỚỞỠỢỪỨỬỮỰ]/;

/**
 * Japanese tokens allowed inside vi.json values. These are tax / HR /
 * documents terms VN users encounter on payslips and government forms.
 */
const JA_ALLOWED_IN_VI = [
  // Tax instruments (compounds — list LONGEST first to win the strip race)
  '青色申告特別控除', '配偶者特別控除', '社会保険料控除', '生命保険料控除',
  '地震保険料控除', '給与所得控除', '勤労学生控除',
  '小規模企業共済等掛金控除', '小規模企業共済',
  '一般生命保険料', '介護医療保険料', '個人年金保険料', '生命保険料', '地震保険料', '地震保険',
  '所得税', '住民税', '健康保険', '介護保険', '厚生年金', '国民年金', '雇用保険',
  '基礎控除', '配偶者控除', '扶養控除', '医療費控除',
  '社会保険', '社保', '国税',
  '課税所得', '所得控除', '所得割', '均等割', '森林環境税',
  '給与所得', '事業所得', '雑所得',
  '標準報酬月額', '標準賞与額', '復興特別所得税', '復興税',
  '青色申告', '白色申告',
  '配偶者扶養', '配偶者', '扶養', '控除',
  '寄付', '寄付金',
  // Payslip line items VN-in-JP workers see monthly
  '月給', '賞与', '基本給', 'ボーナス',
  // Filing / annual events
  '寄付金受領証明書', '源泉徴収票', '海外送金',
  '確定申告', '年末調整', '源泉徴収', '暦年贈与', '贈与税',
  // Geography
  '都道府県', '市区町村', '国民健康保険',
  '東京都', '大阪府', '神奈川県', '埼玉県', '千葉県', '兵庫県', '福岡県', '愛知県', '京都府',
  '東京', '大阪', '愛知', '神奈川', '埼玉', '千葉', '兵庫', '福岡', '京都',
  '23区', '東京23区',
  // All 47 prefecture short-names (after `県/府/都/道` is stripped) — 0.3+
  // calculator now supports the full set. Listed in 都道府県コード order.
  '北海道',
  '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬',
  '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '三重',
  '滋賀', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '広島', '山口',
  '徳島', '香川', '愛媛', '高知',
  '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄',
  // Civic / admin suffixes (used in proper-noun labels we render literally)
  '都', '府', '県', '道', '市', '区', '町', '村',
  // Documents
  '在留カード', 'マイナンバーカード', 'マイナンバー', '健康保険証', '運転免許',
  '永住権', '住民票', '在留', '通知書',
  // Domain words VN-in-JP users use untranslated
  'ふるさと納税', '仕送り', '家計簿', '給料日', '時給制', '深夜手当', '残業',
  '週末勤務', 'アルバイト', '正社員', 'フリーランス', '塾の講師', '夜勤',
  '手取り', '月収手取り', '年収手取り', '月収', '年収',
  '医療費', '新制度', '自治体', '税理士', 'その他',
  '配偶者扶養', '〇〇クリニック', 'クリニック',
  // Medical category tags (rendered as bilingual: "Khám bệnh (通院)")
  '通院', '入院', '薬局', '歯科', '眼科', '出産', '交通費',
  // Calendar / era
  '令和', '令和7年', '令和8年', '令和9年', '令和7年12月',
  '年12月', '月', '年', '日',
  // 万円の壁 (wage walls — proper noun concept)
  '103万', '106万', '130万', '150万', '160万', '201万', '万円', 'の壁',
  '壁', '万', '110万', '円',
  // Insurance shorthands used by VN speakers
  '健保', '国保', '加入', '厚年',
  // Gift / produce examples in placeholders
  '和牛', 'お米',
  // Brand / logo
  '家計', '履歴', 'アプリ', '日本語',
  // Portal names
  'さとふる', '楽天ふるさと', 'ふるなび', 'セブン銀行',
  // Bracket markers used in some labels
  '「', '」',
  // Currency / unit symbol shared across languages
  '¥',
];

/**
 * Vietnamese tokens allowed inside ja.json values. The only legitimate
 * case is self-referential language names (e.g. "Tiếng Việt" displayed
 * to identify the Vietnamese-language option in the language picker).
 */
const VI_ALLOWED_IN_JA = ['Tiếng Việt'];

function flattenLeaves(node: unknown, prefix = '', out: Record<string, string> = {}): Record<string, string> {
  if (node === null) return out;
  if (typeof node !== 'object') {
    out[prefix] = String(node);
    return out;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    flattenLeaves(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

/**
 * Strip every whitelisted Japanese phrase from `value` (longest first to
 * avoid the "国民年金" / "年金" overlap problem). If the remainder still
 * contains Japanese characters, those are the offending tokens.
 */
function residualJapanese(value: string): string {
  let s = value;
  // Longest first.
  const tokens = [...JA_ALLOWED_IN_VI].sort((a, b) => b.length - a.length);
  for (const tok of tokens) {
    while (s.includes(tok)) s = s.replace(tok, '');
  }
  return s;
}

interface Violation {
  key: string;
  value: string;
  offending: string;
}

describe('i18n cross-language purity', () => {
  const viLeaves = flattenLeaves(JSON.parse(fs.readFileSync(VI, 'utf8')));
  const jaLeaves = flattenLeaves(JSON.parse(fs.readFileSync(JA, 'utf8')));

  it('vi.json values contain no Japanese characters except whitelisted tax terms', () => {
    const violations: Violation[] = [];
    for (const [key, value] of Object.entries(viLeaves)) {
      if (!JAPANESE_CHAR_RE.test(value)) continue;
      const residue = residualJapanese(value);
      const offending = (residue.match(new RegExp(JAPANESE_CHAR_RE.source, 'g')) ?? []).join('');
      if (offending.length > 0) {
        violations.push({ key, value, offending });
      }
    }
    if (violations.length > 0) {
      const msg = violations
        .map((v) => `  ${v.key}\n    offending JA: ${v.offending}\n    value: ${v.value}`)
        .join('\n');
      throw new Error(`${violations.length} vi.json leaks:\n${msg}`);
    }
    expect(violations).toEqual([]);
  });

  it('ja.json values contain no Vietnamese-diacritic characters', () => {
    const violations: Violation[] = [];
    for (const [key, value] of Object.entries(jaLeaves)) {
      let stripped = value;
      for (const tok of VI_ALLOWED_IN_JA) {
        while (stripped.includes(tok)) stripped = stripped.replace(tok, '');
      }
      const m = stripped.match(new RegExp(VIETNAMESE_DIACRITIC_RE.source, 'g'));
      if (m && m.length > 0) {
        violations.push({ key, value, offending: m.join('') });
      }
    }
    if (violations.length > 0) {
      const msg = violations
        .map((v) => `  ${v.key}\n    offending VI diacritics: ${v.offending}\n    value: ${v.value}`)
        .join('\n');
      throw new Error(`${violations.length} ja.json leaks:\n${msg}`);
    }
    expect(violations).toEqual([]);
  });
});
