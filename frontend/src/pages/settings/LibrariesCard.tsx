import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  Download,
  Library,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import * as api from "../../api";
import type {
  LibraryCacheResult,
  LibraryCatalogItem,
  LibraryPacksOverview,
  LibrarySearchMode,
  LibraryStatus,
} from "../../api";

const SEARCH_MODES: { value: LibrarySearchMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "core", label: "Core" },
  { value: "specialized", label: "Specialized" },
  { value: "public", label: "Public" },
];

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (api.isAxiosError(error)) {
    return (
      error.response?.data?.message || error.response?.data?.error || fallback
    );
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const LibrariesCard: React.FC = () => {
  const [status, setStatus] = useState<LibraryStatus | null>(null);
  const [packs, setPacks] = useState<LibraryPacksOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<LibrarySearchMode>("all");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<LibraryCatalogItem[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [cachingId, setCachingId] = useState<string | null>(null);
  const [cacheResults, setCacheResults] = useState<
    Record<string, LibraryCacheResult>
  >({});

  const publicEnabled = status?.publicSearchEnabled ?? true;
  const categories = packs?.specialized?.categories ?? [];
  const showCategory = mode === "specialized" || mode === "all";

  const loadOverview = useMemo(
    () => async () => {
      setLoadError(null);
      try {
        const [statusData, packsData] = await Promise.all([
          api.getLibraryStatus(),
          api.getLibraryPacks(),
        ]);
        setStatus(statusData);
        setPacks(packsData);
      } catch (error) {
        setLoadError(getErrorMessage(error, "Failed to load library status."));
      }
    },
    [],
  );

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setMessage(null);
    setLoadError(null);
    try {
      const result = await api.refreshLibraries();
      setStatus(result.status);
      await loadOverview();
      const missing = result.packs.missing.length;
      setMessage(
        missing > 0
          ? `Catalog refreshed. ${missing} curated name(s) not found in the official catalog.`
          : "Catalog refreshed.",
      );
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to refresh catalog."));
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setSearching(true);
    setSearchError(null);
    setWarning(null);
    setHasSearched(true);
    try {
      const response = await api.searchLibraries({
        q: query.trim() || undefined,
        mode,
        category: showCategory && category ? category : undefined,
        limit: 25,
      });
      setResults(response.results);
      setWarning(response.warning ?? null);
    } catch (error) {
      setSearchError(getErrorMessage(error, "Search failed."));
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCache = async (item: LibraryCatalogItem) => {
    setCachingId(item.id);
    setSearchError(null);
    try {
      const result = await api.cacheLibrary(item.id);
      setCacheResults((current) => ({ ...current, [item.id]: result }));
      setResults((current) =>
        current.map((r) =>
          r.id === item.id
            ? { ...r, cached: true, cachedAt: result.cachedAt, sha256: result.sha256, sizeBytes: result.sizeBytes }
            : r,
        ),
      );
    } catch (error) {
      setSearchError(getErrorMessage(error, "Failed to cache library."));
    } finally {
      setCachingId(null);
    }
  };

  return (
    <section className="mb-8 bg-white dark:bg-neutral-900 border-2 border-black dark:border-neutral-700 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-teal-50 dark:bg-teal-950/30 rounded-2xl flex items-center justify-center border-2 border-teal-100 dark:border-teal-800/50">
          <Library size={28} className="text-teal-600 dark:text-teal-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Diagram Libraries
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-neutral-400">
            Curated Excalidraw library packs for diagram generation. Prefers the
            Core and Specialized packs; Public search covers the full official
            catalog. Used by the future ExcaliDash MCP server.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-black dark:border-neutral-700 bg-teal-600 text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={18} />
          )}
          {refreshing ? "Refreshing…" : "Refresh catalog"}
        </button>
      </div>

      {(loadError || message) && (
        <div className="mt-5 space-y-2" aria-live="polite">
          {loadError && (
            <div
              role="alert"
              className="p-3 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm font-bold text-red-700 dark:text-red-300"
            >
              {loadError}
            </div>
          )}
          {message && (
            <div className="p-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {message}
            </div>
          )}
        </div>
      )}

      {/* Status grid */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border-2 border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/30">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
            <Database size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Catalog
            </span>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {status ? status.catalogCount : "—"}
          </p>
        </div>
        <div className="p-3 rounded-xl border-2 border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/30">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Curated
            </span>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {status ? status.curatedCount : "—"}
          </p>
        </div>
        <div className="p-3 rounded-xl border-2 border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/30">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
            <Library size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Core Pack
            </span>
          </div>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {packs?.core ? packs.core.itemCount : "—"}
          </p>
        </div>
        <div className="p-3 rounded-xl border-2 border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/30">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
            <Search size={16} />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Public Search
            </span>
          </div>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {publicEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-neutral-400">
        Last refresh: {formatDate(status?.lastRefreshedAt)}
        {status?.cacheDir ? ` · Cache: ${status.cacheDir}` : ""}
      </p>

      {/* Specialized categories */}
      {categories.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-neutral-400 mb-2">
            Specialized categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat.slug}
                className="px-2.5 py-1 rounded-full border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-300"
              >
                {cat.name}
                <span className="ml-1.5 text-slate-400 dark:text-neutral-500">
                  {cat.itemCount}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_150px_180px_auto] gap-3 items-end"
      >
        <div>
          <label
            htmlFor="library-search"
            className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2"
          >
            Search libraries
          </label>
          <input
            id="library-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. aws, kubernetes, wireframe"
            className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-teal-400"
          />
        </div>
        <div>
          <label
            htmlFor="library-mode"
            className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2"
          >
            Mode
          </label>
          <select
            id="library-mode"
            aria-label="Search mode"
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as LibrarySearchMode)
            }
            className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-teal-400"
          >
            {SEARCH_MODES.map((m) => (
              <option
                key={m.value}
                value={m.value}
                disabled={m.value === "public" && !publicEnabled}
              >
                {m.label}
                {m.value === "public" && !publicEnabled ? " (disabled)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="library-category"
            className="block text-sm font-bold text-slate-700 dark:text-neutral-300 mb-2"
          >
            Category
          </label>
          <select
            id="library-category"
            aria-label="Specialized category"
            value={category}
            disabled={!showCategory}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border-2 border-slate-200 dark:border-neutral-700 rounded-xl text-slate-900 dark:text-white outline-none focus:border-teal-400 disabled:opacity-50"
          >
            <option value="">Any</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.category ?? cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={searching}
          className="inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-black bg-slate-900 dark:bg-teal-600 text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all disabled:opacity-60"
        >
          {searching ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Search size={18} />
          )}
          Search
        </button>
      </form>

      {searchError && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-sm font-bold text-red-700 dark:text-red-300"
        >
          {searchError}
        </div>
      )}

      {warning && (
        <div className="mt-4 p-3 rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-sm font-bold text-amber-700 dark:text-amber-300">
          {warning}
        </div>
      )}

      {/* Results */}
      <div className="mt-5">
        {searching ? (
          <div
            className="flex items-center gap-2 p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-neutral-700 text-sm font-bold text-slate-500 dark:text-neutral-400"
            role="status"
          >
            <Loader2 size={18} className="animate-spin" />
            Searching…
          </div>
        ) : results.length === 0 ? (
          hasSearched ? (
            <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
              No libraries matched your search.
            </p>
          ) : null
        ) : (
          <div className="space-y-3">
            {results.map((item) => {
              const cached = cacheResults[item.id];
              return (
                <div
                  key={item.id}
                  data-testid="library-result"
                  className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-800/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <span
                        className={
                          item.curated
                            ? "px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300"
                            : "px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-[10px] font-black uppercase text-amber-700 dark:text-amber-300"
                        }
                      >
                        {item.curated ? "Curated" : "Public"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-[10px] font-black uppercase text-slate-500 dark:text-neutral-400">
                        {item.sourceMode}
                        {item.category ? ` · ${item.category}` : ""}
                      </span>
                      {(item.cached || cached) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 text-[10px] font-black uppercase text-teal-700 dark:text-teal-300">
                          <CheckCircle2 size={11} /> Cached
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-neutral-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {cached && (
                      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {cached.itemCount} items · {formatBytes(cached.sizeBytes)}
                        {" · "}
                        <span className="font-mono">
                          {cached.sha256.slice(0, 12)}…
                        </span>
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCache(item)}
                    disabled={cachingId === item.id}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800 disabled:opacity-60"
                    aria-label={`Cache or inspect ${item.name}`}
                  >
                    {cachingId === item.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    {item.cached || cached ? "Inspect" : "Cache"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
