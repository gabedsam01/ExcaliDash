import crypto from "crypto";
import fs from "fs";
import path from "path";

export const RUNTIME_SECRET_KEYS = [
  "JWT_SECRET",
  "CSRF_SECRET",
  "API_KEY_SECRET",
] as const;

export type RuntimeSecretKey = (typeof RUNTIME_SECRET_KEYS)[number];
export type RuntimeSecretSource =
  | "environment"
  | "generated"
  | "generated-persistent";

export type RuntimeSecretMetadata = {
  defined: true;
  source: RuntimeSecretSource;
  fingerprint: string;
};

export type RuntimeSecretsResult = {
  values: Record<RuntimeSecretKey, string>;
  metadata: Record<RuntimeSecretKey, RuntimeSecretMetadata>;
  secretsFile: string | null;
};

type Environment = Record<string, string | undefined>;

const INSECURE_SECRET_VALUES = new Set([
  "change_me",
  "change-me",
  "change_me_strong_random_secret",
  "change_me_please_generate_a_long_random_secret",
  "change-this-secret-in-production",
  "change-this-secret-in-production-min-32-chars",
  "change-this-api-key-secret-in-production",
  "generate_with_quickstart",
  "your-secret-key-change-in-production",
]);

export const isInsecureSecretValue = (
  value: string | null | undefined,
): boolean => {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized.length === 0) return true;
  if (/[\r\n]/.test(value ?? "")) return true;
  if (INSECURE_SECRET_VALUES.has(normalized)) return true;
  return (
    normalized.startsWith("change_me") ||
    normalized.startsWith("change-me") ||
    normalized.startsWith("generate_with_")
  );
};

export const fingerprintSecret = (value: string): string =>
  `sha256:${crypto.createHash("sha256").update(value).digest("hex").slice(0, 12)}`;

const parseSecretsFile = (
  filePath: string,
): Partial<Record<RuntimeSecretKey, string>> => {
  try {
    const contents = fs.readFileSync(filePath, "utf8");
    fs.chmodSync(filePath, 0o600);
    const parsed: Partial<Record<RuntimeSecretKey, string>> = {};
    for (const line of contents.split(/\r?\n/)) {
      const separator = line.indexOf("=");
      if (separator <= 0) continue;
      const key = line.slice(0, separator) as RuntimeSecretKey;
      if (!RUNTIME_SECRET_KEYS.includes(key)) continue;
      parsed[key] = line.slice(separator + 1).trim();
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
};

const persistSecretsFile = (
  filePath: string,
  values: Record<RuntimeSecretKey, string>,
): void => {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  const body =
    RUNTIME_SECRET_KEYS.map((key) => `${key}=${values[key]}`).join("\n") + "\n";
  fs.writeFileSync(temporaryPath, body, { mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
  fs.chmodSync(filePath, 0o600);
};

export const resolveRuntimeSecrets = (options?: {
  env?: Environment;
  nodeEnv?: string;
  dataDir?: string;
  logger?: (message: string) => void;
}): RuntimeSecretsResult => {
  const env = options?.env ?? process.env;
  const nodeEnv = options?.nodeEnv ?? env.NODE_ENV ?? "development";
  const logger = options?.logger ?? ((message: string) => console.log(message));
  const shouldPersist = nodeEnv === "production";
  const dataDir =
    options?.dataDir ??
    env.RUNTIME_DATA_DIR ??
    path.resolve(process.cwd(), "data");
  const secretsFile = shouldPersist
    ? path.join(dataDir, "secrets.env")
    : null;
  const persisted = secretsFile ? parseSecretsFile(secretsFile) : {};
  const values = {} as Record<RuntimeSecretKey, string>;
  const metadata = {} as Record<RuntimeSecretKey, RuntimeSecretMetadata>;
  let generatedAny = false;

  for (const key of RUNTIME_SECRET_KEYS) {
    const provided = env[key];
    if (!isInsecureSecretValue(provided)) {
      values[key] = provided!.trim();
      metadata[key] = {
        defined: true,
        source: "environment",
        fingerprint: fingerprintSecret(values[key]),
      };
      logger(
        `[security] ${key} loaded from environment (${metadata[key].fingerprint})`,
      );
      continue;
    }

    const persistedValue = persisted[key];
    if (shouldPersist && !isInsecureSecretValue(persistedValue)) {
      values[key] = persistedValue!.trim();
      metadata[key] = {
        defined: true,
        source: "generated-persistent",
        fingerprint: fingerprintSecret(values[key]),
      };
      logger(
        `[security] ${key} loaded from persistent storage (${metadata[key].fingerprint})`,
      );
      continue;
    }

    values[key] = crypto.randomBytes(64).toString("hex");
    metadata[key] = {
      defined: true,
      source: shouldPersist ? "generated-persistent" : "generated",
      fingerprint: fingerprintSecret(values[key]),
    };
    generatedAny = generatedAny || shouldPersist;
    logger(
      `[security] ${key} generated with 512 bits (${metadata[key].fingerprint})`,
    );
  }

  if (secretsFile && generatedAny) {
    persistSecretsFile(secretsFile, values);
    logger("[security] Generated runtime secrets saved to persistent storage");
  }

  for (const key of RUNTIME_SECRET_KEYS) {
    env[key] = values[key];
  }

  return { values, metadata, secretsFile };
};
