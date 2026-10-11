/** Soft parish search: tokenized, diacritic-insensitive, typo-tolerant. */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function tokenScore(haystack: string, words: string[], token: string): number {
  if (!token) return 1;
  if (haystack.includes(token)) return token.length >= 4 ? 6 : 4;

  let best = 0;
  for (const word of words) {
    if (word.startsWith(token) || token.startsWith(word)) {
      best = Math.max(best, 3);
      continue;
    }
    // Allow one typo on longer tokens; two on very long ones
    const maxDist = token.length >= 6 ? 2 : token.length >= 3 ? 1 : 0;
    if (maxDist > 0 && editDistance(token, word) <= maxDist) {
      best = Math.max(best, 2);
    }
  }
  return best;
}

export type ParishSearchable = {
  name: string;
  city: string;
  state: string;
  jurisdiction?: string | null;
};

export function filterParishesBySearch<T extends ParishSearchable>(
  parishes: T[],
  query: string,
): T[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return parishes;

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const scored: { parish: T; score: number }[] = [];

  for (const parish of parishes) {
    const haystack = normalize(
      [parish.name, parish.city, parish.state, parish.jurisdiction ?? ''].join(' '),
    );
    const words = haystack.split(' ').filter(Boolean);

    let score = 0;
    let matched = true;
    for (const token of tokens) {
      const part = tokenScore(haystack, words, token);
      if (part <= 0) {
        matched = false;
        break;
      }
      score += part;
    }
    if (!matched) continue;

    // Prefer name hits slightly over location-only
    const nameNorm = normalize(parish.name);
    if (tokens.some((t) => nameNorm.includes(t))) score += 2;

    scored.push({ parish, score });
  }

  scored.sort((a, b) => b.score - a.score || a.parish.name.localeCompare(b.parish.name));
  return scored.map((s) => s.parish);
}
