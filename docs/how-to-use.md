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
3. Open the plugin: Plugins → Development → Mimir
4. Click **Scan Selection** — the plugin reads the names and descriptions of the selected nodes
5. Review the results list — each row shows: original name, matched canonical name, confidence level, and proposed tags
6. Edit tags inline in any row if needed (add, remove, or reorder tags before writing)
7. Choose a write mode: merge (default), append, or replace
8. Click **Write Descriptions**
9. Confirm the write — descriptions are saved to the selected components in the Figma file
10. Optionally export a JSON session report for audit or debugging purposes

## Write modes

| Mode | Behavior |
|---|---|
| **Merge** (default) | Preserves the existing description. If a prior Mimir block already exists in the description, it is updated in place. If no Mimir block exists, one is appended after the existing content. |
| **Append** | Always appends a new Mimir block, even if one already exists. This intentionally creates a duplicate — useful if you want to track tag history. |
| **Replace** | Replaces the entire component description with only the Mimir-generated block. Any existing human-written description content is removed. Use with caution. |

## Confidence levels

| Level | Meaning |
|---|---|
| **High** | Exact or trivially-normalized match (e.g., case normalization, separator stripping). Included automatically. |
| **Medium** | Match via alias or multi-step normalization (e.g., namespace stripping, size suffix removal). Included automatically but worth a quick review. |
| **Low** | Fuzzy match — close but not exact. Excluded by default. Enable "Include low-confidence" in the plugin to review and optionally include these. |
| **None** | No match found in the Icon Thesaurus. Not written. The component name is copyable for manual triage or a future custom entry. |

## Troubleshooting

**Plugin won't load in Figma:**
Verify `npm run build` completed without errors. Check that `dist/code.js` and `dist/ui.html` both exist. Re-run `npm run build` if either is missing.

**No icons matched after scan:**
Check that the selected nodes are `ComponentNode` or `ComponentSetNode` — frames, groups, and instances are not supported and will be shown as UNSUPPORTED. If names are heavily customized (e.g., `brand/icon/size/color/variant`), try enabling low-confidence matches from the plugin settings.

**Descriptions not searchable after writing:**
Figma may need the file to be published to a library before description fields are indexed for search. The plugin writes the data correctly; discoverability depends on Figma's indexing behavior.

**`npm run build-thesaurus` fails:**
Ensure `@phosphor-icons/core` is installed (run `npm install` first). Verify Node.js version is 18 or higher (`node --version`). Check the terminal output for a specific error — adapter errors are reported per-icon and should not abort the full build.
