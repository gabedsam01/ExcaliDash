import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  fingerprintSecret,
  isInsecureSecretValue,
  resolveRuntimeSecrets,
} from "./runtimeSecrets";

const temporaryDirectories: string[] = [];

const makeTemporaryDirectory = (): string => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "excalidash-secrets-"));
  temporaryDirectories.push(directory);
  return directory;
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("runtime secrets", () => {
  it("replaces insecure placeholders with persistent 512-bit secrets", () => {
    const dataDir = makeTemporaryDirectory();
    const env = {
      JWT_SECRET: "generate_with_quickstart",
      CSRF_SECRET: "change_me",
      API_KEY_SECRET: "",
    };

    const first = resolveRuntimeSecrets({
      env,
      nodeEnv: "production",
      dataDir,
      logger: () => undefined,
    });

    for (const value of Object.values(first.values)) {
      expect(value).toMatch(/^[a-f0-9]{128}$/);
    }
    expect(fs.statSync(path.join(dataDir, "secrets.env")).mode & 0o777).toBe(
      0o600,
    );

    const second = resolveRuntimeSecrets({
      env: {},
      nodeEnv: "production",
      dataDir,
      logger: () => undefined,
    });
    expect(second.values).toEqual(first.values);
    expect(second.metadata.JWT_SECRET.source).toBe("generated-persistent");
  });

  it("keeps secure environment values and reports stable redacted fingerprints", () => {
    const firstSecret = "a".repeat(128);
    const secondSecret = "b".repeat(128);
    const result = resolveRuntimeSecrets({
      env: {
        JWT_SECRET: firstSecret,
        CSRF_SECRET: firstSecret,
        API_KEY_SECRET: firstSecret,
      },
      nodeEnv: "test",
      logger: () => undefined,
    });

    expect(result.values.JWT_SECRET).toBe(firstSecret);
    expect(result.metadata.JWT_SECRET.source).toBe("environment");
    expect(fingerprintSecret(firstSecret)).toBe(fingerprintSecret(firstSecret));
    expect(fingerprintSecret(firstSecret)).not.toBe(
      fingerprintSecret(secondSecret),
    );
    expect(result.metadata.JWT_SECRET.fingerprint).not.toContain(firstSecret);
  });

  it("recognizes empty and documented placeholder values as insecure", () => {
    expect(isInsecureSecretValue("")).toBe(true);
    expect(isInsecureSecretValue("change_me")).toBe(true);
    expect(isInsecureSecretValue("generate_with_quickstart")).toBe(true);
    expect(isInsecureSecretValue("c".repeat(128))).toBe(false);
  });
});
