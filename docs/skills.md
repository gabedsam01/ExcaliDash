# ExcaliDash Claude Code skills

ExcaliDash ships **25 Claude Code skills** under [`skills/excalidash/`](../skills/excalidash).
Each is a focused, geometry-aware playbook for one diagram type that drives the
MCP quality flow (plan → generate → lint → score → repair → validate → save →
export) to a passing score (≥ 95) with library policy and secret redaction baked
in.

## Prompts vs. skills (important)

- **MCP prompts** appear automatically after `claude mcp add` as
  `/mcp__excalidash__*` commands — no install needed (see [mcp.md](mcp.md)).
- **Claude Code skills** are local files Claude Code loads from a skills
  directory. `claude mcp add` does **not** copy them. You install/copy them with
  the bundled CLI below.

## Install

```bash
# user scope → ~/.claude/skills/excalidash/*
npx -y @excalidash/claude-skills install --scope user

# project/local scope → <project>/.claude/skills/excalidash/*
npx -y @excalidash/claude-skills install --scope project --project-dir .

# local fallback (no npm publish needed), from this repo:
node packages/excalidash-claude-skills/bin/install.cjs install --scope user
node packages/excalidash-claude-skills/bin/install.cjs install --scope project --project-dir .
```

Other CLI commands:

```bash
excalidash-skills list                                  # list the 25 skills
excalidash-skills install --scope user                  # copy to ~/.claude/skills
excalidash-skills install --scope project --project-dir .  # copy to ./.claude/skills
excalidash-skills uninstall --scope user                # remove
excalidash-skills verify                                # check 25 + _shared, frontmatter, no placeholders, structure
```

Scopes:

| Scope | Target |
| --- | --- |
| `user` | `~/.claude/skills/excalidash/*` |
| `project` / `local` | `<project-dir>/.claude/skills/excalidash/*` |

After installing, restart Claude Code so it picks up the new skills.

## The 25 skills

```
excalidash-diagram-director          excalidash-design-polisher
excalidash-visual-lint-repair-loop   excalidash-library-curator
excalidash-c4-context                excalidash-c4-container
excalidash-clean-architecture-reviewer
excalidash-hexagonal-architecture-mapper
excalidash-ddd-bounded-contexts      excalidash-event-driven-diagrammer
excalidash-cqrs-diagrammer           excalidash-microservices-topology
excalidash-modular-monolith          excalidash-repo-to-system-design
excalidash-n8n-workflow-diagrammer   excalidash-database-dataflow
excalidash-security-architecture     excalidash-auth-api-key-boundaries
excalidash-observability-flow        excalidash-devops-cloud-deployment
excalidash-ai-mcp-architecture       excalidash-llm-rag-pipeline
excalidash-ui-wireframe-dashboard    excalidash-portfolio-polished-diagram
excalidash-troubleshooting-swimlane
```

Each skill directory contains:

```
<skill>/
  SKILL.md                 # frontmatter (name, description, allowed-tools) + workflow
  references/
    checklist.md           # pre-save checklist
    examples.md            # worked tool-call sequences
    anti-patterns.md       # what the lint/score engine catches
  scripts/
    smoke.cjs              # doc-smoke: prints the MCP prompt + tool sequence
```

Each skill name maps 1:1 to the matching MCP prompt
(`excalidash-c4-context` ↔ `/mcp__excalidash__excalidash_c4_context`).

## Shared references & scripts

`skills/excalidash/_shared/` holds content reused by every skill:

```
_shared/references/   visual-system.md, geometry-rules.md, library-policy.md,
                      architecture-patterns.md, security-redaction.md,
                      mcp-tool-cheatsheet.md, prompt-patterns.md
_shared/scripts/      verify-mcp.cjs, export-drawing.cjs, inspect-excalidraw.cjs,
                      score-fixture.cjs, install-skills.cjs
```

`verify-mcp.cjs` (given `EXCALIDASH_MCP_URL` + `EXCALIDASH_TOKEN`) asserts the
live server returns exactly 25 tools and 25 prompts.

## Troubleshooting

- **Skills not appearing** — confirm they were copied (`excalidash-skills verify`),
  then restart Claude Code. `claude mcp add` alone does not install skills.
- **Allowed-tools missing** — each `SKILL.md` lists `allowed-tools`; the MCP must
  be connected so those `mcp__excalidash__*` tools resolve.
- **`npx` can't find the package** — until it's published, use the local fallback
  `node packages/excalidash-claude-skills/bin/install.cjs …` from this repo.
