/**
 * Configuration validation and environment variable management
 */
import dotenv from "dotenv";
import {
  loadRequestLimits,
  RequestLimits,
  summarizeRequestLimits,
} from "./utils/limits";
import type { LibraryConfig } from "./libraries/types";
import type { McpConfig } from "./mcp/types";
import {
  resolveRuntimeSecrets,
  type RuntimeSecretMetadata,
  type RuntimeSecretKey,
} from "./runtimeSecrets";

dotenv.config();

export interface Config {
  port: number;
  nodeEnv: string;
  appUrl: string;
  databaseUrl?: string;
  frontendUrl?: string;
  authMode: AuthMode;
  jwtSecret: string;
  jwtAccessExpiresIn: string;
  jwtRefreshExpiresIn: string;
  rateLimitMaxRequests: number;
  csrfMaxRequests: number;
  csrfSecret: string;
  apiKeySecret: string;
  oidc: OidcConfig;
  enablePasswordReset: boolean;
  enableRefreshTokenRotation: boolean;
  enableAuditLogging: boolean;
  enforceHttpsRedirect: boolean;
  bootstrapSetupCodeTtlMs: number;
  bootstrapSetupCodeMaxAttempts: number;
  limits: RequestLimits;
  libraries: LibraryConfig;
  mcp: McpConfig;
  snapshots: SnapshotConfig;
  imageOptimization: ImageOptimizationConfig;
  savePerf: SavePerfConfig;
  redis: RedisConfig;
  localFileStorage: LocalFileStorageConfig;
  runtimeSecrets: Record<RuntimeSecretKey, RuntimeSecretMetadata>;
}

export type AuthMode = "local" | "hybrid" | "oidc_enforced";

/**
 * Snapshot retention + "smart snapshot" policy. Keeps DrawingSnapshot growth
 * bounded (a large Excalidraw file can otherwise accumulate thousands of
 * multi-MB snapshots). See docs/postgres.md.
 */
export interface SnapshotConfig {
  /** Max snapshots kept per drawing. <= 0 disables automatic retention. */
  maxPerDrawing: number;
  /** Prune old snapshots right after creating a new one. */
  pruneOnSave: boolean;
  /** Run a one-shot count-based prune across all drawings at startup. */
  pruneOnStartup: boolean;
  /** Minimum seconds between snapshots for the same drawing. <= 0 = no gating. */
  minIntervalSeconds: number;
  /** Snapshot on every scene save (defeats interval gating; off by default). */
  onEverySave: boolean;
  /** Force a snapshot on explicit version/checkpoint events (manual save/restore). */
  forceOnVersionChange: boolean;
  /** Respond to the save before the snapshot write/prune finishes. */
  async: boolean;
}

/** Server-side raster image optimization for embedded Excalidraw files. */
export interface ImageOptimizationConfig {
  enabled: boolean;
  maxWidth: number;
  maxHeight: number;
  webpQuality: number;
  jpegQuality: number;
  pngCompressionLevel: number;
  /** Files smaller than this many bytes are left untouched. */
  minBytes: number;
  /** Reuse optimization results for identical content (in-process hash cache). */
  cacheEnabled: boolean;
}

/** Structured per-stage logging for slow saves (no payload content is logged). */
export interface SavePerfConfig {
  enabled: boolean;
  slowMs: number;
}

/**
 * Optional Redis speed layer. PostgreSQL is always the source of truth; Redis
 * only caches hot drawings/metadata and coordinates saves. When disabled (the
 * default) or unreachable, the app runs on PostgreSQL alone. See docs/redis.md.
 */
export interface RedisConfig {
  enabled: boolean;
  url: string;
  prefix: string;
  /** Default TTL for generic cached values. */
  cacheTtlSeconds: number;
  /** TTL for the hot per-drawing cache. */
  drawingCacheTtlSeconds: number;
  /** TTL for cached listing/metadata responses. */
  metadataCacheTtlSeconds: number;
  /** TTL of the advisory per-drawing save lock (short, self-healing). */
  saveLockTtlSeconds: number;
  /** Enable advisory save lock + cross-replica snapshot coalescing. */
  saveQueueEnabled: boolean;
  /** Values larger than this are never written to Redis. */
  maxValueBytes: number;
}

/**
 * Optional local (on-volume) file storage for offloading large embedded images
 * out of the JSON payload. NO object storage (S3/R2/MinIO) is ever used —
 * ExcaliDash stays self-hosted. Disabled by default; see docs/redis.md and the
 * "next steps" note in docs/backend.md.
 */
export interface LocalFileStorageConfig {
  enabled: boolean;
  dir: string;
}

interface OidcConfig {
  enabled: boolean;
  enforced: boolean;
  providerName: string;
  issuerUrl: string | null;
  discoveryUrl: string | null;
  clientId: string | null;
  clientSecret: string | null;
  redirectUri: string | null;
  idTokenSignedResponseAlg: string | null;
  tokenEndpointAuthMethod:
    | "none"
    | "client_secret_basic"
    | "client_secret_post"
    | null;
  scopes: string;
  emailClaim: string;
  emailVerifiedClaim: string;
  groupsClaim: string;
  adminGroups: string[];
  requireEmailVerified: boolean;
  jitProvisioning: boolean;
  firstUserAdmin: boolean;
}

const ALLOWED_OIDC_ID_TOKEN_ALGS = new Set([
  "RS256",
  "RS384",
  "RS512",
  "PS256",
  "PS384",
  "PS512",
  "ES256",
  "ES384",
  "ES512",
  "EdDSA",
  "HS256",
  "HS384",
  "HS512",
]);

const getOptionalEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

const getOptionalTrimmedEnv = (key: string): string | null => {
  const raw = process.env[key];
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const getOptionalOidcSigningAlg = (key: string): string | null => {
  const raw = process.env[key];
  if (!raw) return null;
  const normalized = raw.trim();

  if (normalized.length === 0 || normalized.toLowerCase() === "none") {
    throw new Error(`${key} must not be empty or 'none'`);
  }
  if (!ALLOWED_OIDC_ID_TOKEN_ALGS.has(normalized)) {
    throw new Error(
      `${key} must be one of: ${Array.from(ALLOWED_OIDC_ID_TOKEN_ALGS).join(", ")}`
    );
  }

  return normalized;
};

const getOptionalOidcTokenEndpointAuthMethod = (
  key: string,
): "none" | "client_secret_basic" | "client_secret_post" | null => {
  const raw = process.env[key];
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  if (normalized.length === 0) return null;
  if (
    normalized === "none" ||
    normalized === "client_secret_basic" ||
    normalized === "client_secret_post"
  ) {
    return normalized;
  }
  throw new Error(
    `${key} must be one of: none, client_secret_basic, client_secret_post`,
  );
};

const parseCsvEnvList = (key: string): string[] => {
  const raw = process.env[key];
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const parseFrontendUrl = (raw: string | undefined): string | undefined => {
  if (!raw || raw.trim().length === 0) return undefined;
  const normalized = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .join(",");
  return normalized.length > 0 ? normalized : undefined;
};

/**
 * ExcaliDash is PostgreSQL-only. SQLite (and any `file:` URL) is no longer
 * supported. This validates DATABASE_URL early and fails fast with a clear,
 * actionable message instead of silently falling back to a local file.
 */
const resolveDatabaseUrl = (rawUrl?: string): string => {
  const trimmed = rawUrl?.trim();

  if (!trimmed) {
    throw new Error(
      "Missing required environment variable: DATABASE_URL. ExcaliDash " +
        "requires a PostgreSQL connection string, e.g. " +
        "postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public",
    );
  }

  if (/^file:/i.test(trimmed) || /^sqlite:/i.test(trimmed)) {
    throw new Error(
      "SQLite is no longer supported. DATABASE_URL must be a PostgreSQL " +
        "connection string (postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public). " +
        "Received a SQLite/file URL — update DATABASE_URL to point at PostgreSQL.",
    );
  }

  if (!/^postgres(ql)?:\/\//i.test(trimmed)) {
    throw new Error(
      "Invalid DATABASE_URL: ExcaliDash requires a PostgreSQL connection " +
        "string starting with postgresql:// (or postgres://).",
    );
  }

  return trimmed;
};

process.env.DATABASE_URL = resolveDatabaseUrl(process.env.DATABASE_URL);

const getOptionalBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
};

const getRequiredEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid value for environment variable ${key}: must be a positive number`,
    );
  }
  return parsed;
};

/**
 * Integer env reader that ACCEPTS zero/negative values (used by settings where
 * `<= 0` is a meaningful "disabled" sentinel, e.g. MAX_SNAPSHOTS_PER_DRAWING).
 * Falls back to `defaultValue` when unset or non-numeric.
 */
const getOptionalIntAllowingZero = (
  key: string,
  defaultValue: number,
): number => {
  const value = process.env[key];
  if (value === undefined || value.trim().length === 0) return defaultValue;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.trunc(parsed);
};

/** Clamp an env number into [min, max], falling back to `defaultValue`. */
const getClampedEnvNumber = (
  key: string,
  defaultValue: number,
  min: number,
  max: number,
): number => {
  const value = process.env[key];
  if (value === undefined || value.trim().length === 0) return defaultValue;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};

const parseAuthMode = (rawValue: string | undefined): AuthMode => {
  const normalized = (rawValue || "local").trim().toLowerCase();
  if (
    normalized === "local" ||
    normalized === "hybrid" ||
    normalized === "oidc_enforced"
  ) {
    return normalized;
  }
  throw new Error(
    "Invalid AUTH_MODE. Expected one of: local, hybrid, oidc_enforced",
  );
};

const resolveOidcConfig = (authMode: AuthMode): OidcConfig => {
  const issuerUrl = getOptionalTrimmedEnv("OIDC_ISSUER_URL");
  const discoveryUrl = getOptionalTrimmedEnv("OIDC_DISCOVERY_URL");
  const clientId = getOptionalTrimmedEnv("OIDC_CLIENT_ID");
  const clientSecret = getOptionalTrimmedEnv("OIDC_CLIENT_SECRET");
  const redirectUri = getOptionalTrimmedEnv("OIDC_REDIRECT_URI");
  const groupsClaim = getOptionalEnv("OIDC_GROUPS_CLAIM", "groups").trim();
  const adminGroups = parseCsvEnvList("OIDC_ADMIN_GROUPS");
  const requiredWhenEnabled = {
    OIDC_ISSUER_URL: issuerUrl,
    OIDC_CLIENT_ID: clientId,
    OIDC_REDIRECT_URI: redirectUri,
  };

  if (groupsClaim.length === 0) {
    throw new Error(
      "Invalid OIDC_GROUPS_CLAIM: must be a non-empty claim key/path",
    );
  }

  const enabled = authMode !== "local";
  const missingRequired = Object.entries(requiredWhenEnabled)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (enabled && missingRequired.length > 0) {
    throw new Error(
      `AUTH_MODE=${authMode} requires OIDC configuration. Missing: ${missingRequired.join(", ")}`,
    );
  }

  if (!enabled) {
    const hasOidcVars =
      Object.values(requiredWhenEnabled).some((value) => Boolean(value)) ||
      adminGroups.length > 0;
    if (hasOidcVars) {
      console.warn(
        "[config] AUTH_MODE=local; ignoring OIDC_* provider settings.",
      );
    }
  }

  const idTokenSignedResponseAlg = enabled
    ? getOptionalOidcSigningAlg("OIDC_ID_TOKEN_SIGNED_RESPONSE_ALG")
    : null;
  const tokenEndpointAuthMethod = enabled
    ? getOptionalOidcTokenEndpointAuthMethod("OIDC_TOKEN_ENDPOINT_AUTH_METHOD")
    : null;
  if (enabled && idTokenSignedResponseAlg && /^HS/i.test(idTokenSignedResponseAlg) && !clientSecret) {
    throw new Error(
      "OIDC_ID_TOKEN_SIGNED_RESPONSE_ALG using HS* requires OIDC_CLIENT_SECRET for a confidential client"
    );
  }

  return {
    enabled,
    enforced: authMode === "oidc_enforced",
    providerName: getOptionalEnv("OIDC_PROVIDER_NAME", "OIDC"),
    issuerUrl,
    discoveryUrl,
    clientId,
    clientSecret,
    redirectUri,
    idTokenSignedResponseAlg,
    tokenEndpointAuthMethod,
    scopes: getOptionalEnv("OIDC_SCOPES", "openid profile email"),
    emailClaim: getOptionalEnv("OIDC_EMAIL_CLAIM", "email"),
    emailVerifiedClaim: getOptionalEnv(
      "OIDC_EMAIL_VERIFIED_CLAIM",
      "email_verified",
    ),
    groupsClaim,
    adminGroups,
    requireEmailVerified: getOptionalBoolean(
      "OIDC_REQUIRE_EMAIL_VERIFIED",
      true,
    ),
    jitProvisioning: getOptionalBoolean("OIDC_JIT_PROVISIONING", true),
    firstUserAdmin: getOptionalBoolean("OIDC_FIRST_USER_ADMIN", true),
  };
};

const DEFAULT_LIBRARIES_CATALOG_URL =
  "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries.json";
const DEFAULT_LIBRARIES_BASE_URL =
  "https://raw.githubusercontent.com/excalidraw/excalidraw-libraries/main/libraries";

/**
 * Curated Excalidraw library packs configuration. Only the official Excalidraw
 * catalog host is reachable (enforced at fetch time, see libraries/validators).
 */
const resolveLibraryConfig = (): LibraryConfig => {
  const downloadMaxMb = getRequiredEnvNumber("LIBRARY_DOWNLOAD_MAX_MB", 25);
  return {
    catalogUrl: getOptionalEnv(
      "EXCALIDRAW_LIBRARIES_CATALOG_URL",
      DEFAULT_LIBRARIES_CATALOG_URL,
    ),
    baseUrl: getOptionalEnv(
      "EXCALIDRAW_LIBRARIES_BASE_URL",
      DEFAULT_LIBRARIES_BASE_URL,
    ),
    cacheDir: getOptionalEnv("LIBRARY_CACHE_DIR", "/app/data/libraries"),
    refreshIntervalHours: getRequiredEnvNumber(
      "LIBRARY_REFRESH_INTERVAL_HOURS",
      24,
    ),
    downloadTimeoutMs: getRequiredEnvNumber("LIBRARY_DOWNLOAD_TIMEOUT_MS", 15000),
    downloadMaxBytes: Math.trunc(downloadMaxMb * 1024 * 1024),
    publicSearchEnabled: getOptionalBoolean(
      "LIBRARY_PUBLIC_SEARCH_ENABLED",
      true,
    ),
    publicSearchMaxResults: getRequiredEnvNumber(
      "LIBRARY_PUBLIC_SEARCH_MAX_RESULTS",
      25,
    ),
    autoRefreshOnStart: getOptionalBoolean(
      "LIBRARY_AUTO_REFRESH_ON_START",
      true,
    ),
  };
};

/**
 * ExcaliDash MCP server configuration. The MCP exposes exactly 25 drawing tools
 * at MCP_ENDPOINT_PATH, authenticated by Bearer `exd_` API keys.
 */
const resolveMcpConfig = (): McpConfig => {
  const clampScore = (key: string, fallback: number): number => {
    const raw = process.env[key];
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid ${key}: must be a number between 0 and 100`);
    }
    return Math.max(0, Math.min(100, Math.trunc(parsed)));
  };

  const allowedLibraryModes = new Set([
    "curated",
    "all",
    "core",
    "specialized",
    "public",
  ]);
  const libraryMode = getOptionalEnv(
    "MCP_DEFAULT_LIBRARY_MODE",
    "curated",
  ).trim();
  if (!allowedLibraryModes.has(libraryMode)) {
    throw new Error(
      `Invalid MCP_DEFAULT_LIBRARY_MODE: must be one of ${Array.from(
        allowedLibraryModes,
      ).join(", ")}`,
    );
  }

  let endpointPath = getOptionalEnv("MCP_ENDPOINT_PATH", "/mcp").trim();
  if (!endpointPath.startsWith("/")) endpointPath = `/${endpointPath}`;
  endpointPath = endpointPath.replace(/\/+$/, "") || "/mcp";

  const allowedLibraryUsageModes = new Set(["off", "curated", "required"]);
  const libraryUsageMode = getOptionalEnv("MCP_LIBRARY_MODE", "curated")
    .trim()
    .toLowerCase();
  if (!allowedLibraryUsageModes.has(libraryUsageMode)) {
    throw new Error(
      `Invalid MCP_LIBRARY_MODE: must be one of off, curated, required`,
    );
  }

  return {
    enabled: getOptionalBoolean("MCP_ENABLED", true),
    endpointPath,
    minDrawingScore: clampScore("MCP_MIN_DRAWING_SCORE", 95),
    maxRepairAttempts: getRequiredEnvNumber("MCP_MAX_REPAIR_ATTEMPTS", 5),
    allowLowScoreDraft: getOptionalBoolean("MCP_ALLOW_LOW_SCORE_DRAFT", true),
    maxElements: getRequiredEnvNumber("MCP_MAX_ELEMENTS", 5000),
    maxExportMb: getRequiredEnvNumber("MCP_MAX_EXPORT_MB", 100),
    defaultLibraryMode: libraryMode as McpConfig["defaultLibraryMode"],
    libraryMode: libraryUsageMode as McpConfig["libraryMode"],
    publicSearchEnabled: getOptionalBoolean("MCP_PUBLIC_SEARCH_ENABLED", false),
    rateLimitWindowSeconds: getRequiredEnvNumber(
      "MCP_RATE_LIMIT_WINDOW_SECONDS",
      900,
    ),
    rateLimitMax: getRequiredEnvNumber("MCP_RATE_LIMIT_MAX", 300),
    validateOrigin: getOptionalBoolean("MCP_VALIDATE_ORIGIN", true),
  };
};

/**
 * Snapshot retention + smart-snapshot policy. Defaults keep at most 15
 * snapshots/drawing and avoid writing a heavy snapshot on every autosave.
 */
const resolveSnapshotConfig = (): SnapshotConfig => ({
  maxPerDrawing: getOptionalIntAllowingZero("MAX_SNAPSHOTS_PER_DRAWING", 15),
  pruneOnSave: getOptionalBoolean("SNAPSHOT_PRUNE_ON_SAVE", true),
  pruneOnStartup: getOptionalBoolean("SNAPSHOT_PRUNE_ON_STARTUP", false),
  minIntervalSeconds: getOptionalIntAllowingZero(
    "SNAPSHOT_MIN_INTERVAL_SECONDS",
    300,
  ),
  onEverySave: getOptionalBoolean("SNAPSHOT_ON_EVERY_SAVE", false),
  forceOnVersionChange: getOptionalBoolean(
    "SNAPSHOT_FORCE_ON_VERSION_CHANGE",
    true,
  ),
  async: getOptionalBoolean("SNAPSHOT_ASYNC", true),
});

const resolveImageOptimizationConfig = (): ImageOptimizationConfig => ({
  enabled: getOptionalBoolean("IMAGE_OPTIMIZATION_ENABLED", true),
  maxWidth: getRequiredEnvNumber("IMAGE_OPTIMIZATION_MAX_WIDTH", 1920),
  maxHeight: getRequiredEnvNumber("IMAGE_OPTIMIZATION_MAX_HEIGHT", 1920),
  webpQuality: getClampedEnvNumber("IMAGE_OPTIMIZATION_WEBP_QUALITY", 82, 1, 100),
  jpegQuality: getClampedEnvNumber("IMAGE_OPTIMIZATION_JPEG_QUALITY", 82, 1, 100),
  pngCompressionLevel: getClampedEnvNumber(
    "IMAGE_OPTIMIZATION_PNG_COMPRESSION_LEVEL",
    9,
    0,
    9,
  ),
  minBytes: getOptionalIntAllowingZero("IMAGE_OPTIMIZATION_MIN_BYTES", 200_000),
  cacheEnabled: getOptionalBoolean("IMAGE_OPTIMIZATION_CACHE_ENABLED", true),
});

const resolveSavePerfConfig = (): SavePerfConfig => ({
  enabled: getOptionalBoolean("SAVE_PERF_LOG_ENABLED", true),
  slowMs: getRequiredEnvNumber("SAVE_PERF_SLOW_MS", 1000),
});

/**
 * Optional Redis layer. Default OFF so existing PostgreSQL-only deployments are
 * unaffected; the docker-compose quickstart opts in via REDIS_ENABLED=true.
 */
const resolveRedisConfig = (): RedisConfig => ({
  enabled: getOptionalBoolean("REDIS_ENABLED", false),
  url: getOptionalEnv("REDIS_URL", "redis://redis:6379"),
  prefix: getOptionalEnv("REDIS_PREFIX", "excalidash:"),
  cacheTtlSeconds: getRequiredEnvNumber("REDIS_CACHE_TTL_SECONDS", 300),
  drawingCacheTtlSeconds: getRequiredEnvNumber(
    "REDIS_DRAWING_CACHE_TTL_SECONDS",
    600,
  ),
  metadataCacheTtlSeconds: getRequiredEnvNumber(
    "REDIS_METADATA_CACHE_TTL_SECONDS",
    300,
  ),
  saveLockTtlSeconds: getRequiredEnvNumber("REDIS_SAVE_LOCK_TTL_SECONDS", 30),
  saveQueueEnabled: getOptionalBoolean("REDIS_SAVE_QUEUE_ENABLED", true),
  maxValueBytes: getRequiredEnvNumber("REDIS_MAX_VALUE_BYTES", 10 * 1024 * 1024),
});

const resolveLocalFileStorageConfig = (): LocalFileStorageConfig => ({
  enabled: getOptionalBoolean("LOCAL_FILE_STORAGE_ENABLED", false),
  dir: getOptionalEnv("LOCAL_FILE_STORAGE_DIR", "/app/data/files"),
});

const resolvedNodeEnv = getOptionalEnv("NODE_ENV", "development");
const resolvedAuthMode = parseAuthMode(process.env.AUTH_MODE);
const runtimeSecrets = resolveRuntimeSecrets({ nodeEnv: resolvedNodeEnv });

export const config: Config = {
  port: getRequiredEnvNumber("PORT", 8000),
  nodeEnv: resolvedNodeEnv,
  appUrl: getOptionalEnv(
    "APP_URL",
    parseFrontendUrl(process.env.FRONTEND_URL) || "http://localhost:6767",
  ),
  databaseUrl: process.env.DATABASE_URL,
  frontendUrl: parseFrontendUrl(process.env.FRONTEND_URL),
  authMode: resolvedAuthMode,
  jwtSecret: runtimeSecrets.values.JWT_SECRET,
  jwtAccessExpiresIn: getOptionalEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  jwtRefreshExpiresIn: getOptionalEnv("JWT_REFRESH_EXPIRES_IN", "7d"),
  rateLimitMaxRequests: getRequiredEnvNumber("RATE_LIMIT_MAX_REQUESTS", 1000),
  csrfMaxRequests: getRequiredEnvNumber("CSRF_MAX_REQUESTS", 60),
  csrfSecret: runtimeSecrets.values.CSRF_SECRET,
  apiKeySecret: runtimeSecrets.values.API_KEY_SECRET,
  oidc: resolveOidcConfig(resolvedAuthMode),
  enablePasswordReset: getOptionalBoolean("ENABLE_PASSWORD_RESET", false),
  enableRefreshTokenRotation: getOptionalBoolean(
    "ENABLE_REFRESH_TOKEN_ROTATION",
    true,
  ),
  enableAuditLogging: getOptionalBoolean("ENABLE_AUDIT_LOGGING", false),
  enforceHttpsRedirect: getOptionalBoolean("ENFORCE_HTTPS_REDIRECT", true),
  bootstrapSetupCodeTtlMs: getRequiredEnvNumber(
    "BOOTSTRAP_SETUP_CODE_TTL_MS",
    15 * 60 * 1000,
  ),
  bootstrapSetupCodeMaxAttempts: getRequiredEnvNumber(
    "BOOTSTRAP_SETUP_CODE_MAX_ATTEMPTS",
    10,
  ),
  limits: loadRequestLimits(),
  libraries: resolveLibraryConfig(),
  mcp: resolveMcpConfig(),
  snapshots: resolveSnapshotConfig(),
  imageOptimization: resolveImageOptimizationConfig(),
  savePerf: resolveSavePerfConfig(),
  redis: resolveRedisConfig(),
  localFileStorage: resolveLocalFileStorageConfig(),
  runtimeSecrets: runtimeSecrets.metadata,
};

if (config.nodeEnv === "production") {
  const normalizedSecret = config.jwtSecret.trim();
  const normalizedApiKeySecret = config.apiKeySecret.trim();
  const insecureJwtSecretPlaceholders = new Set([
    "your-secret-key-change-in-production",
    "change-this-secret-in-production-min-32-chars",
  ]);
  const insecureApiKeySecretPlaceholders = new Set([
    "change_me_strong_random_secret",
    "change-this-api-key-secret-in-production",
  ]);

  if (config.jwtSecret.length < 32) {
    throw new Error(
      "JWT_SECRET must be at least 32 characters long in production",
    );
  }
  if (insecureJwtSecretPlaceholders.has(normalizedSecret)) {
    throw new Error(
      "JWT_SECRET must be changed from placeholder/default value in production",
    );
  }
  if (config.apiKeySecret.length < 32) {
    throw new Error(
      "API_KEY_SECRET must be at least 32 characters long in production",
    );
  }
  if (insecureApiKeySecretPlaceholders.has(normalizedApiKeySecret)) {
    throw new Error(
      "API_KEY_SECRET must be changed from placeholder/default value in production",
    );
  }
  if (
    config.oidc.enabled &&
    config.oidc.redirectUri &&
    !/^https:\/\//i.test(config.oidc.redirectUri)
  ) {
    throw new Error("OIDC_REDIRECT_URI must be HTTPS in production");
  }
}

console.log("Configuration validated successfully");
console.log(
  "[config] Effective payload/import limits:",
  summarizeRequestLimits(config.limits),
);
