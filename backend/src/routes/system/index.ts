import express from "express";
import { registerUpdateRoutes } from "./update";
import { registerRuntimeConfigRoutes } from "./runtimeConfig";
import type { Config } from "../../config";

export type SystemRouteDeps = {
  asyncHandler: <T = void>(
    fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<T>
  ) => express.RequestHandler;
  getBackendVersion: () => string;
  requireAuth: express.RequestHandler;
  config: Config;
};

export const registerSystemRoutes = (app: express.Express, deps: SystemRouteDeps) => {
  registerUpdateRoutes(app, deps);
  registerRuntimeConfigRoutes(app, deps);
};
