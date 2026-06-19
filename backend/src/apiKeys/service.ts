import crypto from "crypto";

const API_KEY_IDENTIFIER_BYTES = 8;
const API_KEY_SECRET_BYTES = 32;
const API_KEY_PREFIX_PATTERN = /^exd_[a-f0-9]{16}$/;
const API_KEY_TOKEN_PATTERN = /^(exd_[a-f0-9]{16})_([A-Za-z0-9_-]{43})$/;

export type GeneratedApiKey = {
  token: string;
  prefix: string;
  suffix: string;
  tokenHash: string;
};

export type ApiKeyVerificationStore = {
  apiKey: {
    findUnique: (args: {
      where: { prefix: string };
      select: {
        id: true;
        userId: true;
        tokenHash: true;
        revokedAt: true;
        user: {
          select: {
            isActive: true;
          };
        };
      };
    }) => Promise<{
      id: string;
      userId: string;
      tokenHash: string;
      revokedAt: Date | null;
      user: { isActive: boolean };
    } | null>;
    updateMany: (args: {
      where: { id: string; revokedAt: null };
      data: { lastUsedAt: Date };
    }) => Promise<{ count: number }>;
  };
};

export const hashApiKeyToken = (token: string, secret: string): string =>
  crypto.createHmac("sha256", secret).update(token).digest("hex");

export const generateApiKey = (secret: string): GeneratedApiKey => {
  const identifier = crypto
    .randomBytes(API_KEY_IDENTIFIER_BYTES)
    .toString("hex");
  const tokenSecret = crypto
    .randomBytes(API_KEY_SECRET_BYTES)
    .toString("base64url");
  const prefix = `exd_${identifier}`;
  const token = `${prefix}_${tokenSecret}`;

  return {
    token,
    prefix,
    suffix: token.slice(-4),
    tokenHash: hashApiKeyToken(token, secret),
  };
};

export const parseApiKeyPrefix = (token: string): string | null => {
  const match = API_KEY_TOKEN_PATTERN.exec(token);
  if (!match || !match[1] || !API_KEY_PREFIX_PATTERN.test(match[1])) {
    return null;
  }
  return match[1];
};

export const extractBearerToken = (
  authorization: string | undefined,
): string | null => {
  if (!authorization) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return match?.[1]?.trim() || null;
};

const safeHashEquals = (actual: string, expected: string): boolean => {
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
};

export const verifyApiKeyToken = async ({
  prisma,
  token,
  secret,
  now = new Date(),
}: {
  prisma: ApiKeyVerificationStore;
  token: string;
  secret: string;
  now?: Date;
}): Promise<{ apiKeyId: string; userId: string } | null> => {
  const prefix = parseApiKeyPrefix(token);
  if (!prefix) return null;

  const apiKey = await prisma.apiKey.findUnique({
    where: { prefix },
    select: {
      id: true,
      userId: true,
      tokenHash: true,
      revokedAt: true,
      user: {
        select: {
          isActive: true,
        },
      },
    },
  });

  if (!apiKey || apiKey.revokedAt || !apiKey.user.isActive) {
    return null;
  }

  const candidateHash = hashApiKeyToken(token, secret);
  if (!safeHashEquals(candidateHash, apiKey.tokenHash)) {
    return null;
  }

  const updateResult = await prisma.apiKey.updateMany({
    where: { id: apiKey.id, revokedAt: null },
    data: { lastUsedAt: now },
  });
  if (updateResult.count !== 1) {
    return null;
  }

  return {
    apiKeyId: apiKey.id,
    userId: apiKey.userId,
  };
};
