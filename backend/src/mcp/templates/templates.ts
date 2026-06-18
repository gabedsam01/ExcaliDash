/**
 * Built-in diagram templates. Each renders via the layered graph layout, so
 * every template produces a clean, on-grid, bound-arrow scene that passes the
 * quality bar. create_from_template can augment a template with structured
 * input (extra nodes/edges).
 */
import type { ExcalidrawScene } from "../types";
import {
  layoutGraph,
  type GraphEdge,
  type GraphNode,
} from "../layout/graphLayout";
import { getPreset, type VisualPreset } from "./presets";

export interface TemplateInput {
  presetId?: string;
  title?: string;
  extraNodes?: GraphNode[];
  extraEdges?: GraphEdge[];
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  diagramType: string;
  direction: "TB" | "LR";
  skills: string[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  defaultPreset?: string;
}

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

export const TEMPLATES: TemplateDef[] = [
  {
    id: "c4_context",
    name: "C4 — System Context",
    description: "Level 1 C4: people and external systems around your system.",
    diagramType: "c4",
    direction: "TB",
    skills: ["software-architecture-diagrams"],
    nodes: [
      n("user", "User\n[Person]", "actor"),
      n("system", "ExcaliDash\n[Software System]", "system"),
      n("github", "Excalidraw Catalog\n[External]", "external"),
      n("auth", "Auth Provider\n[External]", "external"),
    ],
    edges: [
      e("user", "system", "uses"),
      e("system", "github", "fetches libraries"),
      e("user", "auth", "authenticates"),
      e("system", "auth", "verifies"),
    ],
  },
  {
    id: "c4_container",
    name: "C4 — Container",
    description: "Level 2 C4: containers (apps, services, datastores).",
    diagramType: "c4",
    direction: "TB",
    skills: ["software-architecture-diagrams"],
    nodes: [
      n("web", "Web App\n[React]", "app"),
      n("api", "API Backend\n[Express]", "app"),
      n("mcp", "MCP Server\n[/mcp]", "app"),
      n("db", "PostgreSQL\n[Database]", "data"),
      n("cache", "Library Cache\n[Volume]", "data"),
    ],
    edges: [
      e("web", "api", "JSON/HTTPS"),
      e("mcp", "api", "internal"),
      e("api", "db", "Prisma"),
      e("api", "cache", "reads/writes"),
    ],
  },
  {
    id: "clean_architecture",
    name: "Clean Architecture",
    description: "Concentric clean-architecture layers (dependencies inward).",
    diagramType: "architecture",
    direction: "TB",
    skills: ["clean-architecture-reviewer", "software-architecture-diagrams"],
    nodes: [
      n("frameworks", "Frameworks & Drivers", "outer"),
      n("adapters", "Interface Adapters", "mid"),
      n("usecases", "Use Cases", "inner"),
      n("entities", "Entities", "core"),
    ],
    edges: [
      e("frameworks", "adapters", "depends on"),
      e("adapters", "usecases", "depends on"),
      e("usecases", "entities", "depends on"),
    ],
  },
  {
    id: "hexagonal_architecture",
    name: "Hexagonal (Ports & Adapters)",
    description: "Domain core with ports and driving/driven adapters.",
    diagramType: "architecture",
    direction: "TB",
    skills: ["clean-architecture-reviewer", "software-architecture-diagrams"],
    nodes: [
      n("ui", "UI Adapter", "driving"),
      n("api", "HTTP Adapter", "driving"),
      n("app", "Application Service", "port"),
      n("domain", "Domain Core", "core"),
      n("db", "DB Adapter", "driven"),
      n("ext", "External API Adapter", "driven"),
    ],
    edges: [
      e("ui", "app", "port"),
      e("api", "app", "port"),
      e("app", "domain"),
      e("domain", "db", "port"),
      e("domain", "ext", "port"),
    ],
  },
  {
    id: "mcp_server_architecture",
    name: "MCP Server Architecture",
    description: "MCP transport, auth, tool registry and storage boundaries.",
    diagramType: "mcp",
    direction: "TB",
    skills: ["mcp-architecture-diagrams"],
    nodes: [
      n("client", "MCP Client\n[Claude Code]", "client"),
      n("transport", "/mcp Transport\n[JSON-RPC]", "edge"),
      n("auth", "Auth\n[Bearer exd_]", "edge"),
      n("registry", "Tool Registry\n[25 tools]", "core"),
      n("drawings", "Drawing Service", "service"),
      n("libraries", "Library Service", "service"),
      n("db", "PostgreSQL", "data"),
    ],
    edges: [
      e("client", "transport", "HTTPS"),
      e("transport", "auth", "verify"),
      e("auth", "registry", "authorized"),
      e("registry", "drawings", "tools/call"),
      e("registry", "libraries", "tools/call"),
      e("drawings", "db"),
      e("libraries", "db"),
    ],
  },
  {
    id: "api_flow",
    name: "API Request Flow",
    description: "Layered request path from client to database.",
    diagramType: "flow",
    direction: "TB",
    skills: ["software-architecture-diagrams"],
    nodes: [
      n("client", "Client"),
      n("gateway", "API Gateway"),
      n("auth", "Auth Middleware"),
      n("controller", "Controller"),
      n("service", "Service"),
      n("repo", "Repository"),
      n("db", "Database"),
    ],
    edges: [
      e("client", "gateway"),
      e("gateway", "auth"),
      e("auth", "controller"),
      e("controller", "service"),
      e("service", "repo"),
      e("repo", "db"),
    ],
  },
  {
    id: "n8n_workflow",
    name: "n8n Workflow",
    description: "Automation workflow nodes (trigger to response).",
    diagramType: "workflow",
    direction: "LR",
    skills: ["n8n-workflow-diagrams"],
    nodes: [
      n("trigger", "Webhook Trigger"),
      n("fn", "Function"),
      n("http", "HTTP Request"),
      n("if", "IF"),
      n("set", "Set"),
      n("respond", "Respond to Webhook"),
    ],
    edges: [
      e("trigger", "fn"),
      e("fn", "http"),
      e("http", "if"),
      e("if", "set", "true"),
      e("set", "respond"),
    ],
  },
  {
    id: "database_schema",
    name: "Database Schema",
    description: "Tables with columns and relations.",
    diagramType: "database",
    direction: "TB",
    skills: ["database-diagrams"],
    nodes: [
      n("users", "users\n— id PK\n— email\n— name", "table"),
      n("collections", "collections\n— id PK\n— userId FK\n— name", "table"),
      n("drawings", "drawings\n— id PK\n— userId FK\n— collectionId FK", "table"),
      n("api_keys", "api_keys\n— id PK\n— userId FK\n— prefix", "table"),
    ],
    edges: [
      e("users", "drawings", "1:N"),
      e("collections", "drawings", "1:N"),
      e("users", "api_keys", "1:N"),
    ],
  },
  {
    id: "sequence_flow",
    name: "Sequence Flow",
    description: "Left-to-right request/response sequence.",
    diagramType: "sequence",
    direction: "LR",
    skills: ["software-architecture-diagrams"],
    nodes: [
      n("client", "Client"),
      n("api", "API"),
      n("auth", "Auth"),
      n("db", "Database"),
    ],
    edges: [
      e("client", "api", "request"),
      e("api", "auth", "verify"),
      e("auth", "db", "lookup"),
      e("db", "api", "result"),
      e("api", "client", "response"),
    ],
  },
  {
    id: "swimlane_process",
    name: "Swimlane Process",
    description: "Process steps grouped by actor lanes.",
    diagramType: "swimlane",
    direction: "LR",
    skills: ["troubleshooting-diagrams"],
    nodes: [
      n("u1", "Submit Request", "User"),
      n("s1", "Validate", "System"),
      n("s2", "Process", "System"),
      n("d1", "Persist", "Database"),
      n("u2", "Receive Result", "User"),
    ],
    edges: [
      e("u1", "s1"),
      e("s1", "s2"),
      e("s2", "d1"),
      e("d1", "u2"),
    ],
  },
  {
    id: "security_boundary",
    name: "Security Boundary",
    description: "Trust boundaries from the internet to the data store.",
    diagramType: "security",
    direction: "TB",
    skills: ["security-architecture"],
    nodes: [
      n("internet", "Internet", "untrusted"),
      n("waf", "WAF / Reverse Proxy", "edge"),
      n("app", "Application\n[trust boundary]", "trusted"),
      n("authz", "Auth / API Key", "trusted"),
      n("db", "Database\n[private]", "data"),
    ],
    edges: [
      e("internet", "waf", "HTTPS"),
      e("waf", "app"),
      e("app", "authz", "verify"),
      e("authz", "db", "scoped access"),
    ],
  },
  {
    id: "ui_dashboard_wireframe",
    name: "UI Dashboard Wireframe",
    description: "Low-fidelity dashboard layout regions.",
    diagramType: "wireframe",
    direction: "TB",
    skills: ["ui-wireframes"],
    nodes: [
      n("header", "Header / Nav"),
      n("sidebar", "Sidebar"),
      n("main", "Main Content"),
      n("cards", "Stat Cards"),
      n("footer", "Footer"),
    ],
    edges: [
      e("header", "sidebar"),
      e("sidebar", "main"),
      e("main", "cards"),
      e("cards", "footer"),
    ],
  },
  {
    id: "portfolio_architecture",
    name: "Portfolio Architecture",
    description: "Polished end-to-end system architecture for portfolios.",
    diagramType: "architecture",
    direction: "TB",
    skills: ["portfolio-diagrams", "software-architecture-diagrams"],
    nodes: [
      n("user", "Users"),
      n("cdn", "CDN / Edge"),
      n("frontend", "Frontend"),
      n("api", "API"),
      n("services", "Services"),
      n("db", "Database"),
      n("obs", "Monitoring"),
    ],
    edges: [
      e("user", "cdn"),
      e("cdn", "frontend"),
      e("frontend", "api"),
      e("api", "services"),
      e("services", "db"),
      e("services", "obs"),
    ],
  },
];

export const TEMPLATE_BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]));

export const listTemplates = (): Array<{
  id: string;
  name: string;
  description: string;
  diagramType: string;
  skills: string[];
}> =>
  TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    diagramType: t.diagramType,
    skills: t.skills,
  }));

export const renderTemplate = (
  templateId: string,
  input: TemplateInput = {},
): { scene: ExcalidrawScene; template: TemplateDef } | null => {
  const template = TEMPLATE_BY_ID.get(templateId);
  if (!template) return null;
  const preset: VisualPreset = getPreset(input.presetId ?? template.defaultPreset);
  const nodes = [...template.nodes, ...(input.extraNodes ?? [])];
  const edges = [...template.edges, ...(input.extraEdges ?? [])];
  const scene = layoutGraph(nodes, edges, {
    preset,
    title: input.title ?? template.name,
    direction: template.direction,
  });
  return { scene, template };
};
