# Testing Checklist — Mimir

Use this before publishing a new version. Work through each section in order.

---

## Build

- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] `dist/code.js` and `dist/ui.html` both exist and are non-empty
- [ ] Plugin loads in Figma desktop without console errors (right-click the plugin panel → Inspect → Console tab)

---

## Normalization

Run manually via the expanded row view in the plugin (shows normalized name and steps):

- [ ] `"trash"` → normalized to `"trash"`, confidence `high`
- [ ] `"arrow-right"` → normalized to `"arrow-right"`, confidence `high`
- [ ] `"01-arrow-right"` → numeric prefix stripped, normalized to `"arrow-right"`, steps include `numeric-prefix-strip`
- [ ] `"icon/core/action/cloud-24"` → normalized to `"cloud"`, steps include `namespace-strip`, `category-strip`, `size-suffix-strip`
- [ ] `"cloud-lightning-fill"` → normalized to `"cloud-lightning"`, steps include `style-suffix-strip`
- [ ] `"ic"` → normalized to `"ic"`, steps include `strip-aborted-empty` (safety guard — never strips the only semantic signal)

---

## Match engine

- [ ] Exact canonical match: component named `"trash"` → confidence `high`, `matchedVia: exact-canonical`
- [ ] Normalized match: `"arrow-right"` → confidence `high`
- [ ] Low-confidence fuzzy match: a close-but-not-exact name → confidence `low`, row shows dimmed
- [ ] No match: completely custom name (e.g., `"brand-widget-xyz"`) → confidence `none`, row shows "no match"

---

## Variant / COMPONENT_SET handling

- [ ] Select a `ComponentSetNode` where all children share one name style (Pattern A — e.g., size variants of one icon) → scan shows **1 entry** for the set, writes to the set description
- [ ] Select a `ComponentSetNode` where children have different names (Pattern B — icon library packed as variants) → scan **expands** to N individual entries, one per child
- [ ] Variant names in `Property=Value` format (e.g., `"Icon=Trash"`) → displays as clean name `"Trash"`, not the raw property string
- [ ] Selecting both a `ComponentSetNode` and one of its children → no duplicates in results

---

## Custom prefix re-match

- [ ] Scan components with a naming prefix (e.g., `"brand-trash"`, `"brand-arrow-right"`)
- [ ] Prefix hint row appears in controls
- [ ] Type `"brand"` in the prefix input, click Re-match → rows re-evaluated, confidence improves where applicable
- [ ] Type multiple prefixes comma-separated (e.g., `"brand, 01"`) → both are applied per row
- [ ] Press Enter in the prefix input → same as clicking Re-match
- [ ] After re-match, stored prefixes saved to `"mimir prefixes"` frame on the changelog page (visible on canvas)
- [ ] On next scan with same file, stored prefixes are auto-applied and a note appears: `↩ prefixes from last run auto-applied`

---

## Write modes

- [ ] **Merge — first run:** component has existing description `"Arrow pointing right"`, no prior Mimir block → result: existing text preserved, Mimir block appended below
- [ ] **Merge — re-run:** component already has a Mimir block → block is updated in place, not duplicated
- [ ] **Append:** always adds a new Mimir block after existing content, even when a block is already present

---

## Description format

After writing, check the component description in Figma's right panel:

- [ ] Format is:
  ```
  search tags: tag1, tag2, tag3, ...
  (mimir 1.0.0 · added: 2026-04-16 10:01 am)
  ______________
  ```
- [ ] Tags are comma-separated on the first line
- [ ] Meta line includes plugin version, date, and 12-hour time
- [ ] Separator is 14 underscores on the last line
- [ ] Human-written description above the block is preserved in merge mode

---

## Changelog page

- [ ] After writing, Figma navigates to (then returns from) the `"mimir changelog"` page
- [ ] A new changelog frame appears on that page showing written components and their tags
- [ ] If no tags changed, written components appear in a compact `"No changes"` section
- [ ] A success notification appears with a `"View changelog"` button
- [ ] Clicking `"View changelog"` scrolls the canvas to the latest frame

---

## UI and edge cases

- [ ] Plugin auto-scans on open — existing selection is picked up immediately without clicking Scan
- [ ] Unsupported node types (frames, groups, instances) appear as `"skipped"` in results and are not written
- [ ] Selecting 50+ components — no UI freeze, rows scroll correctly
- [ ] `"Include low confidence"` checkbox shows/hides dimmed rows
- [ ] `"Copy unmatched"` button copies unmatched component names to clipboard (one per line)
- [ ] Write button shows `"Working…"` spinner after 500ms for slow writes
- [ ] Partial write failure (one node errors) — error indicator shown on that row, other rows written successfully

---

## Pre-publish

- [ ] Plugin ID in `manifest.json` updated to the real Figma-assigned numeric ID from the developer portal
- [ ] Screenshots captured and match the current UI
- [ ] All docs reflect actual behavior (README, how-to-use.md, this file)
