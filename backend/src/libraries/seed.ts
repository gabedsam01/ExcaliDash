/**
 * Orchestrates a full, idempotent seed: ensure packs exist, refresh the
 * official catalog (best-effort), then (re)resolve pack membership.
 *
 * Network failures during refresh are caught and reported — they never crash
 * startup or the refresh endpoint.
 */
import type { CatalogService } from "./catalogService";
import type { PackService } from "./packService";
import type { LibrarySeedResult } from "./types";

export interface SeedDeps {
  catalogService: CatalogService;
  packService: PackService;
  /** Skip the network refresh (e.g. when auto-refresh-on-start is disabled). */
  refresh?: boolean;
  logger?: Pick<Console, "warn" | "info" | "error">;
}

export const seedLibraries = async (
  deps: SeedDeps,
): Promise<LibrarySeedResult> => {
  const { catalogService, packService, refresh = true } = deps;
  const logger = deps.logger ?? console;

  // 1. Packs always exist, even without network (so /packs is useful).
  await packService.seedPacks();

  // 2. Refresh the catalog (best-effort).
  let catalog: LibrarySeedResult["catalog"];
  if (refresh) {
    try {
      catalog = await catalogService.refresh();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      logger.error(`[libraries] catalog refresh failed: ${reason}`);
      catalog = { skipped: true, reason };
    }
  } else {
    catalog = { skipped: true, reason: "auto-refresh disabled" };
  }

  // 3. Resolve membership against whatever catalog we have.
  const packs = await packService.reseedMembership();
  if (packs.missing.length > 0) {
    logger.warn(
      `[libraries] seed completed with ${packs.missing.length} missing catalog name(s): ${packs.missing
        .map((m) => `${m.name} (${m.pack})`)
        .join(", ")}`,
    );
  }

  return { catalog, packs };
};
