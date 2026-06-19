/**
 * Category aliases for specialized search.
 *
 * Maps human query tokens (e.g. "cloud", "devops", "aws", "gcp", "azure",
 * "k8s") to a specialized category slug so the search endpoint can accept a
 * friendly `category` value.
 */
import { normalizeName } from "../validators";
import { SPECIALIZED_CATEGORY_SLUGS } from "./specializedPack";

/** alias token (normalized) -> category slug */
export const CATEGORY_ALIASES: Record<string, string> = {
  // architecture_advanced
  architecture: "architecture_advanced",
  "architecture advanced": "architecture_advanced",
  uml: "architecture_advanced",
  modeling: "architecture_advanced",
  patterns: "architecture_advanced",
  // cloud_devops
  cloud: "cloud_devops",
  devops: "cloud_devops",
  "cloud devops": "cloud_devops",
  aws: "cloud_devops",
  gcp: "cloud_devops",
  google: "cloud_devops",
  azure: "cloud_devops",
  oci: "cloud_devops",
  oracle: "cloud_devops",
  k8s: "cloud_devops",
  kubernetes: "cloud_devops",
  docker: "cloud_devops",
  terraform: "cloud_devops",
  hashicorp: "cloud_devops",
  ci: "cloud_devops",
  cd: "cloud_devops",
  // data_observability
  data: "data_observability",
  observability: "data_observability",
  monitoring: "data_observability",
  kafka: "data_observability",
  snowflake: "data_observability",
  databricks: "data_observability",
  warehouse: "data_observability",
  analytics: "data_observability",
  // logos_tech
  logos: "logos_tech",
  logo: "logos_tech",
  tech: "logos_tech",
  brands: "logos_tech",
  // people_storytelling
  people: "people_storytelling",
  characters: "people_storytelling",
  storytelling: "people_storytelling",
  story: "people_storytelling",
  collaboration: "people_storytelling",
  // ui_wireframe
  ui: "ui_wireframe",
  ux: "ui_wireframe",
  wireframe: "ui_wireframe",
  wireframing: "ui_wireframe",
  mockup: "ui_wireframe",
  frames: "ui_wireframe",
  // security
  security: "security",
  secops: "security",
  threat: "security",
  // ai_mcp
  ai: "ai_mcp",
  mcp: "ai_mcp",
  agent: "ai_mcp",
  agents: "ai_mcp",
  llm: "ai_mcp",
  // business_product
  business: "business_product",
  product: "business_product",
  presentation: "business_product",
  slides: "business_product",
};

/**
 * Resolve a free-form category token (slug or alias) to a canonical category
 * slug. Returns null when it matches neither.
 */
export const resolveCategorySlug = (input: string | undefined): string | null => {
  if (!input) return null;
  const normalized = normalizeName(input);
  if (normalized.length === 0) return null;

  // Direct slug match (e.g. "cloud_devops" -> normalizes to "cloud devops").
  const bySlug = SPECIALIZED_CATEGORY_SLUGS.find(
    (slug) => normalizeName(slug) === normalized,
  );
  if (bySlug) return bySlug;

  // Exact alias match.
  if (Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, normalized)) {
    return CATEGORY_ALIASES[normalized];
  }

  // Single-token alias match (e.g. query "aws devops" -> first matching token).
  for (const token of normalized.split(" ")) {
    if (Object.prototype.hasOwnProperty.call(CATEGORY_ALIASES, token)) {
      return CATEGORY_ALIASES[token];
    }
  }

  return null;
};
