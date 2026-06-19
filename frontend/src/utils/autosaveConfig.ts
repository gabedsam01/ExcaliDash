/**
 * Autosave timing, configurable via Vite env vars:
 *   VITE_AUTOSAVE_DEBOUNCE_MS  (default 1500) — group rapid edits into one save.
 *   VITE_AUTOSAVE_MAX_WAIT_MS  (default 10000) — guarantee a save at least this
 *                               often during continuous editing.
 *
 * Values are clamped to sane bounds, and maxWait is always >= debounce so the
 * debounce can actually fire.
 */
export const AUTOSAVE_DEFAULT_DEBOUNCE_MS = 1500;
export const AUTOSAVE_DEFAULT_MAX_WAIT_MS = 10000;

const MIN_DEBOUNCE_MS = 200;
const MAX_DEBOUNCE_MS = 60_000;
const MAX_MAX_WAIT_MS = 120_000;

type EnvLike = Record<string, unknown> | undefined;

const parseClampedInt = (
  raw: unknown,
  fallback: number,
  min: number,
  max: number,
): number => {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
};

const resolveEnv = (env?: EnvLike): Record<string, unknown> => {
  if (env) return env;
  try {
    return (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
  } catch {
    return {};
  }
};

export const getAutosaveDebounceMs = (env?: EnvLike): number =>
  parseClampedInt(
    resolveEnv(env).VITE_AUTOSAVE_DEBOUNCE_MS,
    AUTOSAVE_DEFAULT_DEBOUNCE_MS,
    MIN_DEBOUNCE_MS,
    MAX_DEBOUNCE_MS,
  );

export const getAutosaveMaxWaitMs = (env?: EnvLike): number => {
  const debounce = getAutosaveDebounceMs(env);
  const maxWait = parseClampedInt(
    resolveEnv(env).VITE_AUTOSAVE_MAX_WAIT_MS,
    AUTOSAVE_DEFAULT_MAX_WAIT_MS,
    MIN_DEBOUNCE_MS,
    MAX_MAX_WAIT_MS,
  );
  // maxWait must be at least the debounce window to be meaningful.
  return Math.max(maxWait, debounce);
};

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "retrying";

/**
 * Optional i18next-style translator. The options param is intentionally loose so
 * an i18next `TFunction` (with its overloaded signature) is assignable here while
 * we still call it as `t(key, defaultValue)`.
 */
type TranslateFn = (key: string, options?: any) => string;

/**
 * Human-readable label for the save-status indicator. Pass an i18next `t` to
 * localize it; without one it returns the English defaults (keeps pure unit
 * tests and non-React callers simple).
 */
export const saveStatusLabel = (status: SaveStatus, t?: TranslateFn): string => {
  const tr = (key: string, fallback: string): string =>
    t ? t(key, fallback) : fallback;
  switch (status) {
    case "saving":
      return tr("editor.saveStatus.saving", "Saving…");
    case "saved":
      return tr("editor.saveStatus.saved", "Saved");
    case "error":
      return tr("editor.saveStatus.error", "Save failed");
    case "retrying":
      return tr("editor.saveStatus.retrying", "Retrying…");
    case "idle":
    default:
      return "";
  }
};
