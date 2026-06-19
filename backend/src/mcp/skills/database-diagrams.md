# Database Diagrams (skill)

## Objective
Produce clean entity-relationship / schema diagrams: tables as nodes with a title row and one row per column, plus typed relations (1:1, 1:N, N:M) drawn as labeled connectors between the correct columns. Optimize for legibility and correct cardinality, not decoration.

## When to use
Use whenever the request is about a relational schema, ER model, table layout, foreign-key map, or database design (e.g. "draw the schema for users/orders/payments", "ER diagram from this SQL", "show how these tables relate"). Prefer this skill over generic flowcharts for anything keyed on tables and columns.

## Expected input
- A list of tables, or DDL/SQL, or a prose description of entities.
- Per table: a name and an ordered list of columns. Each column may carry a type and key markers (PK, FK, UNIQUE, NOT NULL).
- Relationships between tables with cardinality and the joining columns.
- Optional: a visual preset (default `technical-docs`) and target library packs.

If columns or relations are ambiguous, infer sensible defaults (surface `id` PKs, `*_id` FKs) and note assumptions rather than blocking.

## Visual rules
- One rectangle per table. Top row = table name (bold), each subsequent row = one column.
- Left-align column text. Render as `name : type` and append key markers, e.g. `id : uuid (PK)`, `user_id : uuid (FK)`.
- Keep tables on a consistent grid; align tops/edges. Leave generous horizontal gutters so relation lines do not cross table bodies.
- Use orthogonal (right-angle) connectors, not diagonal ones. Route to the specific column row, not the table's center.
- Mark cardinality at each connector end (crow's foot or `1` / `N` labels). Label the relation with the FK when helpful.
- Limit palette to 2-3 colors: neutral table fill, one accent for PK rows, one for relations. Avoid clutter and overlapping labels.

## Logic rules
- Every FK must terminate on the referenced table's PK (or unique) column; never on a free-floating table.
- N:M relationships must go through an explicit junction table (two 1:N relations), not a single direct N:M line.
- Cardinality must be consistent on both ends (a 1:N relation shows `1` on the parent, `N` on the child).
- No duplicate table names; no orphan tables unless the input genuinely has them.
- Preserve column order from the input; do not invent columns beyond clearly implied keys.

## Recommended libraries
- **Data Platform** — database, table, storage, and pipeline glyphs for accenting datastores.
- **Software Logos** — engine/provider marks (Postgres, MySQL, Redis, etc.) to tag tables by backing store.

Discover and load before placing items:
```json
{ "tool": "search_libraries", "arguments": { "query": "Data Platform" } }
```
Then `inspect_library` -> `cache_library` -> `add_library_items_normalized` so glyphs land on the grid.

## Mandatory validation
Run the quality flow before any final save. The minimum passing score is **95**.
1. `lint_drawing` — fix structural issues (overlaps, dangling connectors, misrouted FKs).
2. `score_drawing` — must return **>= 95**. If below, continue.
3. `repair_drawing` for targeted defects, then `auto_polish_drawing` to finalize spacing/alignment.
4. Re-run `score_drawing`; only when it is **>= 95** call `auto_polish_drawing` one final time, then `save_drawing`.
- Never call `save_drawing` as final below 95. Saving below threshold is only allowed with `asDraft: true`.
- After a passing save, use `save_version` and return the link via `get_drawing_url`.

## Minimal examples
Generate the schema:
```json
{
  "tool": "create_diagram_from_prompt",
  "arguments": {
    "prompt": "ER diagram: users(id PK, email), orders(id PK, user_id FK->users.id, total), order_items(id PK, order_id FK->orders.id, product_id FK->products.id), products(id PK, name). Show 1:N users->orders, 1:N orders->order_items, N:M orders<->products via order_items.",
    "diagramType": "er-diagram",
    "preset": "technical-docs"
  }
}
```
Validate and finalize:
```json
{ "tool": "score_drawing", "arguments": { "drawingId": "<id>" } }
```
```json
{ "tool": "auto_polish_drawing", "arguments": { "drawingId": "<id>", "minScore": 95 } }
```
```json
{ "tool": "save_drawing", "arguments": { "drawingId": "<id>", "asDraft": false } }
```
