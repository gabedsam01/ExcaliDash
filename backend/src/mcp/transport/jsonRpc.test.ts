import { describe, expect, it } from "vitest";
import { handleMcpMessage } from "./jsonRpc";
import { buildToolRegistry, type ToolContext } from "../registry/toolRegistry";
import type { McpConfig } from "../types";

const config: McpConfig = {
  enabled: true,
  endpointPath: "/mcp",
  minDrawingScore: 95,
  maxRepairAttempts: 5,
  allowLowScoreDraft: true,
  maxElements: 5000,
  maxExportMb: 100,
  defaultLibraryMode: "curated",
  publicSearchEnabled: false,
  rateLimitWindowSeconds: 900,
  rateLimitMax: 300,
  validateOrigin: true,
};

const tools = buildToolRegistry();
const serverInfo = { name: "excalidash", version: "0.5.0" };
const ctx = {
  principal: { userId: "u1", apiKeyId: "k1" },
  config,
  // services not needed for the methods exercised here
  drawingService: {} as never,
  libraryAdapter: {} as never,
} as ToolContext;

const call = (message: Record<string, unknown>) =>
  handleMcpMessage(message, ctx, tools, serverInfo);

describe("MCP JSON-RPC transport", () => {
  it("handles initialize and echoes the protocol version", async () => {
    const res = await call({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18" },
    });
    expect(res).toBeTruthy();
    const result = (res as { result: any }).result;
    expect(result.serverInfo.name).toBe("excalidash");
    expect(result.protocolVersion).toBe("2025-06-18");
    expect(result.capabilities.tools).toBeTruthy();
  });

  it("lists exactly 25 tools with input schemas", async () => {
    const res = await call({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    const result = (res as { result: any }).result;
    expect(result.tools).toHaveLength(25);
    for (const t of result.tools) {
      expect(t.name).toBeTruthy();
      expect(t.inputSchema.type).toBe("object");
    }
  });

  it("calls read_mcp_guide", async () => {
    const res = await call({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "read_mcp_guide", arguments: {} },
    });
    const result = (res as { result: any }).result;
    expect(result.content[0].text).toContain("ExcaliDash MCP");
    expect(result.structuredContent.minimumScore).toBe(95);
  });

  it("calls list_templates and returns 13 templates", async () => {
    const res = await call({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "list_templates", arguments: {} },
    });
    const result = (res as { result: any }).result;
    expect(result.structuredContent.templates).toHaveLength(13);
    expect(result.structuredContent.presets).toHaveLength(6);
  });

  it("returns -32601 for an unknown method", async () => {
    const res = await call({ jsonrpc: "2.0", id: 5, method: "does/not/exist" });
    expect((res as { error: any }).error.code).toBe(-32601);
  });

  it("returns -32602 for an unknown tool", async () => {
    const res = await call({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "no_such_tool", arguments: {} },
    });
    expect((res as { error: any }).error.code).toBe(-32602);
  });

  it("treats messages without an id as notifications (no response)", async () => {
    const res = await call({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(res).toBeUndefined();
  });

  it("reports invalid tool arguments as a tool error, not a crash", async () => {
    const res = await call({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name: "create_drawing", arguments: {} }, // missing name
    });
    const result = (res as { result: any }).result;
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/Invalid arguments/i);
  });

  it("reports domain errors (no scene) as a tool error", async () => {
    const res = await call({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: { name: "score_drawing", arguments: {} },
    });
    const result = (res as { result: any }).result;
    expect(result.isError).toBe(true);
  });
});
