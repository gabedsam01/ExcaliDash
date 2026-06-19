/**
 * Typed error for the library subsystem so routes can map failures to precise
 * HTTP status codes (validation, size limits, not-found, upstream failures)
 * instead of a blanket 500.
 */
export class LibraryError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = "LIBRARY_ERROR") {
    super(message);
    this.name = "LibraryError";
    this.status = status;
    this.code = code;
  }
}

export const isLibraryError = (error: unknown): error is LibraryError =>
  error instanceof LibraryError;
