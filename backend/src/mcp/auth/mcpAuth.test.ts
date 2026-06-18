import express from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMcpAuthMiddleware, type McpRequest } from "./mcpAuth";
import { generateApiKey } from "../../apiKeys/service";
import { createMcpFakePrisma } from "../__testfixtures__/fakePrisma";

const SECRET = "mcp-test-secret-at-least-32-characters-long";

const mockResponse = () => {
  const res: Partial<express.Response> & {
    statusCode?: number;
    body?: unknown;
  } = {};
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res as express.Response;
  }) as never;
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res as express.Response;
  }) as never;
  return res as express.Response & { statusCode?: number; body?: unknown };
};

const run = async (
  middleware: express.RequestHandler,
  authorization?: string,
) => {
  const req = { headers: authorization ? { authorization } : {} } as McpRequest;
  const res = mockResponse() as express.Response & {
    statusCode?: number;
    body?: unknown;
  };
  const next = vi.fn();
  await (middleware as unknown as (
    r: express.Request,
    s: express.Response,
    n: express.NextFunction,
  ) => Promise<void>)(req as express.Request, res, next as express.NextFunction);
  return { req, res, next };
};

describe("MCP auth middleware", () => {
  afterEach(() => vi.restoreAllMocks());

  it("rejects a request with no Bearer token (401)", async () => {
    const prisma = createMcpFakePrisma();
    const mw = createMcpAuthMiddleware({ prisma, apiKeySecret: SECRET });
    const { res, next } = await run(mw);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid token (401)", async () => {
    const prisma = createMcpFakePrisma();
    const mw = createMcpAuthMiddleware({ prisma, apiKeySecret: SECRET });
    const { res, next } = await run(mw, "Bearer exd_0123456789abcdef_invalidsecretvalue000000000000000000000000");
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a revoked token (401)", async () => {
    const prisma = createMcpFakePrisma();
    const generated = generateApiKey(SECRET);
    prisma.__seedApiKey({
      prefix: generated.prefix,
      userId: "user-1",
      tokenHash: generated.tokenHash,
      revokedAt: new Date(),
    });
    const mw = createMcpAuthMiddleware({ prisma, apiKeySecret: SECRET });
    const { res, next } = await run(mw, `Bearer ${generated.token}`);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a valid token and attaches the principal", async () => {
    const prisma = createMcpFakePrisma();
    const generated = generateApiKey(SECRET);
    prisma.__seedApiKey({
      prefix: generated.prefix,
      userId: "user-42",
      tokenHash: generated.tokenHash,
    });
    const mw = createMcpAuthMiddleware({ prisma, apiKeySecret: SECRET });
    const { req, next } = await run(mw, `Bearer ${generated.token}`);
    expect(next).toHaveBeenCalledTimes(1);
    expect((req as McpRequest).mcpPrincipal?.userId).toBe("user-42");
  });

  it("never logs the raw token", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const prisma = createMcpFakePrisma();
    const generated = generateApiKey(SECRET);
    prisma.__seedApiKey({
      prefix: generated.prefix,
      userId: "user-1",
      tokenHash: generated.tokenHash,
    });
    const mw = createMcpAuthMiddleware({ prisma, apiKeySecret: SECRET });
    await run(mw, `Bearer ${generated.token}`);
    const logged = [...logSpy.mock.calls, ...errSpy.mock.calls]
      .flat()
      .map((arg) => String(arg))
      .join(" ");
    expect(logged).not.toContain(generated.token);
  });
});
