export const buildMcpUrl = (origin: string): string =>
  new URL("/mcp", origin).toString();
