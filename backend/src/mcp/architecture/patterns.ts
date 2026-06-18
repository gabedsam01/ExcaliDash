/**
 * apply_architecture_skill, suggest_architecture_improvements,
 * create_from_repo_analysis and convert_diagram_type logic.
 */
import type { ExcalidrawScene } from "../types";
import {
  layoutGraph,
  type GraphEdge,
  type GraphNode,
} from "../layout/graphLayout";
import { getPreset } from "../templates/presets";
import { validateArchitecture } from "./validator";

const n = (id: string, label: string, group?: string): GraphNode => ({
  id,
  label,
  group,
});
const e = (from: string, to: string, label?: string): GraphEdge => ({
  from,
  to,
  label,
});

interface PatternDef {
  title: string;
  direction: "TB" | "LR";
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const ARCHITECTURE_PATTERNS: Record<string, PatternDef> = {
  clean: {
    title: "Clean Architecture",
    direction: "TB",
    nodes: [
      n("frameworks", "Frameworks & Drivers", "outer"),
      n("adapters", "Interface Adapters", "mid"),
      n("usecases", "Use Cases", "inner"),
      n("entities", "Entities", "core"),
    ],
    edges: [e("frameworks", "adapters"), e("adapters", "usecases"), e("usecases", "entities")],
  },
  hexagonal: {
    title: "Hexagonal Architecture",
    direction: "TB",
    nodes: [
      n("ui", "UI Adapter", "driving"),
      n("api", "HTTP Adapter", "driving"),
      n("app", "Application Service", "port"),
      n("domain", "Domain Core", "core"),
      n("db", "DB Adapter", "driven"),
      n("ext", "External Adapter", "driven"),
    ],
    edges: [e("ui", "app"), e("api", "app"), e("app", "domain"), e("domain", "db"), e("domain", "ext")],
  },
  ddd: {
    title: "Domain-Driven Design",
    direction: "TB",
    nodes: [
      n("ctxA", "Ordering Context", "context"),
      n("ctxB", "Billing Context", "context"),
      n("shared", "Shared Kernel", "shared"),
      n("events", "Domain Events", "events"),
    ],
    edges: [e("ctxA", "shared"), e("ctxB", "shared"), e("ctxA", "events"), e("events", "ctxB")],
  },
  c4: {
    title: "C4 Container",
    direction: "TB",
    nodes: [
      n("web", "Web App", "app"),
      n("api", "API", "app"),
      n("db", "Database", "data"),
      n("ext", "External System", "external"),
    ],
    edges: [e("web", "api"), e("api", "db"), e("api", "ext")],
  },
  cqrs: {
    title: "CQRS",
    direction: "TB",
    nodes: [
      n("client", "Client", "client"),
      n("command", "Command Handler", "write"),
      n("write", "Write Model", "write"),
      n("bus", "Event Bus", "events"),
      n("projection", "Projection", "read"),
      n("read", "Read Model", "read"),
      n("query", "Query Handler", "read"),
    ],
    edges: [
      e("client", "command"),
      e("command", "write"),
      e("write", "bus"),
      e("bus", "projection"),
      e("projection", "read"),
      e("client", "query"),
      e("query", "read"),
    ],
  },
  "event-driven": {
    title: "Event-Driven Architecture",
    direction: "TB",
    nodes: [
      n("producer", "Producer", "app"),
      n("bus", "Event Bus", "events"),
      n("consumerA", "Consumer A", "app"),
      n("consumerB", "Consumer B", "app"),
      n("store", "Event Store", "data"),
    ],
    edges: [
      e("producer", "bus"),
      e("bus", "consumerA"),
      e("bus", "consumerB"),
      e("bus", "store"),
    ],
  },
  microservices: {
    title: "Microservices",
    direction: "TB",
    nodes: [
      n("gateway", "API Gateway", "edge"),
      n("svcA", "Orders Service", "service"),
      n("svcB", "Payments Service", "service"),
      n("svcC", "Users Service", "service"),
      n("dbA", "Orders DB", "data"),
      n("dbB", "Payments DB", "data"),
      n("dbC", "Users DB", "data"),
    ],
    edges: [
      e("gateway", "svcA"),
      e("gateway", "svcB"),
      e("gateway", "svcC"),
      e("svcA", "dbA"),
      e("svcB", "dbB"),
      e("svcC", "dbC"),
    ],
  },
  "modular-monolith": {
    title: "Modular Monolith",
    direction: "TB",
    nodes: [
      n("app", "Application Shell", "app"),
      n("modA", "Orders Module", "module"),
      n("modB", "Billing Module", "module"),
      n("modC", "Identity Module", "module"),
      n("db", "Shared Database", "data"),
    ],
    edges: [
      e("app", "modA"),
      e("app", "modB"),
      e("app", "modC"),
      e("modA", "db"),
      e("modB", "db"),
      e("modC", "db"),
    ],
  },
  mcp: {
    title: "MCP Architecture",
    direction: "TB",
    nodes: [
      n("client", "MCP Client", "client"),
      n("transport", "/mcp Transport", "edge"),
      n("auth", "Auth (Bearer)", "edge"),
      n("registry", "Tool Registry", "core"),
      n("services", "Tool Services", "service"),
      n("db", "PostgreSQL", "data"),
    ],
    edges: [
      e("client", "transport"),
      e("transport", "auth"),
      e("auth", "registry"),
      e("registry", "services"),
      e("services", "db"),
    ],
  },
};

export const ARCHITECTURE_PATTERN_IDS = Object.keys(ARCHITECTURE_PATTERNS);

export const applyArchitectureSkill = (
  pattern: string,
  presetId?: string,
  title?: string,
): { scene: ExcalidrawScene; pattern: string } | null => {
  const def = ARCHITECTURE_PATTERNS[pattern];
  if (!def) return null;
  const preset = getPreset(presetId);
  const scene = layoutGraph(def.nodes, def.edges, {
    preset,
    title: title ?? def.title,
    direction: def.direction,
  });
  return { scene, pattern };
};

export interface Suggestion {
  title: string;
  rationale: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  action: string;
}

const IMPACT_RANK = { high: 3, medium: 2, low: 1 } as const;
const EFFORT_RANK = { low: 1, medium: 2, high: 3 } as const;

export const suggestImprovements = (
  nodes: GraphNode[],
  edges: GraphEdge[],
): { suggestions: Suggestion[]; validation: ReturnType<typeof validateArchitecture> } => {
  const validation = validateArchitecture(nodes, edges);
  const suggestions: Suggestion[] = [];

  for (const issue of validation.issues) {
    if (issue.code === "FRONTEND_TO_DB") {
      suggestions.push({
        title: "Insert an API/service layer between UI and database",
        rationale: issue.message,
        impact: "high",
        effort: "medium",
        action: "Route presentation access through a controller + service rather than the data store.",
      });
    } else if (issue.code === "AUTH_NO_BOUNDARY") {
      suggestions.push({
        title: "Add an explicit trust boundary (auth / API key)",
        rationale: issue.message,
        impact: "high",
        effort: "low",
        action: "Introduce an auth/API-key node and a boundary frame around trusted services.",
      });
    } else if (issue.code === "DEPENDENCY_INVERSION" || issue.code === "DOMAIN_DEPENDS_FRAMEWORK") {
      suggestions.push({
        title: "Invert outward dependencies (DIP)",
        rationale: issue.message,
        impact: "medium",
        effort: "medium",
        action: "Depend on abstractions (ports); keep the domain free of framework/infrastructure references.",
      });
    } else if (issue.code === "INFRA_INTO_DOMAIN") {
      suggestions.push({
        title: "Stop infrastructure from reaching into the domain",
        rationale: issue.message,
        impact: "high",
        effort: "medium",
        action: "Expose domain operations via ports; let infrastructure implement them, not call inward.",
      });
    } else if (issue.code === "MCP_NO_SEPARATION") {
      suggestions.push({
        title: "Separate MCP transport, auth and storage",
        rationale: issue.message,
        impact: "medium",
        effort: "low",
        action: "Model distinct transport, auth and storage nodes with clear boundaries.",
      });
    }
  }

  if (nodes.length > 8) {
    suggestions.push({
      title: "Adopt C4 levels to manage complexity",
      rationale: `The diagram has ${nodes.length} components; a single level is hard to read.`,
      impact: "medium",
      effort: "medium",
      action: "Split into C4 Context + Container levels (use convert_diagram_type → c4_container).",
    });
  }
  if (edges.length >= 4 && nodes.every((node) => /service|api|worker/i.test(node.label) === false) === false) {
    suggestions.push({
      title: "Consider an async boundary (queue/event bus)",
      rationale: "Long synchronous chains couple services and reduce resilience.",
      impact: "medium",
      effort: "medium",
      action: "Introduce a queue/event bus between services that can run asynchronously.",
    });
  }

  // Dedupe by title and sort by impact desc then effort asc.
  const seen = new Set<string>();
  const unique = suggestions.filter((s) =>
    seen.has(s.title) ? false : (seen.add(s.title), true),
  );
  unique.sort(
    (a, b) =>
      IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact] ||
      EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort],
  );
  return { suggestions: unique, validation };
};

export interface RepoAnalysis {
  name?: string;
  entrypoints?: string[];
  modules?: Array<{ name: string; layer?: string } | string>;
  services?: string[];
  database?: string[];
  integrations?: string[];
  boundaries?: string[];
}

const moduleName = (m: { name: string } | string): string =>
  typeof m === "string" ? m : m.name;

export const buildFromRepoAnalysis = (
  analysis: RepoAnalysis,
  presetId?: string,
): ExcalidrawScene => {
  const preset = getPreset(presetId);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const ids = new Set<string>();
  const add = (id: string, label: string, group?: string) => {
    if (ids.has(id)) return id;
    ids.add(id);
    nodes.push({ id, label, group });
    return id;
  };
  const slug = (s: string, prefix: string) =>
    `${prefix}_${s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;

  const entryIds = (analysis.entrypoints ?? []).map((label) =>
    add(slug(label, "entry"), label, "entry"),
  );
  const serviceLabels = [
    ...(analysis.services ?? []),
    ...((analysis.modules ?? []).map(moduleName)),
  ];
  const serviceIds = serviceLabels.map((label) =>
    add(slug(label, "svc"), label, "service"),
  );
  const dbIds = (analysis.database ?? []).map((label) =>
    add(slug(label, "db"), label, "data"),
  );
  const intIds = (analysis.integrations ?? []).map((label) =>
    add(slug(label, "ext"), label, "external"),
  );

  if (entryIds.length === 0 && serviceIds.length > 0) {
    entryIds.push(add("entry_client", "Client", "entry"));
  }

  for (const entry of entryIds) {
    for (const svc of serviceIds.slice(0, Math.max(1, serviceIds.length))) {
      edges.push({ from: entry, to: svc });
    }
    if (serviceIds.length === 0) {
      for (const db of dbIds) edges.push({ from: entry, to: db });
    }
  }
  for (const svc of serviceIds) {
    for (const db of dbIds) edges.push({ from: svc, to: db });
    for (const ext of intIds) edges.push({ from: svc, to: ext });
  }

  if (nodes.length === 0) {
    add("system", analysis.name ?? "System", "system");
  }

  return layoutGraph(nodes, edges, {
    preset,
    title: analysis.name ? `${analysis.name} — Architecture` : "Repository Architecture",
    direction: "TB",
  });
};

export const convertDiagram = (
  nodes: GraphNode[],
  edges: GraphEdge[],
  targetType: string,
  presetId?: string,
): ExcalidrawScene => {
  const preset = getPreset(presetId);
  const direction: "TB" | "LR" = /sequence|swimlane|timeline|deployment/i.test(
    targetType,
  )
    ? "LR"
    : "TB";
  const title = targetType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return layoutGraph(nodes, edges, { preset, title, direction });
};
