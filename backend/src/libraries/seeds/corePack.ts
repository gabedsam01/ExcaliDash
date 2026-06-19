/**
 * CORE_PACK seed definition.
 *
 * The core pack is the default, always-preferred curated set for MCP and
 * diagram generation. Entries are resolved against the official catalog by
 * name (then by `aliases`, then fuzzily). Aliases also become search aliases
 * for the resolved library.
 *
 * Verified against the official catalog (2026-06): every name below resolves
 * except "Google Architecture Icons" (resolved via alias to "GCP Icons") —
 * there is no exact "Google Architecture Icons" entry, only "Original Google
 * Architecture Icons" (seeded separately) and "GCP Icons"/"Google Icons".
 */
import type { SeedPackDefinition } from "../types";

export const CORE_PACK_SLUG = "core_pack";

export const CORE_PACK: SeedPackDefinition = {
  slug: CORE_PACK_SLUG,
  name: "Core Pack",
  description:
    "Curated, stable libraries preferred by default for diagram generation.",
  kind: "CORE",
  category: null,
  parentSlug: null,
  // Highest priority: no public result should outrank the core pack.
  priority: 100,
  libraries: [
    { name: "Software Architecture", aliases: ["architecture", "system design"] },
    { name: "C4 Architecture", aliases: ["c4", "c4 model"] },
    { name: "Architecture diagram components", aliases: ["architecture components"] },
    { name: "Basic system design", aliases: ["system design"] },
    { name: "Flow Chart Symbols", aliases: ["flowchart", "flow chart"] },
    { name: "Data Flow", aliases: ["dataflow", "dfd"] },
    { name: "Enterprise Integration Patterns", aliases: ["eip"] },
    { name: "AWS Architecture Icons", aliases: ["aws", "amazon web services"] },
    {
      name: "Google Architecture Icons",
      // No exact catalog entry — resolve via these official alternatives.
      aliases: [
        "GCP Icons",
        "Google Icons",
        "Original Google Architecture Icons",
        "gcp",
        "google cloud",
      ],
    },
    { name: "Original Google Architecture Icons", aliases: ["gcp", "google cloud"] },
    { name: "Azure cloud services icons", aliases: ["azure", "microsoft azure"] },
    { name: "Oracle Cloud Infrastructure Icons", aliases: ["oci", "oracle cloud"] },
    { name: "Kubernetes icons", aliases: ["k8s", "kubernetes"] },
    { name: "Kubernetes Icons Set", aliases: ["k8s", "kubernetes"] },
    { name: "Software Logos", aliases: ["logos", "tech logos"] },
    { name: "Technology Logos", aliases: ["tech logos", "logos"] },
    { name: "IT Logos", aliases: ["it logos", "logos"] },
    { name: "Redis Grafana", aliases: ["redis", "grafana"] },
    { name: "Data Platform", aliases: ["data"] },
    { name: "ELK Stack", aliases: ["elk", "elasticsearch", "logstash", "kibana"] },
    { name: "Stick Figures", aliases: ["people", "stick man"] },
    { name: "Simple Characters", aliases: ["characters", "people"] },
    { name: "Web Kit", aliases: ["web", "ui"] },
    { name: "Mobile Kit", aliases: ["mobile", "app ui"] },
    { name: "Basic UX/wireframing elements", aliases: ["ux", "wireframe", "wireframing"] },
    { name: "Lo-Fi Wireframing Kit", aliases: ["lofi", "wireframe", "wireframing"] },
    { name: "Simple Sticky Notes", aliases: ["sticky notes", "notes"] },
  ],
};
