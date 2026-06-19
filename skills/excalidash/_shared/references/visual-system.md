# Visual System

The visual system defines six presets. A preset is a coherent bundle of palette,
typography, spacing scale, stroke style, and fill style. Pick one preset per
drawing and never mix bundles — mixing is the fastest way to drop below the
score >= 95 quality bar.

## Presets

### handdrawn-clean
- **Use when**: brainstorms, informal explainers, teaching, README hero images.
- **Stroke**: `roughness: 1`, `sloppiness` light, `strokeWidth: 2`.
- **Fill**: `hachure`, low-saturation accents.
- **Font**: `Virgil` (hand-drawn), size 20 body / 28 heading.
- **Palette**: ink `#1e1e1e`, accents `#e64980` `#1971c2` `#2f9e44`, bg `#ffffff`.

### technical-docs
- **Use when**: precise system diagrams, API flows, sequence/data-flow docs.
- **Stroke**: `roughness: 0` (clean lines), `strokeWidth: 2`.
- **Fill**: `solid` light tints, `fillStyle: solid`.
- **Font**: `Helvetica`/normal, size 16 body / 20 heading. Monospace `Cascadia` for code.
- **Palette**: ink `#343a40`, layers `#e7f5ff` `#fff9db` `#ebfbee`, lines `#868e96`.

### startup-deck
- **Use when**: pitch slides, landing visuals, marketing one-pagers.
- **Stroke**: `roughness: 0`, bold `strokeWidth: 3` on hero shapes.
- **Fill**: `solid`, saturated brand color blocks.
- **Font**: `Helvetica` bold, size 24 body / 40 heading (large, confident).
- **Palette**: brand primary + one accent + neutral; high contrast on white or tinted bg.

### dark-architecture
- **Use when**: architecture reviews on dark backgrounds, ops dashboards, infra maps.
- **Stroke**: `roughness: 0`, `strokeWidth: 2`, light strokes on dark.
- **Fill**: `solid` muted, semi-opaque card surfaces.
- **Font**: `Helvetica`, size 16 body / 22 heading, light text on dark.
- **Palette**: bg `#1e1e1e`, surfaces `#2b2b2b`, text `#e9ecef`, accents `#4dabf7` `#69db7c` `#ffd43b`.

### minimal-whiteboard
- **Use when**: workshops, retro boards, quick concept sketches, low-noise layouts.
- **Stroke**: `roughness: 0.5`, `strokeWidth: 1.5`.
- **Fill**: `transparent` (outline only) or a single tint.
- **Font**: `Virgil` or `Helvetica`, size 18 body / 24 heading.
- **Palette**: ink `#212529`, one accent only, generous white space.

### portfolio-polished
- **Use when**: case studies, public diagrams, anything shipped to an audience.
- **Stroke**: `roughness: 0`, `strokeWidth: 2`, consistent corner radius.
- **Fill**: `solid` refined tints, subtle shadows via layered rects.
- **Font**: `Helvetica`, size 16 body / 24 heading, strict hierarchy.
- **Palette**: restrained 3-color system, aligned to brand, AA-contrast checked.

## Palette Rules
- Cap at **3 hues + neutrals** per drawing. More reads as noise and hurts density score.
- Reserve **one accent** for emphasis (the thing the viewer should look at first).
- Card fills are tints (10-20% saturation); strokes are the saturated version.
- Ensure text/background contrast meets WCAG AA (>= 4.5:1) — fails trigger legibility flags.

## Spacing Rules
- Snap everything to the **20px grid**. Off-grid positions look accidental.
- Honor minimum gaps (see geometry-rules.md): cards 48px, frames 64px, arrow lanes 32px.
- Pad inside cards by 16px minimum; never let text touch a card border.
- Keep a uniform gutter between columns/rows; irregular gutters read as misalignment.

## Typography Rules
- Two sizes max per role: one body, one heading. Optional caption at body-2px.
- Never go below **16px** rendered (SMALL_FONT penalty). Headings >= 20px.
- One font family for prose; monospace only for code/identifiers.
- Left-align body text; center only short labels inside shapes.
- Line length inside cards: aim for 3-6 words per line, wrap rather than shrink.

## When To Pick Each
| Goal | Preset |
|------|--------|
| Explain casually / teach | handdrawn-clean |
| Precise spec / API doc | technical-docs |
| Sell / pitch | startup-deck |
| Infra on dark canvas | dark-architecture |
| Workshop / low noise | minimal-whiteboard |
| Public case study | portfolio-polished |

When unsure, default to **technical-docs** for systems and **handdrawn-clean** for
explainers — both clear the quality bar with the least tuning.
