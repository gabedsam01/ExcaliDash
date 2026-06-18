# Clean Architecture Reviewer (skill)

## Objective
Validate layering and dependency direction in layered, clean, and hexagonal architecture diagrams. Produce a corrected diagram where every dependency arrow points inward (toward the domain) and no inner layer references an outer one.

## When to use
- Drawing a new layered / clean / hexagonal / onion architecture.
- Reviewing an existing diagram for layer violations or inverted dependencies.
- Converting an informal box-and-arrow sketch into a rule-compliant layered view.

## Expected input
- A natural-language prompt, an existing diagram (id/elements), or a repo analysis to convert.
- Optionally: target style (clean, hexagonal, onion, n-tier), a visual preset, and known components per layer.
- If the input lacks explicit layers, infer the canonical four: Entities/Domain (innermost), Use Cases/Application, Interface Adapters (controllers, presenters, gateways), Frameworks & Drivers (UI, DB, web, external services — outermost).

## Visual rules
- Order layers consistently: innermost layer top-left or center; outermost bottom-right or perimeter. Keep it stable across the whole diagram.
- Use concentric rings (hexagonal/onion) or stacked horizontal bands (n-tier); never mix both in one diagram.
- One color per layer; keep a legend. Recommended preset: `dark-architecture` or `technical-docs`.
- Arrows must be directional (arrowheads on one end only) and labeled when the dependency type is non-obvious (e.g. "implements", "calls").
- Align boxes to a grid, avoid crossing arrows where rerouting is possible, and keep label text inside its box bounds.

## Logic rules
- The Dependency Rule: source code dependencies point only inward. Outer layers may depend on inner layers; inner layers must NOT depend on outer ones.
- Domain/Entities depend on nothing external. Application depends only on Domain. Adapters depend on Application + Domain. Frameworks depend on Adapters.
- Cross outward boundaries only via interfaces owned by the inner layer (Dependency Inversion). Flag any concrete outer type referenced inward.
- No skipping or back-arrows: flag any arrow from an inner ring to an outer ring, or any arrow that bypasses an adjacent layer without justification.
- Each box belongs to exactly one layer. Flag ambiguous or multi-layer boxes and split them.

## Recommended libraries
- Search and cache before placing components:
  - "Software Architecture"
  - "Architecture diagram components"
- Workflow: `search_libraries` -> `inspect_library` -> `cache_library` -> `add_library_items_normalized` (normalized keeps sizing/color consistent across layers).

## Mandatory validation
Run the full quality flow before any final save. Do not skip steps.
1. `lint_drawing` — fix structural/visual warnings.
2. `score_drawing` — must return **score >= 95**. If below 95, continue.
3. `repair_drawing` for logic/layer violations, then `auto_polish_drawing` for visual cleanup.
4. Re-run `score_drawing`. Loop until score >= 95.
5. `auto_polish_drawing` MUST run before the final save, even if the score already passed.
6. Only then `save_drawing` (final). Below 95, save ONLY with `asDraft: true`. Optionally `save_version` and `get_drawing_url`.

## Minimal examples

Generate a clean-architecture diagram:
```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "Clean architecture: Entities -> Use Cases -> Interface Adapters -> Frameworks & Drivers, dependencies pointing inward only",
    "preset": "dark-architecture"
  }
}
```

Add curated layer components:
```json
{
  "tool": "add_library_items_normalized",
  "arguments": {
    "library": "Software Architecture",
    "items": ["domain-entity", "use-case", "controller", "gateway", "database"]
  }
}
```

Validate and gate the save:
```json
{ "tool": "score_drawing", "arguments": { "drawingId": "<id>" } }
```
```json
{ "tool": "auto_polish_drawing", "arguments": { "drawingId": "<id>" } }
```
```json
{ "tool": "save_drawing", "arguments": { "drawingId": "<id>", "asDraft": false } }
```
