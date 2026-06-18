/**
 * Skill registry. Skills are versioned guidance files (skills/*.md) that direct
 * the external agent on how to produce professional diagrams. The registry is
 * the in-code source of truth referenced by templates and tools.
 */
export interface SkillMeta {
  id: string;
  name: string;
  objective: string;
  whenToUse: string;
  recommendedLibraries: string[];
  file: string;
}

export const SKILLS: SkillMeta[] = [
  {
    id: "excalidash-diagram-director",
    name: "Diagram Director",
    objective: "Plan diagram type, preset, libraries and quality flow before drawing.",
    whenToUse: "Always, as the first step of any create_diagram_from_prompt call.",
    recommendedLibraries: ["Software Architecture", "Flow Chart Symbols"],
    file: "excalidash-diagram-director.md",
  },
  {
    id: "design-polisher",
    name: "Design Polisher",
    objective: "Drive lint → score → repair until the drawing scores ≥ 95.",
    whenToUse: "After any automatic generation or library import.",
    recommendedLibraries: [],
    file: "design-polisher.md",
  },
  {
    id: "clean-architecture-reviewer",
    name: "Clean Architecture Reviewer",
    objective: "Validate layering and dependency direction in architecture diagrams.",
    whenToUse: "When drawing or reviewing layered/clean/hexagonal architectures.",
    recommendedLibraries: ["Software Architecture", "Architecture diagram components"],
    file: "clean-architecture-reviewer.md",
  },
  {
    id: "software-architecture-diagrams",
    name: "Software Architecture Diagrams",
    objective: "Produce C4 and system architecture diagrams with curated icons.",
    whenToUse: "For system/container/component architecture requests.",
    recommendedLibraries: ["AWS Architecture Icons", "C4 Architecture", "Software Logos"],
    file: "software-architecture-diagrams.md",
  },
  {
    id: "mcp-architecture-diagrams",
    name: "MCP Architecture Diagrams",
    objective: "Model MCP servers with separate transport, auth and storage.",
    whenToUse: "For MCP server / tool architecture diagrams.",
    recommendedLibraries: ["Software Architecture", "Technology Logos"],
    file: "mcp-architecture-diagrams.md",
  },
  {
    id: "repo-to-diagram",
    name: "Repo to Diagram",
    objective: "Turn a structured repository analysis into a real architecture diagram.",
    whenToUse: "With create_from_repo_analysis after an external repo scan.",
    recommendedLibraries: ["Software Architecture", "Technology Logos", "IT Logos"],
    file: "repo-to-diagram.md",
  },
  {
    id: "n8n-workflow-diagrams",
    name: "n8n Workflow Diagrams",
    objective: "Lay out automation workflows as readable node graphs.",
    whenToUse: "For n8n / automation / pipeline workflows.",
    recommendedLibraries: ["Flow Chart Symbols", "Technology Logos"],
    file: "n8n-workflow-diagrams.md",
  },
  {
    id: "database-diagrams",
    name: "Database Diagrams",
    objective: "Draw tables, columns and relations cleanly.",
    whenToUse: "For ER / schema diagrams.",
    recommendedLibraries: ["Data Platform", "Software Logos"],
    file: "database-diagrams.md",
  },
  {
    id: "security-architecture",
    name: "Security Architecture",
    objective: "Show trust boundaries, auth and data protection.",
    whenToUse: "For security / threat-model / boundary diagrams.",
    recommendedLibraries: ["Cloud Design Patterns", "AWS Architecture Icons"],
    file: "security-architecture.md",
  },
  {
    id: "ui-wireframes",
    name: "UI Wireframes",
    objective: "Build low-fidelity, consistent UI wireframes.",
    whenToUse: "For wireframe / dashboard / screen layouts.",
    recommendedLibraries: ["Lo-Fi Wireframing Kit", "Web Kit", "Mobile Kit"],
    file: "ui-wireframes.md",
  },
  {
    id: "portfolio-diagrams",
    name: "Portfolio Diagrams",
    objective: "Produce polished, presentation-grade architecture visuals.",
    whenToUse: "For portfolio / deck / marketing diagrams.",
    recommendedLibraries: ["Technology Logos", "Software Logos"],
    file: "portfolio-diagrams.md",
  },
  {
    id: "troubleshooting-diagrams",
    name: "Troubleshooting Diagrams",
    objective: "Map decision flows and swimlane processes for debugging.",
    whenToUse: "For incident / decision / process flows.",
    recommendedLibraries: ["Flow Chart Symbols", "Data Flow"],
    file: "troubleshooting-diagrams.md",
  },
  {
    id: "avg-visual-reviewer",
    name: "Visual Reviewer",
    objective: "Score visual quality and recommend concrete fixes.",
    whenToUse: "Before saving any drawing as final.",
    recommendedLibraries: [],
    file: "avg-visual-reviewer.md",
  },
];

export const SKILL_IDS = SKILLS.map((s) => s.id);
export const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export const listSkills = (): SkillMeta[] => SKILLS;
