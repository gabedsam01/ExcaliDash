/**
 * validate_architecture — classify nodes into architectural layers and check
 * coherence/dependency rules (frontend→DB, infra→domain, domain→framework,
 * dependency inversion, missing trust boundary, MCP separation).
 */
import type { GraphEdge, GraphNode } from "../layout/graphLayout";

export type ArchLayer =
  | "presentation"
  | "controller"
  | "application"
  | "domain"
  | "infrastructure"
  | "security"
  | "external"
  | "unknown";

const LAYER_RANK: Record<ArchLayer, number> = {
  presentation: 6,
  controller: 5,
  application: 4,
  domain: 3,
  infrastructure: 2,
  external: 1,
  security: 5,
  unknown: 0,
};

const KEYWORDS: Array<{ layer: ArchLayer; words: string[] }> = [
  {
    layer: "presentation",
    words: ["ui", "frontend", "web app", "web ", "view", "component", "page", "react", "vue", "wireframe", "dashboard", "browser"],
  },
  {
    layer: "controller",
    words: ["controller", "adapter", "handler", "route", "gateway", "http", "rest", "graphql", "endpoint", "transport"],
  },
  {
    layer: "application",
    words: ["use case", "usecase", "application", "interactor", "service", "orchestrat", "workflow", "command", "query handler"],
  },
  {
    layer: "domain",
    words: ["domain", "entity", "entities", "aggregate", "value object", "business", "core"],
  },
  {
    layer: "infrastructure",
    words: ["repository", "database", "postgres", "mysql", "sql", "redis", "cache", "queue", "kafka", "storage", "volume", "infra", "db", "datastore", "table"],
  },
  {
    layer: "security",
    words: ["auth", "api key", "jwt", "oauth", "waf", "firewall", "trust", "iam", "security"],
  },
  {
    layer: "external",
    words: ["external", "third party", "3rd party", "github", "stripe", "provider", "internet", "client", "user", "person"],
  },
];

export const classifyLayer = (label: string): ArchLayer => {
  const text = label.toLowerCase();
  for (const { layer, words } of KEYWORDS) {
    if (words.some((w) => text.includes(w))) return layer;
  }
  return "unknown";
};

export interface ArchIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  from?: string;
  to?: string;
}

export interface ArchValidationResult {
  valid: boolean;
  issues: ArchIssue[];
  layers: Record<string, ArchLayer>;
  summary: string;
}

export const validateArchitecture = (
  nodes: GraphNode[],
  edges: GraphEdge[],
): ArchValidationResult => {
  const layerById = new Map<string, ArchLayer>();
  const labelById = new Map<string, string>();
  for (const node of nodes) {
    layerById.set(node.id, classifyLayer(node.label));
    labelById.set(node.id, node.label);
  }

  const issues: ArchIssue[] = [];
  const layerSet = new Set(layerById.values());
  const labelOf = (id: string) => labelById.get(id) ?? id;

  for (const edge of edges) {
    const from = layerById.get(edge.from) ?? "unknown";
    const to = layerById.get(edge.to) ?? "unknown";

    if (from === "presentation" && to === "infrastructure") {
      issues.push({
        code: "FRONTEND_TO_DB",
        severity: "error",
        message: `Presentation "${labelOf(edge.from)}" depends directly on data/infrastructure "${labelOf(edge.to)}".`,
        from: edge.from,
        to: edge.to,
      });
    }
    if (from === "infrastructure" && to === "domain") {
      issues.push({
        code: "INFRA_INTO_DOMAIN",
        severity: "error",
        message: `Infrastructure "${labelOf(edge.from)}" reaches into the domain "${labelOf(edge.to)}".`,
        from: edge.from,
        to: edge.to,
      });
    }
    if (
      from === "domain" &&
      (to === "infrastructure" || to === "controller" || to === "presentation")
    ) {
      issues.push({
        code: "DOMAIN_DEPENDS_FRAMEWORK",
        severity: "error",
        message: `Domain "${labelOf(edge.from)}" depends on an outer layer "${labelOf(edge.to)}" (should depend inward only).`,
        from: edge.from,
        to: edge.to,
      });
    }
    // Dependency inversion: inner depending on a strictly outer layer.
    if (
      from !== "unknown" &&
      to !== "unknown" &&
      from !== "security" &&
      to !== "security" &&
      from !== "external" &&
      LAYER_RANK[from] < LAYER_RANK[to] &&
      !(from === "domain" && to === "controller") // already covered above
    ) {
      issues.push({
        code: "DEPENDENCY_INVERSION",
        severity: "warning",
        message: `Dependency points outward: "${labelOf(edge.from)}" (${from}) → "${labelOf(edge.to)}" (${to}).`,
        from: edge.from,
        to: edge.to,
      });
    }
    // Database reached directly from untrusted/external with no security hop.
    if (from === "external" && to === "infrastructure") {
      issues.push({
        code: "DB_NO_BOUNDARY",
        severity: "warning",
        message: `Data store "${labelOf(edge.to)}" is reached directly from "${labelOf(edge.from)}" with no trust boundary.`,
        from: edge.from,
        to: edge.to,
      });
    }
  }

  // Scene-level checks.
  if (
    (layerSet.has("presentation") || layerSet.has("external")) &&
    layerSet.has("infrastructure") &&
    !layerSet.has("security")
  ) {
    issues.push({
      code: "AUTH_NO_BOUNDARY",
      severity: "warning",
      message:
        "The diagram exposes data/infrastructure but shows no auth/API-key trust boundary.",
    });
  }

  const looksLikeMcp = nodes.some((n) => /mcp/i.test(n.label));
  if (looksLikeMcp) {
    const hasTransport = nodes.some((n) => /transport|http|\/mcp|json-?rpc/i.test(n.label));
    const hasAuth = nodes.some((n) => /auth|bearer|api key/i.test(n.label));
    const hasStorage = nodes.some((n) => layerById.get(n.id) === "infrastructure");
    if (!(hasTransport && hasAuth && hasStorage)) {
      issues.push({
        code: "MCP_NO_SEPARATION",
        severity: "warning",
        message:
          "MCP architecture should separate transport, auth and storage; one or more is missing.",
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  return {
    valid: errors === 0,
    issues,
    layers: Object.fromEntries(layerById),
    summary: `${nodes.length} components, ${edges.length} dependencies — ${errors} error(s), ${warnings} warning(s).`,
  };
};
