/**
 * Pure mappers from persisted catalog rows to the concise, MCP-friendly
 * `LibraryItemDto`. Never includes raw `.excalidrawlib` content.
 */
import type {
  CatalogItemRecord,
  LibraryItemDto,
  LibrarySourceMode,
} from "./types";

const asStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length > 0 ? strings : undefined;
};

export const toLibraryDto = (
  item: CatalogItemRecord,
  options: { sourceMode: LibrarySourceMode; category?: string | null },
): LibraryItemDto => {
  const cached = Boolean(item.cachePath);
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description ?? undefined,
    sourceMode: options.sourceMode,
    category: options.category ?? undefined,
    curated: Boolean(item.isCurated),
    source: item.source,
    preview: item.preview ?? undefined,
    itemNames: asStringArray(item.itemNames),
    cached,
    cachedAt: item.cachedAt ? new Date(item.cachedAt).toISOString() : undefined,
    sha256: item.sha256 ?? undefined,
    sizeBytes: typeof item.sizeBytes === "number" ? item.sizeBytes : undefined,
  };
};

/** Coerce a stored JSON aliases value into a string array. */
export const aliasesToArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
