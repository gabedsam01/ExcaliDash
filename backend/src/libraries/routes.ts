/**
 * Authenticated HTTP routes for the library subsystem. Registered at
 * `/libraries/*` (the frontend/proxy maps `/api/libraries/*` here).
 *
 * Routes mirror the apiKeys module: dependency-injected `prisma`/`requireAuth`/
 * `asyncHandler`, and validation handled inline.
 */
import express from "express";
import { z } from "zod";
import { isLibraryError } from "./errors";
import { seedLibraries } from "./seed";
import type { LibraryServices } from "./index";

const searchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  mode: z.enum(["core", "specialized", "public", "all"]).optional(),
  category: z.string().max(100).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const idParamSchema = z.string().min(1).max(200);

export interface RegisterLibraryRoutesDeps {
  requireAuth: express.RequestHandler;
  asyncHandler: <T = void>(
    fn: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => Promise<T>,
  ) => express.RequestHandler;
  services: LibraryServices;
  logger?: Pick<Console, "warn" | "info" | "error">;
}

export const registerLibraryRoutes = (
  app: express.Express,
  deps: RegisterLibraryRoutesDeps,
): void => {
  const { requireAuth, asyncHandler, services } = deps;
  const logger = deps.logger ?? console;
  const { catalogService, packService, downloadService } = services;

  /** Map LibraryError to its HTTP status; rethrow anything else (=> 500). */
  const respondError = (res: express.Response, error: unknown): void => {
    if (isLibraryError(error)) {
      res.status(error.status).json({
        error: "Library error",
        code: error.code,
        message: error.message,
      });
      return;
    }
    throw error;
  };

  // --- Status -------------------------------------------------------------
  app.get(
    "/libraries/status",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const status = await catalogService.getStatus();
      return res.json(status);
    }),
  );

  // --- Refresh (refetch catalog + reseed packs, idempotent) ---------------
  app.post(
    "/libraries/refresh",
    requireAuth,
    asyncHandler(async (_req, res) => {
      try {
        const result = await seedLibraries({
          catalogService,
          packService,
          logger,
        });
        const status = await catalogService.getStatus();
        return res.json({ ...result, status });
      } catch (error) {
        return respondError(res, error);
      }
    }),
  );

  // --- Packs --------------------------------------------------------------
  app.get(
    "/libraries/packs",
    requireAuth,
    asyncHandler(async (_req, res) => {
      const packs = await packService.listPacks();
      return res.json(packs);
    }),
  );

  app.get(
    "/libraries/packs/:slug",
    requireAuth,
    asyncHandler(async (req, res) => {
      const pack = await packService.getPack(req.params.slug);
      if (!pack) {
        return res.status(404).json({
          error: "Not found",
          message: `Pack not found: ${req.params.slug}`,
        });
      }
      return res.json(pack);
    }),
  );

  // --- Search -------------------------------------------------------------
  app.get(
    "/libraries/search",
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Validation error",
          message: "Invalid search parameters",
        });
      }
      try {
        const result = await catalogService.search({
          query: parsed.data.q,
          mode: parsed.data.mode,
          category: parsed.data.category,
          limit: parsed.data.limit,
        });
        return res.json(result);
      } catch (error) {
        return respondError(res, error);
      }
    }),
  );

  // --- Single library -----------------------------------------------------
  // NOTE: literal routes above are registered first so they take precedence
  // over this parameterized route.
  app.get(
    "/libraries/:id",
    requireAuth,
    asyncHandler(async (req, res) => {
      const parsedId = idParamSchema.safeParse(req.params.id);
      if (!parsedId.success) {
        return res
          .status(400)
          .json({ error: "Validation error", message: "Invalid library id" });
      }
      const dto = await catalogService.getById(parsedId.data);
      if (!dto) {
        return res.status(404).json({
          error: "Not found",
          message: `Library not found: ${parsedId.data}`,
        });
      }
      return res.json(dto);
    }),
  );

  // --- Cache (download + persist) -----------------------------------------
  app.post(
    "/libraries/:id/cache",
    requireAuth,
    asyncHandler(async (req, res) => {
      try {
        const result = await downloadService.cacheLibrary(req.params.id);
        return res.json(result);
      } catch (error) {
        return respondError(res, error);
      }
    }),
  );

  // --- Items (ensure cached, return bounded summary) ----------------------
  app.get(
    "/libraries/:id/items",
    requireAuth,
    asyncHandler(async (req, res) => {
      try {
        const result = await downloadService.getItems(req.params.id);
        return res.json(result);
      } catch (error) {
        return respondError(res, error);
      }
    }),
  );
};
