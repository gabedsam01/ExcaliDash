/**
 * Public surface of the library subsystem: a factory that wires the three
 * services, plus re-exports used by the app and tests.
 */
import { createCatalogService, type CatalogService } from "./catalogService";
import { createPackService, type PackService } from "./packService";
import {
  createDownloadService,
  type DownloadService,
} from "./downloadService";
import type { FetchLike, LibraryConfig, LibraryPrisma } from "./types";

export interface LibraryServices {
  catalogService: CatalogService;
  packService: PackService;
  downloadService: DownloadService;
}

export const createLibraryServices = (deps: {
  prisma: LibraryPrisma;
  config: LibraryConfig;
  fetchImpl?: FetchLike;
  logger?: Pick<Console, "warn" | "info" | "error">;
}): LibraryServices => {
  const { prisma, config, fetchImpl, logger } = deps;
  const packService = createPackService({ prisma, logger });
  const catalogService = createCatalogService({
    prisma,
    config,
    packService,
    fetchImpl,
    logger,
  });
  const downloadService = createDownloadService({
    prisma,
    config,
    fetchImpl,
    logger,
  });
  return { packService, catalogService, downloadService };
};

export { registerLibraryRoutes } from "./routes";
export { seedLibraries } from "./seed";
export type { CatalogService } from "./catalogService";
export type { PackService } from "./packService";
export type { DownloadService } from "./downloadService";
export * from "./types";
