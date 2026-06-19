import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { fingerprintSecret } from "../../runtimeSecrets";
import {
  buildRuntimeConfigPayload,
  registerRuntimeConfigRoutes,
} from "./runtimeConfig";

const secret = "a".repeat(128);
const metadata = {
  defined: true as const,
  source: "environment" as const,
  fingerprint: fingerprintSecret(secret),
};

const runtimeConfig = {
  appUrl: "http://localhost:6767",
  frontendUrl: "http://localhost:6767",
  databaseUrl:
    "postgresql://user:password@postgres:5432/excalidash?schema=public",
  runtimeSecrets: {
    JWT_SECRET: metadata,
    CSRF_SECRET: metadata,
    API_KEY_SECRET: metadata,
  },
  mcp: {
    enabled: true,
    libraryMode: "curated" as const,
  },
  limits: {
    upload: { mb: 250, bytes: 250 * 1024 * 1024 },
    jsonBody: { mb: 100, bytes: 100 * 1024 * 1024 },
  },
};

describe("runtime config", () => {
  it("returns only redacted secret metadata", () => {
    const payload = buildRuntimeConfigPayload(runtimeConfig as any, {
      POSTGRES_PASSWORD: secret,
    });
    const serialized = JSON.stringify(payload);

    expect(payload.database.provider).toBe("postgresql");
    expect(payload.secrets.jwtSecret.fingerprint).toBe(
      fingerprintSecret(secret),
    );
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain("postgresql://");
    expect(serialized).not.toContain("password@");
  });

  it("requires authentication before returning the endpoint", async () => {
    const app = express();
    const requireAuth = vi.fn(
      (_req: express.Request, res: express.Response) => {
        res.status(401).json({ error: "Unauthorized" });
      },
    );

    registerRuntimeConfigRoutes(app, {
      config: runtimeConfig as any,
      requireAuth,
      getBackendVersion: () => "test",
      asyncHandler: (handler) => async (req, res, next) => {
        try {
          await handler(req, res, next);
        } catch (error) {
          next(error);
        }
      },
    });

    const response = await request(app).get("/system/runtime-config");
    expect(response.status).toBe(401);
    expect(requireAuth).toHaveBeenCalledOnce();
  });
});
