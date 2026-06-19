/**
 * Public surface of the ExcaliDash MCP server.
 */
export { registerMcpServer, buildToolRegistry } from "./server";
export type { McpConfig } from "./types";
export { handleMcpMessage, MCP_PROTOCOL_VERSION } from "./transport/jsonRpc";
