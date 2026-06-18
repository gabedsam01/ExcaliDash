/**
 * Structured error for MCP tools. Tools throw McpToolError; the dispatcher maps
 * it to an MCP tool result with isError=true (and a clear code/message).
 */
export class McpToolError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = "MCP_TOOL_ERROR", status = 400) {
    super(message);
    this.name = "McpToolError";
    this.code = code;
    this.status = status;
  }
}

export const notFound = (message: string): McpToolError =>
  new McpToolError(message, "NOT_FOUND", 404);
export const forbidden = (message: string): McpToolError =>
  new McpToolError(message, "FORBIDDEN", 403);
export const invalid = (message: string): McpToolError =>
  new McpToolError(message, "INVALID_INPUT", 400);

export const isMcpToolError = (e: unknown): e is McpToolError =>
  e instanceof McpToolError;
