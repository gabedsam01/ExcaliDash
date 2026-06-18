import { describe, expect, it, vi } from "vitest";
import {
  extractBearerToken,
  generateApiKey,
  verifyApiKeyToken,
} from "./service";

const API_KEY_SECRET = "test-api-key-secret-at-least-32-characters";

describe("API key service", () => {
  it("validates a generated token and records its last use", async () => {
    const generated = generateApiKey(API_KEY_SECRET);
    const usedAt = new Date("2026-06-18T12:00:00.000Z");
    const prisma = {
      apiKey: {
        findUnique: vi.fn().mockResolvedValue({
          id: "key-1",
          userId: "user-1",
          tokenHash: generated.tokenHash,
          revokedAt: null,
          user: { isActive: true },
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await expect(
      verifyApiKeyToken({
        prisma,
        token: generated.token,
        secret: API_KEY_SECRET,
        now: usedAt,
      }),
    ).resolves.toEqual({
      apiKeyId: "key-1",
      userId: "user-1",
    });

    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { prefix: generated.prefix },
      }),
    );
    expect(prisma.apiKey.updateMany).toHaveBeenCalledWith({
      where: { id: "key-1", revokedAt: null },
      data: { lastUsedAt: usedAt },
    });
  });

  it("rejects invalid and revoked tokens", async () => {
    const generated = generateApiKey(API_KEY_SECRET);
    const prisma = {
      apiKey: {
        findUnique: vi.fn().mockResolvedValue({
          id: "key-1",
          userId: "user-1",
          tokenHash: generated.tokenHash,
          revokedAt: new Date(),
          user: { isActive: true },
        }),
        updateMany: vi.fn(),
      },
    };

    await expect(
      verifyApiKeyToken({
        prisma,
        token: generated.token,
        secret: API_KEY_SECRET,
      }),
    ).resolves.toBeNull();
    await expect(
      verifyApiKeyToken({
        prisma,
        token: "exd_not-a-valid-token",
        secret: API_KEY_SECRET,
      }),
    ).resolves.toBeNull();
    expect(prisma.apiKey.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a token with a valid prefix but incorrect secret", async () => {
    const generated = generateApiKey(API_KEY_SECRET);
    const other = generateApiKey(API_KEY_SECRET);
    const otherSecret = other.token.slice(other.prefix.length + 1);
    const tamperedToken = `${generated.prefix}_${otherSecret}`;
    const prisma = {
      apiKey: {
        findUnique: vi.fn().mockResolvedValue({
          id: "key-1",
          userId: "user-1",
          tokenHash: generated.tokenHash,
          revokedAt: null,
          user: { isActive: true },
        }),
        updateMany: vi.fn(),
      },
    };

    await expect(
      verifyApiKeyToken({
        prisma,
        token: tamperedToken,
        secret: API_KEY_SECRET,
      }),
    ).resolves.toBeNull();
    expect(prisma.apiKey.updateMany).not.toHaveBeenCalled();
  });

  it("extracts Bearer tokens case-insensitively", () => {
    expect(extractBearerToken("Bearer token-value")).toBe("token-value");
    expect(extractBearerToken("bearer token-value")).toBe("token-value");
    expect(extractBearerToken("Basic token-value")).toBeNull();
  });
});
