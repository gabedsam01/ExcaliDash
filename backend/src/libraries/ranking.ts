/**
 * Deterministic search ranking for curated + public libraries.
 *
 * Scoring order (highest signal first), per the product spec:
 *   1. Exact name match
 *   2. Alias match
 *   3. Name starts with query
 *   4. Name contains query
 *   5. itemNames match
 *   6. description match
 *   7. curated priority boost
 *   8. specialized category boost
 *   9. updated/version boost (tie-breaker only)
 *
 * `scoreLibrary` is pure and unit-tested. Pool selection and the
 * core > specialized > public precedence for mode=all live in the services.
 */
import { normalizeName } from "./validators";

export interface RankableLibrary {
  name: string;
  description?: string | null;
  itemNames?: string[] | null;
  aliases?: string[] | null;
  curated?: boolean;
  category?: string | null;
  version?: number | null;
  updatedDate?: Date | string | null;
  /** Pack-membership priority (small additive boost). */
  priority?: number | null;
}

export interface ScoreOptions {
  /** Apply the curated boost. Disabled for mode=public. Default: true. */
  applyCuratedBoost?: boolean;
  /** When set, libraries in this category receive the category boost. */
  category?: string | null;
}

// Match weights. Kept as named constants so tests can assert relative order.
const SCORE_EXACT_NAME = 1000;
const SCORE_ALIAS_EXACT = 800;
const SCORE_NAME_STARTS_WITH = 500;
const SCORE_NAME_CONTAINS = 300;
const SCORE_ALIAS_STARTS_WITH = 250;
const SCORE_ITEM_EXACT = 200;
const SCORE_ALIAS_CONTAINS = 150;
const SCORE_ITEM_STARTS_WITH = 150;
const SCORE_ITEM_CONTAINS = 120;
const SCORE_DESCRIPTION = 60;
const BOOST_CURATED = 200;
const BOOST_CATEGORY = 80;

const toTime = (value: Date | string | null | undefined): number => {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

/** Compute a deterministic relevance score for a single library. */
export const scoreLibrary = (
  query: string,
  library: RankableLibrary,
  options: ScoreOptions = {},
): number => {
  const applyCuratedBoost = options.applyCuratedBoost !== false;
  const q = normalizeName(query ?? "");
  let score = 0;

  if (q.length > 0) {
    const name = normalizeName(library.name);
    const aliases = (library.aliases ?? []).map(normalizeName);
    const items = (library.itemNames ?? []).map(normalizeName);
    const description = normalizeName(library.description ?? "");

    if (name === q) score += SCORE_EXACT_NAME;
    else if (aliases.includes(q)) score += SCORE_ALIAS_EXACT;
    else if (name.startsWith(q)) score += SCORE_NAME_STARTS_WITH;
    else if (name.includes(q)) score += SCORE_NAME_CONTAINS;
    else if (aliases.some((alias) => alias.startsWith(q)))
      score += SCORE_ALIAS_STARTS_WITH;
    else if (aliases.some((alias) => alias.includes(q)))
      score += SCORE_ALIAS_CONTAINS;

    if (items.includes(q)) score += SCORE_ITEM_EXACT;
    else if (items.some((item) => item.startsWith(q)))
      score += SCORE_ITEM_STARTS_WITH;
    else if (items.some((item) => item.includes(q)))
      score += SCORE_ITEM_CONTAINS;

    if (description.length > 0 && description.includes(q))
      score += SCORE_DESCRIPTION;
  }

  if (applyCuratedBoost && library.curated) score += BOOST_CURATED;
  if (options.category && library.category === options.category)
    score += BOOST_CATEGORY;

  score += library.priority ?? 0;

  // Tie-breakers: never large enough to overturn a real match.
  score += Math.min(library.version ?? 0, 99) * 0.5;
  const updated = toTime(library.updatedDate);
  if (updated > 0) score += updated / 1e15;

  return score;
};

/**
 * Rank a homogeneous list (e.g. one pool) and return a new sorted array.
 * Stable and fully deterministic.
 */
export const rankLibraries = <T extends RankableLibrary>(
  query: string,
  libraries: T[],
  options: ScoreOptions = {},
): T[] => {
  return libraries
    .map((library, index) => ({
      library,
      index,
      score: scoreLibrary(query, library, options),
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(Boolean(b.library.curated)) -
          Number(Boolean(a.library.curated)) ||
        (b.library.priority ?? 0) - (a.library.priority ?? 0) ||
        normalizeName(a.library.name).localeCompare(
          normalizeName(b.library.name),
        ) ||
        a.index - b.index,
    )
    .map((entry) => entry.library);
};

/**
 * True if a library matches the query at all (any positive match component).
 * Used to drop irrelevant rows when a non-empty query is provided.
 */
export const matchesQuery = (
  query: string,
  library: RankableLibrary,
): boolean => {
  const q = normalizeName(query ?? "");
  if (q.length === 0) return true;
  const name = normalizeName(library.name);
  if (name.includes(q)) return true;
  if ((library.aliases ?? []).some((alias) => normalizeName(alias).includes(q)))
    return true;
  if (
    (library.itemNames ?? []).some((item) => normalizeName(item).includes(q))
  )
    return true;
  if (normalizeName(library.description ?? "").includes(q)) return true;
  return false;
};
