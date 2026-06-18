/**
 * SPECIALIZED_PACK seed definition.
 *
 * The specialized pack is a *family*: one root pack (`specialized_pack`) plus
 * nine category child packs. A library may belong to multiple categories.
 * Category aliases (cloud, devops, aws, gcp, azure, k8s, ...) are defined in
 * `aliases.ts`.
 *
 * Verified against the official catalog (2026-06). The only names that do not
 * resolve to an exact catalog entry are:
 *   - "Google Architecture Icons" -> resolved via alias to "GCP Icons".
 *   - "Docker" -> not present in the catalog; reported as missing (non-fatal).
 */
import type { SeedLibraryRef, SeedPackDefinition } from "../types";

export const SPECIALIZED_PACK_SLUG = "specialized_pack";

const GOOGLE_ALIASES = [
  "GCP Icons",
  "Google Icons",
  "Original Google Architecture Icons",
  "gcp",
  "google cloud",
];

/** The specialized root pack (holds no membership itself). */
export const SPECIALIZED_PACK: SeedPackDefinition = {
  slug: SPECIALIZED_PACK_SLUG,
  name: "Specialized Pack",
  description:
    "Curated libraries grouped into specialized categories (cloud/devops, data, UI, ...).",
  kind: "SPECIALIZED",
  category: null,
  parentSlug: null,
  priority: 50,
  libraries: [],
};

interface CategorySeed {
  slug: string;
  name: string;
  description: string;
  libraries: SeedLibraryRef[];
}

const CATEGORIES: CategorySeed[] = [
  {
    slug: "architecture_advanced",
    name: "Architecture (Advanced)",
    description: "Advanced architecture, modeling and design-pattern libraries.",
    libraries: [
      { name: "C4 Architecture", aliases: ["c4"] },
      { name: "UML Component Diagram", aliases: ["uml", "component diagram"] },
      { name: "UML Deployment diagram", aliases: ["uml", "deployment diagram"] },
      { name: "Enterprise Integration Patterns", aliases: ["eip"] },
      { name: "Event Storming", aliases: ["event storming", "ddd"] },
      { name: "Wardley Maps Symbols", aliases: ["wardley", "wardley maps"] },
      { name: "Cloud Design Patterns", aliases: ["design patterns"] },
      { name: "Information Architecture", aliases: ["ia"] },
      { name: "Flow Chart Symbols", aliases: ["flowchart"] },
      { name: "Data Flow", aliases: ["dataflow", "dfd"] },
    ],
  },
  {
    slug: "cloud_devops",
    name: "Cloud & DevOps",
    description: "Cloud provider icons, Kubernetes, CI/CD and DevOps tooling.",
    libraries: [
      { name: "AWS Architecture Icons", aliases: ["aws"] },
      { name: "AWS Serverless Icons", aliases: ["aws", "serverless", "lambda"] },
      { name: "AWS Serverless Icons v2", aliases: ["aws", "serverless", "lambda"] },
      { name: "Google Architecture Icons", aliases: GOOGLE_ALIASES },
      { name: "Original Google Architecture Icons", aliases: ["gcp", "google cloud"] },
      { name: "Azure cloud services icons", aliases: ["azure"] },
      { name: "Oracle Cloud Infrastructure Icons", aliases: ["oci", "oracle cloud"] },
      { name: "Cloud", aliases: ["cloud"] },
      { name: "Kubernetes icons", aliases: ["k8s", "kubernetes"] },
      { name: "Kubernetes Icons Set", aliases: ["k8s", "kubernetes"] },
      { name: "HashiCorp", aliases: ["terraform", "vault", "consul", "nomad"] },
      { name: "GitHub Actions", aliases: ["ci", "cd", "actions", "github"] },
      // Not present in the official catalog (reported as missing, non-fatal).
      { name: "Docker", aliases: ["containers", "docker"] },
    ],
  },
  {
    slug: "data_observability",
    name: "Data & Observability",
    description: "Data platforms, warehousing, streaming and observability.",
    libraries: [
      { name: "Software Logos", aliases: ["logos"] },
      { name: "Redis Grafana", aliases: ["redis", "grafana", "observability"] },
      { name: "Data Platform", aliases: ["data"] },
      { name: "ELK Stack", aliases: ["elk", "elasticsearch", "kibana", "observability"] },
      { name: "Kafka Streams Topology Design", aliases: ["kafka", "streaming"] },
      { name: "Snowflake datawarehousing Icons", aliases: ["snowflake", "warehouse"] },
      { name: "Databricks Architecture Icons", aliases: ["databricks", "lakehouse"] },
      { name: "Microsoft Fabric Architecture Icons", aliases: ["fabric", "microsoft fabric"] },
      { name: "Data Viz", aliases: ["dataviz", "visualization"] },
      { name: "Charts", aliases: ["chart", "graphs"] },
    ],
  },
  {
    slug: "logos_tech",
    name: "Logos & Tech",
    description: "Technology, product and tooling logos.",
    libraries: [
      { name: "IT Logos", aliases: ["logos"] },
      { name: "Technology Logos", aliases: ["tech logos", "logos"] },
      { name: "Software Logos", aliases: ["logos"] },
      { name: "IT Tools Logos", aliases: ["tools", "logos"] },
      { name: "HTML, CSS and JS logos", aliases: ["html", "css", "javascript", "web"] },
      { name: "Microsoft 365 icons", aliases: ["m365", "office", "microsoft"] },
      { name: "Atlassian Product Suite", aliases: ["jira", "confluence", "atlassian"] },
      { name: "Camunda Platform Icons", aliases: ["camunda", "bpmn"] },
      { name: "Data Science logos", aliases: ["data science", "ml", "logos"] },
    ],
  },
  {
    slug: "people_storytelling",
    name: "People & Storytelling",
    description: "Characters, collaboration and storytelling elements.",
    libraries: [
      { name: "Stick Figures", aliases: ["people", "stick man"] },
      { name: "Stick people", aliases: ["people"] },
      { name: "Stick Figures Collaboration", aliases: ["people", "collaboration"] },
      { name: "Simple Characters", aliases: ["characters", "people"] },
      { name: "Storytelling", aliases: ["story"] },
      { name: "Bubbles", aliases: ["speech bubbles", "callouts"] },
      { name: "Simple Sticky Notes", aliases: ["sticky notes", "notes"] },
      { name: "Robots", aliases: ["robot", "bot"] },
    ],
  },
  {
    slug: "ui_wireframe",
    name: "UI & Wireframe",
    description: "UI kits, device frames and wireframing elements.",
    libraries: [
      { name: "Web Kit", aliases: ["web", "ui"] },
      { name: "Mobile Kit", aliases: ["mobile", "app ui"] },
      { name: "Lo-Fi Wireframing Kit", aliases: ["lofi", "wireframe"] },
      { name: "Basic UX/wireframing elements", aliases: ["ux", "wireframe"] },
      { name: "Universal UI kit", aliases: ["ui kit", "ui"] },
      { name: "Webpage frames", aliases: ["browser frames", "webpage"] },
      { name: "Apple Devices Frames", aliases: ["iphone", "ipad", "apple", "device frames"] },
      { name: "ecommerce mobile ui", aliases: ["ecommerce", "shop ui"] },
      { name: "Forms", aliases: ["form", "inputs"] },
      { name: "Dropdowns", aliases: ["dropdown", "select"] },
    ],
  },
  {
    slug: "security",
    name: "Security",
    description: "Cloud security, architecture and data-flow building blocks.",
    libraries: [
      { name: "AWS Architecture Icons", aliases: ["aws"] },
      { name: "Google Architecture Icons", aliases: GOOGLE_ALIASES },
      { name: "Azure cloud services icons", aliases: ["azure"] },
      { name: "Oracle Cloud Infrastructure Icons", aliases: ["oci"] },
      { name: "Cloud Design Patterns", aliases: ["design patterns"] },
      { name: "Software Architecture", aliases: ["architecture"] },
      { name: "Architecture diagram components", aliases: ["architecture components"] },
      { name: "Flow Chart Symbols", aliases: ["flowchart"] },
      { name: "Data Flow", aliases: ["dataflow", "dfd"] },
    ],
  },
  {
    slug: "ai_mcp",
    name: "AI & MCP",
    description: "Building blocks for AI/agent and MCP architecture diagrams.",
    libraries: [
      { name: "Software Architecture", aliases: ["architecture"] },
      { name: "Architecture diagram components", aliases: ["architecture components"] },
      { name: "Flow Chart Symbols", aliases: ["flowchart"] },
      { name: "Data Flow", aliases: ["dataflow", "dfd"] },
      { name: "IT Logos", aliases: ["logos"] },
      { name: "Technology Logos", aliases: ["logos"] },
      { name: "Software Logos", aliases: ["logos"] },
      { name: "Web Kit", aliases: ["web", "ui"] },
      { name: "Simple Characters", aliases: ["characters", "people"] },
      { name: "Bubbles", aliases: ["speech bubbles", "callouts"] },
    ],
  },
  {
    slug: "business_product",
    name: "Business & Product",
    description: "Business modeling, presentation and storytelling assets.",
    libraries: [
      { name: "Business Model Templates", aliases: ["business model", "canvas"] },
      { name: "Presentation Templates", aliases: ["slides", "presentation"] },
      { name: "Storytelling", aliases: ["story"] },
      { name: "Simple Sticky Notes", aliases: ["sticky notes", "notes"] },
      { name: "Bubbles", aliases: ["speech bubbles", "callouts"] },
      { name: "Charts", aliases: ["chart", "graphs"] },
      { name: "Data Viz", aliases: ["dataviz", "visualization"] },
      { name: "Web Kit", aliases: ["web", "ui"] },
      { name: "Mobile Kit", aliases: ["mobile", "app ui"] },
    ],
  },
];

/** Ordered list of specialized category slugs (stable for UI + tests). */
export const SPECIALIZED_CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

/** Specialized category packs as full seed definitions. */
export const SPECIALIZED_CATEGORIES: SeedPackDefinition[] = CATEGORIES.map(
  (category) => ({
    slug: category.slug,
    name: category.name,
    description: category.description,
    kind: "SPECIALIZED",
    category: category.slug,
    parentSlug: SPECIALIZED_PACK_SLUG,
    priority: 50,
    libraries: category.libraries,
  }),
);
