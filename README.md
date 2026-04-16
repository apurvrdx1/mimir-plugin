# Mimir — Icon Tag Writer for Figma

> Add semantic tags to icon components so they're easier to find in Figma libraries, without tagging them manually.

## What it does

Icon components are typically named after their original SVG file or a narrow visual label, but designers search using synonyms, actions, regional terms, and team-specific vocabulary. Mimir scans selected icon components, matches them to a compiled semantic dataset (the Icon Thesaurus), and writes searchable tags into component description fields to bridge that gap.

## Developer setup

```bash
git clone <repo>
cd mimir-plugin
npm install
npm run build-thesaurus   # generate compiled Icon Thesaurus (~1512 Phosphor icons)
npm run build             # bundle plugin for Figma
```

## Loading into Figma

1. Open Figma desktop
2. Menu → Plugins → Development → Import plugin from manifest…
3. Select `manifest.json` from this repo
4. The plugin appears under Plugins → Development → Mimir

## npm scripts

| Script | What it does |
|---|---|
| `npm run build` | Bundle `src/code.ts` + `src/ui.tsx` → `dist/` |
| `npm run dev` / `watch` | Same with watch mode (rebuilds on save) |
| `npm run build-thesaurus` | Run data pipeline → generate `src/data/compiled/icon-thesaurus.v1.json` |
| `npm run refresh-sources` | Inspect raw Phosphor adapter output (debug) |

## Architecture overview

```
Build time:
  @phosphor-icons/core
    → PhosphorAdapter (src/sources/phosphor.adapter.ts)
    → IconSemanticEntry[] (src/schema/icon-thesaurus.ts)
    → CompiledIconThesaurus (src/data/compiled/icon-thesaurus.v1.json)

Runtime:
  Figma sandbox (dist/code.js)     ← reads selection, writes descriptions
        ↕ postMessage
  UI iframe (dist/ui.html)         ← matching, preview, user controls
    ├── ThesaurusIndex (in-memory Map, built at startup)
    ├── normalizeName() (src/core/normalize.ts)
    ├── matchIcon() (src/core/match.ts)
    ├── formatMimirBlock() (src/core/description.ts)
    └── SessionReport (src/core/report.ts)
```

The plugin is split across two runtimes by Figma's architecture requirement: the main thread (`code.js`) has Figma API access but no DOM; the UI iframe (`ui.html`) has DOM but communicates with the main thread only via `postMessage`. All matching, preview logic, and user interaction live in the UI iframe. Write operations are dispatched back to the main thread.

## Versioning

Three independent version axes:

- **Plugin version** — `package.json` version
- **Schema version** — `SCHEMA_VERSION` in `src/schema/icon-thesaurus.ts` (currently `1.0.0`)
- **Dataset version** — embedded in compiled JSON (`schemaVersion-phosphor-X.X.X-YYYYMMDD`)

Bump schema version on breaking changes. Refresh the thesaurus after updating `@phosphor-icons/core` by re-running `npm run build-thesaurus`.

## Adding a future icon source

1. Create `src/sources/your-source.adapter.ts` implementing `SemanticSourceAdapter`
2. Register it in `scripts/build-icon-thesaurus.ts`
3. Run `npm run build-thesaurus`

The matching engine and UI require no changes — they work against the compiled `CompiledIconThesaurus` schema.

## Known limitations

- Figma's built-in search indexes description fields, but timing varies — a library publish may be needed before new tags become discoverable. The plugin writes the data; discoverability depends on Figma's index.
- `@phosphor-icons/core`'s `alias` field is a single deprecated rename, not rich synonyms. Semantic richness comes from the `tags[]` array.
- v1 covers Phosphor only (~1512 icons). The architecture supports future sources without changes to the matching engine.
- `regions` and `languages` fields in the schema are reserved for v2 localization.
- The compiled thesaurus JSON (~1MB bundled) is inlined into `dist/ui.html`. This is intentional for offline-first operation; no network calls are made during plugin use.
