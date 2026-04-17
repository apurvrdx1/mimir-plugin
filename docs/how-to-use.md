# How to Use Mimir

## Who this is for

Design system teams who maintain Figma icon libraries and want those icons to be findable via Figma's search by synonym, action, or team vocabulary — not just by exact component name. If your team regularly hears "I couldn't find the icon" even though it exists in the library, Mimir is for you.

## Install locally

**Prerequisites:** Node.js 18+, Figma desktop app.

```bash
git clone <repo>
cd mimir-plugin
npm install
npm run build-thesaurus   # generates the compiled Icon Thesaurus dataset
npm run build             # bundles the plugin for Figma
```

Then in Figma desktop:

1. Menu → Plugins → Development → Import plugin from manifest…
2. Select `manifest.json` from the repo root
3. The plugin appears under Plugins → Development → Mimir

## Using the plugin

1. Open a Figma file containing icon components
2. Select one or more `ComponentNode` or `ComponentSetNode` items in the canvas or Layers panel
3. Open the plugin: Plugins → Development → Mimir — it immediately scans your selection
4. Review the results list — each row shows the component name and proposed search tags
5. If components have a naming prefix (e.g., `brand-trash`, `01-arrow-right`), type the prefix in the strip input and click **Re-match** to improve results
6. Toggle **Low confidence** to include fuzzy matches that were excluded by default
7. Uncheck any rows you don't want to write
8. Choose a write mode: **Merge** (default) or **Append**
9. Click **Write Descriptions** — tags are saved to component descriptions and a changelog entry is created

## Write modes

| Mode | Behavior |
|---|---|
| **Merge** (default) | Preserves the existing description. If a prior Mimir block already exists, it is updated in place. If no block exists, one is added after the existing content. |
| **Append** | Always adds a new Mimir block after existing content, even if one already exists. |

## Description format

Each written description block looks like this:

```
search tags: trash, delete, bin, remove, discard, rubbish
(mimir 1.0.0 · added: 2026-04-16 10:01 am)
______________
```

Any existing description content is preserved above the block in merge mode. To remove a Mimir block, delete the lines from `search tags:` through the final `______________`.

## Confidence levels

Confidence is used internally to decide which rows are pre-selected for writing.

| Level | Meaning | Default |
|---|---|---|
| **High** | Exact or trivially-normalized match | Included |
| **Medium** | Match via alias or multi-step normalization | Included |
| **Low** | Fuzzy match — close but not exact | Excluded (enable with the Low confidence toggle) |
| **None** | No match found | Not written; use Copy unmatched to collect for manual triage |

## Prefix stripping

If your icon names follow a pattern like `brand-trash` or `01-arrow-right`, the plugin will show a prefix input when it detects unmatched or low-confidence names with separators. Type the prefix and click **Re-match** to strip it and re-evaluate. You can enter multiple prefixes comma-separated (e.g., `brand, 01`).

The plugin saves your prefixes to the `mimir changelog` page and automatically applies them the next time you scan the same file.

## Variant components (COMPONENT_SET)

The plugin handles two common patterns:

- **Style variants** (e.g., one icon in Regular/Bold/Fill sizes) — treated as a single entry, writes to the set description
- **Icon library sets** (e.g., multiple different icons packed as variants) — expanded into individual entries, writes to each child component's description

## Changelog

After each write, the plugin creates a frame on a `mimir changelog` page in your Figma file. Each frame shows which components were updated and what tags were written. Components whose tags were already up to date appear in a compact `No changes` section.

## Troubleshooting

**Plugin won't load in Figma:**
Verify `npm run build` completed without errors. Check that `dist/code.js` and `dist/ui.html` both exist.

**No icons matched after scan:**
Check that the selected nodes are `ComponentNode` or `ComponentSetNode` — frames, groups, and instances are shown as skipped and not written. If names have custom prefixes, use the prefix strip input.

**Low-confidence matches are hidden:**
Enable the **Low confidence** toggle in the controls row to show and include those rows.

**Descriptions not searchable after writing:**
Figma may need the library to be re-published before description fields are indexed for search. The plugin writes the data correctly; discoverability depends on Figma's indexing.

**`npm run build-thesaurus` fails:**
Ensure `@phosphor-icons/core` is installed (`npm install`). Verify Node.js 18+. Check the terminal for per-adapter errors — they should not abort the full build.
