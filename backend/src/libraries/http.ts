/**
 * Allowlisted HTTP fetch helpers for the library subsystem.
 *
 * Every request goes through `assertAllowedUrl` (official Excalidraw catalog
 * host + path prefix, HTTPS only), has a hard timeout, never follows redirects
 * (so a redirect cannot escape the allowlist), and is size-bounded while
 * streaming (the cap aborts mid-download instead of after buffering).
 */
import { LibraryError } from "./errors";
import { assertAllowedUrl } from "./validators";
import type { FetchLike, FetchResponseLike } from "./types";

export interface FetchOptions {
  timeoutMs: number;
  maxBytes?: number;
  /** Require the `/libraries/` path prefix (for file/preview downloads). */
  requireLibrariesPrefix?: boolean;
}

const fetchAllowed = async (
  fetchImpl: FetchLike,
  rawUrl: string,
  options: FetchOptions,
): Promise<FetchResponseLike> => {
  const parsed = assertAllowedUrl(rawUrl, {
    requireLibrariesPrefix: options.requireLibrariesPrefix,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: FetchResponseLike;
  try {
    response = await fetchImpl(parsed.toString(), {
      signal: controller.signal,
      // Never auto-follow redirects: assertAllowedUrl only validated the
      // initial URL, so following a Location header could escape the allowlist
      // (classic redirect-based SSRF). "manual" yields an opaque redirect we
      // reject below instead of transparently chasing it.
      redirect: "manual",
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new LibraryError(
        `Request timed out after ${options.timeoutMs}ms`,
        504,
        "UPSTREAM_TIMEOUT",
      );
    }
    throw new LibraryError(
      `Failed to fetch ${parsed.toString()}: ${
        error instanceof Error ? error.message : String(error)
      }`,
      502,
      "UPSTREAM_FETCH_FAILED",
    );
  } finally {
    clearTimeout(timer);
  }

  // Reject any redirect (3xx) or opaque-redirect (status 0) — we will not chase
  // it to a host the allowlist never saw.
  if (
    response.status === 0 ||
    (response.status >= 300 && response.status < 400)
  ) {
    throw new LibraryError(
      "Refusing to follow a redirect away from the official Excalidraw catalog",
      502,
      "UPSTREAM_REDIRECT",
    );
  }

  if (!response.ok) {
    throw new LibraryError(
      `Upstream responded ${response.status} ${response.statusText}`,
      502,
      "UPSTREAM_STATUS",
    );
  }

  if (options.maxBytes !== undefined) {
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > options.maxBytes) {
      throw new LibraryError(
        `Library exceeds max size (${declared} > ${options.maxBytes} bytes)`,
        413,
        "LIBRARY_TOO_LARGE",
      );
    }
  }

  return response;
};

/**
 * Read a response body into a Buffer while enforcing `maxBytes` as we go.
 * Streams when the response exposes a body reader (real fetch) so an oversized
 * download is aborted mid-flight rather than fully buffered; falls back to
 * arrayBuffer() (test mocks) with a post-read size check.
 */
const readBodyCapped = async (
  response: FetchResponseLike,
  maxBytes?: number,
): Promise<Buffer> => {
  const stream = response.body;
  if (stream && typeof stream.getReader === "function") {
    const reader = stream.getReader();
    const chunks: Buffer[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      if (maxBytes !== undefined && received > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new LibraryError(
          `Library exceeds max size (> ${maxBytes} bytes)`,
          413,
          "LIBRARY_TOO_LARGE",
        );
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (maxBytes !== undefined && buffer.length > maxBytes) {
    throw new LibraryError(
      `Library exceeds max size (${buffer.length} > ${maxBytes} bytes)`,
      413,
      "LIBRARY_TOO_LARGE",
    );
  }
  return buffer;
};

export const fetchAllowedText = async (
  fetchImpl: FetchLike,
  rawUrl: string,
  options: FetchOptions,
): Promise<string> => {
  const response = await fetchAllowed(fetchImpl, rawUrl, options);
  const buffer = await readBodyCapped(response, options.maxBytes);
  return buffer.toString("utf8");
};

export const fetchAllowedBinary = async (
  fetchImpl: FetchLike,
  rawUrl: string,
  options: FetchOptions,
): Promise<Buffer> => {
  const response = await fetchAllowed(fetchImpl, rawUrl, options);
  return readBodyCapped(response, options.maxBytes);
};
