# Testing Checklist — Mimir

Use this checklist before publishing a new version. Work through each section in order.

## Normalization tests (run via `scripts/smoke-test-match.ts`)

- [ ] `"trash"` → `"trash"`, confidence `high`, via `exact-canonical`
- [ ] `"sap-icon://airplane"` → `"airplane"`, confidence `medium`, via `normalized-canonical`
- [ ] `"delete-filled-24"` → `"delete"` after normalization (or no match — Phosphor has no `delete`)
- [ ] `"icon/core/action/cloud-24"` → `"cloud"`, steps include `namespace-strip`, `category-strip`, `size-suffix-strip`
- [ ] `"ic"` → `"ic"`, steps include `strip-aborted-empty` (safety guard)
- [ ] `"cloud-lightning-fill"` → `"cloud-lightning"`, steps include `style-suffix-strip`

## Match engine tests

- [ ] Exact canonical match: component named `"arrow-right"` → confidence `high`
- [ ] Alias match: component using a known deprecated Phosphor alias → confidence `high`
- [ ] Normalized match: `"ArrowRight"` (PascalCase from a design system) → matches via `normalized-canonical`
- [ ] Fuzzy match (low confidence): close-but-not-exact name → triggers fuzzy path, confidence `low`
- [ ] No match: completely custom name → confidence `none`, no write attempted

## Write mode tests

- [ ] **Merge — first run:** existing description `"Arrow pointing right"`, no prior Mimir block → result: `"Arrow pointing right\n\n[mimir:start]…[mimir:end]"`
- [ ] **Merge — re-run:** existing description already contains a Mimir block → block is replaced in place, not duplicated
- [ ] **Append:** always appends a new Mimir block after existing content, even when a Mimir block is already present (intentional duplicate)
- [ ] **Replace:** result contains only the Mimir block; prior description content is gone

## Figma real-file tests

- [ ] Select 1 `ComponentNode` → scan shows 1 result
- [ ] Select 1 `ComponentSetNode` → scan shows 1 result (writes to the set node, not its children)
- [ ] Select a mix of `ComponentNode`, `ComponentSetNode`, and `FrameNode` → frame shown as UNSUPPORTED and skipped; other nodes processed normally
- [ ] Select 50+ icons → no UI freeze, all rows render and scroll correctly
- [ ] Write to 10 components → verify in Figma's component description panel that descriptions were updated correctly
- [ ] Export JSON report → verify `schemaVersion`, `datasetVersion`, `sources`, and per-item `matchResult` fields are all present and correct

## Description format tests

- [ ] Generated block starts with `[mimir:start]` and ends with `[mimir:end]`
- [ ] Tags line format: `Search tags: tag1, tag2, tag3`
- [ ] Source attribution line: `Source: phosphor · matched: <canonicalName> · confidence: high`
- [ ] Version line: `Mimir: 1.0.0 · schema: 1.0.0`
- [ ] Block is human-readable when viewed in Figma's description panel

## Pre-publish checklist

- [ ] `npm run build` exits 0
- [ ] `npx tsc --noEmit` exits 0 with no type errors
- [ ] Plugin loads in Figma desktop without console errors (check DevTools via right-click → Inspect on the plugin panel)
- [ ] Scan + write flow works end-to-end on a real Figma file
- [ ] JSON session report downloads correctly and parses without errors
- [ ] Plugin ID in `manifest.json` updated to the real Figma-assigned numeric ID from the developer portal
