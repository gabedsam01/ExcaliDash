# UI Wireframe / Dashboard — Worked Examples

Each example shows: the request -> the plan line -> the ordered MCP tool calls with realistic
arguments -> the quality loop -> save/export. Real sample data and secrets are redacted BEFORE any
call. Tool names use the real schemas; there is no `validate_architecture` step (this is a layout).

---

## Example A — Analytics dashboard with table states (build from prompt)

**Request**: "Wireframe our analytics dashboard: top nav, side nav, a row of KPI tiles, a revenue
chart and an orders table — show the table's empty, loading, error and success states, desktop and
mobile."

**Plan line**
```
TYPE=wireframe PRESET=minimal-whiteboard FRAMES=[Desktop, Mobile]
STATES=[empty, loading, error, success]
LIBRARY=curated[Lo-Fi Wireframing Kit, Web Kit, Mobile Kit] VALIDATORS=lint,score,repair
REGIONS=top-nav,side-nav,content  PANELS=KPI row(3), Revenue chart, Orders table  DATA_PANELS=Orders table
```

**Ordered calls**

1. `read_mcp_guide()` -> note `MCP_LIBRARY_MODE = curated`, `minimal-whiteboard` preset, rubric.
2. `list_templates()` -> scan for a `wireframe-dashboard` template (none reusable -> build from prompt).
3. Library vetting:
   - `search_libraries({ q: "nav table card", mode: "curated", category: "ui", limit: 20 })`
   - `inspect_library({ libraryId: "lo-fi-wireframing-kit", autoCache: true })`
   - `inspect_library({ libraryId: "web-kit", autoCache: true })`
   - `cache_library({ libraryId: "mobile-kit" })`
4. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "wireframe",
     "preset": "minimal-whiteboard",
     "title": "Analytics Dashboard — Wireframe (Desktop + Mobile)",
     "direction": "TB",
     "structure": {
       "nodes": [
         { "id": "desktop", "label": "Desktop", "type": "frame" },
         { "id": "topnav", "label": "Top nav: logo · search · user menu", "type": "panel", "parent": "desktop" },
         { "id": "sidenav", "label": "Side nav: Overview · Orders · Reports · Settings", "type": "panel", "parent": "desktop" },
         { "id": "kpi", "label": "KPI tiles: Revenue · Orders · Conversion", "type": "panel", "parent": "desktop" },
         { "id": "chart", "label": "Revenue chart (placeholder)", "type": "panel", "parent": "desktop" },
         { "id": "tbl-empty",   "label": "Orders table — empty (zero-state + 'Import orders' CTA)", "type": "panel", "parent": "desktop" },
         { "id": "tbl-loading", "label": "Orders table — loading (skeleton rows)", "type": "panel", "parent": "desktop" },
         { "id": "tbl-error",   "label": "Orders table — error (message + Retry)", "type": "panel", "parent": "desktop" },
         { "id": "tbl-success", "label": "Orders table — success (rows: Ada L. · $1,234 · Paid)", "type": "panel", "parent": "desktop" },
         { "id": "mobile", "label": "Mobile", "type": "frame" },
         { "id": "m-topbar", "label": "Top bar: ☰ · logo · avatar", "type": "panel", "parent": "mobile" },
         { "id": "m-kpi", "label": "KPI tiles (stacked)", "type": "panel", "parent": "mobile" },
         { "id": "m-table", "label": "Orders list (success); states reuse desktop key", "type": "panel", "parent": "mobile" },
         { "id": "m-tabbar", "label": "Bottom tab bar: Home · Orders · More", "type": "panel", "parent": "mobile" },
         { "id": "legend", "label": "States: empty · loading · error · success", "type": "legend" }
       ],
       "edges": []
     }
   })
   ```
   -> returns `{ id: "draw_analytics_wf" }`.
5. Place kit items:
   ```json
   add_library_items_normalized({
     "libraryId": "web-kit",
     "itemNames": ["nav-bar", "data-table", "search-input"],
     "targetCardId": "topnav",
     "placement": "inside-card-top",
     "slotSize": { "w": 32, "h": 32 },
     "save": false
   })
   ```
   then `add_library_items_normalized({ libraryId: "mobile-kit", itemNames: ["device-frame", "tab-bar"], targetCardId: "mobile", placement: "inside-card-top" })`.
6. Quality loop:
   - `lint_drawing({ id: "draw_analytics_wf" })` -> `hardBlockers: ["FRAME_TITLE_OVERLAP"]` (top
     nav rode into the Desktop frame title band).
   - `score_drawing({ minimumScore: 95 })` -> `83` (penalties: FRAME_TITLE_OVERLAP, HIGH_DENSITY).
   - `save_version({ id: "draw_analytics_wf" })` (rollback target).
   - `repair_drawing({ save: false, createVersion: false })` -> pushes the nav band below the
     40px title band and widens the panel gutters to 48px.
   - re-`lint_drawing` -> `hardBlockers: []`; re-`score_drawing({ minimumScore: 95 })` -> `96`.
7. `auto_polish_drawing({ minimumScore: 95, maxAttempts: 2, save: false })` -> re-`score_drawing` ->
   `97` (no regression; keep).
8. `save_drawing({ id: "draw_analytics_wf", name: "Analytics Dashboard — Wireframe (Desktop + Mobile)" })`.
9. `save_version({ id: "draw_analytics_wf" })`.
10. `get_drawing_url({ id: "draw_analytics_wf" })` -> share link;
    `export_drawing({ id: "draw_analytics_wf", format: "svg" })` -> re-scan: the success-row sample
    is `Ada L. · $1,234`, no real customer data. Done.

---

## Example B — Account settings form with error/success (from a template)

**Request**: "Sketch the low-fi layout for the account settings screen with a profile form and a
billing panel, including the form's error and success states."

**Plan line**
```
TYPE=wireframe PRESET=minimal-whiteboard FRAMES=[Desktop, Mobile]
STATES=[empty, loading, error, success]  LIBRARY=curated[Lo-Fi Wireframing Kit, Web Kit, Mobile Kit]
VALIDATORS=lint,score,repair  PANELS=Profile form, Billing panel  DATA_PANELS=Profile form
STRATEGY=template
```

**Ordered calls**
1. `read_mcp_guide()`.
2. `list_templates()` -> a reusable `wireframe-dashboard` template exists.
3. Generate (ONE path — template):
   ```json
   create_from_template({
     "templateId": "wireframe-dashboard",
     "preset": "minimal-whiteboard",
     "title": "Account Settings — Wireframe",
     "extraNodes": [
       { "id": "form-empty",   "label": "Profile form — empty (Name, Email, Password fields)" },
       { "id": "form-error",   "label": "Profile form — error (inline 'Email already in use')" },
       { "id": "form-success", "label": "Profile form — success ('Saved' toast)" },
       { "id": "billing",      "label": "Billing panel: plan · card ****4242 · invoices" }
     ],
     "extraEdges": [],
     "autoPolish": false
   })
   ```
   -> returns `{ id: "draw_settings_wf" }`. The password field renders as a masked input; the card
   number is a masked placeholder, never a real PAN.
4. `add_library_items_normalized({ libraryId: "lo-fi-wireframing-kit", itemNames: ["text-input", "button", "toggle"], targetCardId: "form-empty", placement: "inside-card-top", slotSize: { "w": 32, "h": 32 } })`.
5. Quality loop: `lint_drawing({ id: "draw_settings_wf" })` -> `hardBlockers: ["ITEM_OUTSIDE_FRAME"]`
   (the billing panel clipped the Desktop frame edge) -> `score_drawing({ minimumScore: 95 })`
   -> `88` -> `save_version` -> `repair_drawing({ save: false })` (enlarge frame / nudge panel
   inward, 16px inner padding) -> re-lint `[]` / re-score `96`. Rollback any pass that drops the score.
6. `auto_polish_drawing({ minimumScore: 95, save: false })` -> re-`score_drawing` -> `96` (keep).
7. `save_drawing({ id: "draw_settings_wf", name: "Account Settings — Wireframe" })` ->
   `save_version({ id: "draw_settings_wf" })` -> `get_drawing_url({ id: "draw_settings_wf" })` ->
   `export_drawing({ id: "draw_settings_wf", format: "png" })`. Re-scan: card shown as `****4242`,
   no real PAN; password masked.

---

## Example C — Onboarding dashboard with empty vs success + secret redaction

**Request**: "Make a wireframe of the onboarding dashboard with an empty state for new users and a
populated success state once they connect a data source. The connect panel shows a live API key
field (a `sk_live_…`-shaped secret) and a webhook URL."

**Redaction first** (BEFORE any tool call): the API key field becomes `apiKey=[REDACTED_API_KEY]`
and the webhook URL becomes `https://app.example.com/hooks/[REDACTED_WEBHOOK_SECRET]`.

**Plan line**
```
TYPE=wireframe PRESET=minimal-whiteboard FRAMES=[Desktop, Mobile]
STATES=[empty, loading, error, success]  LIBRARY=required[Lo-Fi Wireframing Kit, Web Kit, Mobile Kit]
VALIDATORS=lint,score,repair  PANELS=Connect source, Activity feed  DATA_PANELS=Activity feed
```

**Ordered calls**
1. `read_mcp_guide()` -> `MCP_LIBRARY_MODE = required` (nav/controls/device frame MUST use kit items).
2. `search_libraries({ q: "empty state button input", mode: "required", category: "ui", limit: 15 })`
   -> `inspect_library({ libraryId: "lo-fi-wireframing-kit", autoCache: true })` -> `cache_library({ libraryId: "web-kit" })`.
3. Generate (ONE path):
   ```json
   create_diagram_from_prompt({
     "diagramType": "wireframe",
     "preset": "minimal-whiteboard",
     "title": "Onboarding Dashboard — Wireframe",
     "structure": {
       "nodes": [
         { "id": "desktop", "label": "Desktop", "type": "frame" },
         { "id": "empty",   "label": "Empty state: 'Connect a data source' + primary CTA", "type": "panel", "parent": "desktop" },
         { "id": "connect", "label": "Connect panel: apiKey=[REDACTED_API_KEY] · webhook .../[REDACTED_WEBHOOK_SECRET]", "type": "panel", "parent": "desktop" },
         { "id": "feed-loading", "label": "Activity feed — loading (skeleton)", "type": "panel", "parent": "desktop" },
         { "id": "feed-error",   "label": "Activity feed — error (Retry)", "type": "panel", "parent": "desktop" },
         { "id": "success", "label": "Success: source connected · activity feed populated", "type": "panel", "parent": "desktop" },
         { "id": "mobile",  "label": "Mobile", "type": "frame" },
         { "id": "m-empty", "label": "Empty state (single column) + CTA", "type": "panel", "parent": "mobile" },
         { "id": "legend",  "label": "States: empty · loading · error · success", "type": "legend" }
       ],
       "edges": []
     }
   })
   ```
   -> `{ id: "draw_onboarding_wf" }`.
4. `add_library_items_normalized({ libraryId: "lo-fi-wireframing-kit", itemNames: ["button", "text-input", "empty-illustration"], targetCardId: "empty", placement: "inside-card-top", slotSize: { "w": 32, "h": 32 } })`
   — required-mode: the CTA uses a kit button, the API-key field uses a kit input (masked).
5. Quality loop: `lint_drawing` -> possible `ARROW_TEXT_INTERSECTION` if a "connect -> success"
   annotation crosses the connect-panel label -> `score_drawing({ minimumScore: 95 })` ->
   `repair_drawing({ save: false })` (route the annotation through the column gutter, label into
   the side lane with 32px clearance) -> re-lint `[]` / re-score `>= 95`. Rollback on any drop.
6. `auto_polish_drawing({ minimumScore: 95, save: false })`.
7. `save_drawing({ id: "draw_onboarding_wf", name: "Onboarding Dashboard — Wireframe" })` ->
   `save_version({ id: "draw_onboarding_wf" })` -> `get_drawing_url({ id: "draw_onboarding_wf" })`.
8. `export_drawing({ id: "draw_onboarding_wf", format: "png" })` -> **re-scan export**: confirm the
   field shows `apiKey=[REDACTED_API_KEY]` and the webhook shows `[REDACTED_WEBHOOK_SECRET]`, not
   the live values. Done.

---

## Reusable argument fragments
- **Two-frame layout**: model one `frame` node per breakpoint (`Desktop`, `Mobile`); keep frames
  >= 64px apart; mobile stacks panels in one column with a collapsed nav.
- **State variants**: for a data panel `<P>`, add four panels labeled `"<P> — empty"`,
  `"<P> — loading"`, `"<P> — error"`, `"<P> — success"`, plus a `legend` node keying the four.
- **Kit placement**: `add_library_items_normalized({ libraryId, itemNames, targetCardId,
  placement: "inside-card-top", slotSize: { "w": 32, "h": 32 } })`; buttons/chips as
  `placement: "badge"`.
- **Redaction check**: every table cell / form field / KPI tile must be obvious fake data, and any
  token/key/URL must be `[REDACTED_<TYPE>]` before the create call and again on the export.

See `./checklist.md`, `./anti-patterns.md`, and the shared references under `../../_shared/references/`.
