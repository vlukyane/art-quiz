const MASK = "*****";

/** Letters with optional stress marks (combining characters) inside a word. */
const WORD_RE =
  /(?:[\p{L}\p{M}]|[\p{N}])+(?:['’\u2019-](?:[\p{L}\p{M}]|[\p{N}])+)*(?:\p{M}+)?/gu;

/** Prepositions and particles — not masked when taken from the phrase. */
const PHRASE_STOP_WORDS = new Set(
  [
    "а",
    "в",
    "во",
    "и",
    "к",
    "ко",
    "на",
    "но",
    "о",
    "об",
    "от",
    "по",
    "с",
    "со",
    "у",
    "за",
    "из",
    "до",
    "не",
    "ни",
    "же",
    "ли",
    "бы",
    "то",
    "что",
    "как",
    "для",
    "при",
    "про",
    "без",
    "над",
    "под",
    "меж",
    "the",
    "a",
    "an",
  ].map((w) => w.toLowerCase()),
);

function normalizeLetters(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]/gi, "");
}

function extractPhraseWords(text: string): string[] {
  const words: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(WORD_RE.source, WORD_RE.flags);

  while ((match = re.exec(text)) !== null) {
    const word = match[0];
    const norm = normalizeLetters(word);
    if (!norm) continue;
    if (/^\d+$/.test(norm)) {
      words.push(word);
      continue;
    }
    if (norm.length < 3) continue;
    if (PHRASE_STOP_WORDS.has(norm)) continue;
    words.push(word);
  }

  return words;
}

function wordsOverlap(phraseWord: string, meaningWord: string): boolean {
  const a = normalizeLetters(phraseWord);
  const b = normalizeLetters(meaningWord);
  if (!a || !b) return false;
  if (a === b) return true;

  const minLen = Math.min(a.length, b.length);
  const stemLen = Math.max(4, minLen - 2);
  return a.slice(0, stemLen) === b.slice(0, stemLen);
}

function isGapOnlyPunctuation(text: string): boolean {
  return /^[\s,.:;!?—–\-«»""''()\[\]{}…\p{M}]*$/u.test(text);
}

function extendLeadingStopWord(meaning: string, start: number): number {
  const before = meaning.slice(0, start);
  const match = before.match(/(?:[«""\[\(]\s*)?([\p{L}\p{M}]+)\s*$/u);
  if (!match) return start;
  if (!PHRASE_STOP_WORDS.has(normalizeLetters(match[1]))) return start;
  return start - match[0].length;
}

function expandRange(meaning: string, start: number, end: number): [number, number] {
  start = extendLeadingStopWord(meaning, start);

  while (end < meaning.length && /\p{M}/u.test(meaning[end])) {
    end++;
  }
  while (start > 0 && /[«""\[\(]/.test(meaning[start - 1])) {
    start--;
  }
  while (end < meaning.length && /[»""\]\)]/.test(meaning[end])) {
    end++;
  }
  return [start, end];
}

function mergeRanges(
  ranges: [number, number][],
  text: string,
): [number, number][] {
  if (ranges.length === 0) return [];

  const expanded = ranges.map(([s, e]) => expandRange(text, s, e));
  const sorted = [...expanded].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [[sorted[0][0], sorted[0][1]]];

  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    const last = merged[merged.length - 1];

    if (start <= last[1] || isGapOnlyPunctuation(text.slice(last[1], start))) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  return merged;
}

function applyMask(meaning: string, ranges: [number, number][]): string {
  const merged = mergeRanges(ranges, meaning);
  if (merged.length === 0) return meaning;

  let result = "";
  let lastEnd = 0;

  for (const [start, end] of merged) {
    result += meaning.slice(lastEnd, start);
    result += MASK;
    lastEnd = end;
  }
  result += meaning.slice(lastEnd);

  return result
    .replace(/(\*{5}\s*)+/g, `${MASK} `)
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Hides phrase words and overlapping forms in the definition text. */
export function maskPhraseologismMeaning(
  phrase: string,
  meaning: string,
): string {
  const phraseWords = extractPhraseWords(phrase);
  if (phraseWords.length === 0) return meaning;

  const ranges: [number, number][] = [];

  let match: RegExpExecArray | null;
  const re = new RegExp(WORD_RE.source, WORD_RE.flags);
  while ((match = re.exec(meaning)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    if (phraseWords.some((pw) => wordsOverlap(pw, word))) {
      ranges.push([start, end]);
    }
  }

  return applyMask(meaning, ranges);
}
