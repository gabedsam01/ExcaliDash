import express from "express";
import { fingerprintSecret } from "../../runtimeSecrets";
import type { SystemRouteDeps } from "./index";

type RuntimeConfigShape = Pick<
  SystemRouteDeps["config"],
  "appUrl" | "frontendUrl" | "databaseUrl" | "runtimeSecrets" | "mcp" | "limits"
>;

type Environment = Record<string, string | undefined>;

export const buildRuntimeConfigPayload = (
  config: RuntimeConfigShape,
  env: Environment = process.env,
) => ({
  appUrl: config.appUrl,
  frontendUrl: config.frontendUrl ?? config.appUrl,
  database: {
    provider: "postgresql" as const,
    defined: Boolean(config.databaseUrl),
  },
  secrets: {
    postgresPassword: {
      defined: Boolean(env.POSTGRES_PASSWORD?.trim()),
      source: "environment" as const,
      fingerprint: env.POSTGRES_PASSWORD?.trim()
        ? fingerprintSecret(env.POSTGRES_PASSWORD.trim())
        : null,
    },
    jwtSecret: config.runtimeSecrets.JWT_SECRET,
    csrfSecret: config.runtimeSecrets.CSRF_SECRET,
    apiKeySecret: config.runtimeSecrets.API_KEY_SECRET,
  },
  mcp: {
    enabled: config.mcp.enabled,
    libraryMode: config.mcp.libraryMode ?? "curated",
  },
  limits: {
    maxUploadMb: config.limits.upload.mb,
    maxJsonBodyMb: config.limits.jsonBody.mb,
  },
});

export const registerRuntimeConfigRoutes = (
  app: express.Express,
  deps: SystemRouteDeps,
) => {
  app.get(
    "/system/runtime-config",
    deps.requireAuth,
    deps.asyncHandler(async (_req, res) => {
      res.status(200).json(buildRuntimeConfigPayload(deps.config));
    }),
  );
};
