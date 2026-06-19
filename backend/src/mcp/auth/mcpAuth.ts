/**
 * MCP auth: Bearer `exd_` API-key verification (reuses the existing HMAC +
 * timing-safe + revoked/inactive checks) and optional Origin validation.
 * The raw token is never logged.
 */
import express from "express";
import {
  extractBearerToken,
  verifyApiKeyToken,
} from "../../apiKeys/service";
import type { McpPrincipal } from "../types";

export type McpRequest = express.Request & { mcpPrincipal?: McpPrincipal };

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface McpAuthDeps {
  prisma: any;
  apiKeySecret: string;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const createMcpAuthMiddleware = (
  deps: McpAuthDeps,
): express.RequestHandler => {
  return async (req, res, next) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing Authorization: Bearer exd_ API key.",
      });
      return;
    }
    let principal: { apiKeyId: string; userId: string } | null = null;
    try {
      principal = await verifyApiKeyToken({
        prisma: deps.prisma,
        token,
        secret: deps.apiKeySecret,
      });
    } catch (error) {
      // Never include the token in logs.
      console.error("[mcp] API key verification error:", error);
      res.status(500).json({ error: "Internal error" });
      return;
    }
    if (!principal) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid or revoked API key.",
      });
      return;
    }
    (req as McpRequest).mcpPrincipal = {
      userId: principal.userId,
      apiKeyId: principal.apiKeyId,
    };
    next();
  };
};

export const createMcpOriginMiddleware = (deps: {
  validateOrigin: boolean;
  isAllowedOrigin: (origin?: string) => boolean;
}): express.RequestHandler => {
  return (req, res, next) => {
    if (!deps.validateOrigin) return next();
    const header = req.headers.origin;
    const origin = Array.isArray(header) ? header[0] : header;
    // Non-browser MCP clients (e.g. Claude Code) send no Origin — allow.
    if (!origin) return next();
    if (deps.isAllowedOrigin(origin)) return next();
    res.status(403).json({ error: "Forbidden", message: "Origin not allowed." });
  };
};
