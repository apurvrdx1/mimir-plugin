# CLAUDE.md

## Project

Mimir is a Figma plugin that improves icon discoverability in Figma libraries by adding semantic tags to icon components via their description fields.

## Product summary

- Product name: Mimir
- Subtitle: Add semantic tags to icon components so they’re easier to find in Figma libraries.
- Core problem: icon components are often named too literally, while users search using synonyms, actions, regional terms, and team-specific vocabulary.
- V1 goal: scan selected icon components, match them to a compiled semantic dataset, preview tags, and write clean searchable descriptions.
- Architecture goal: source-agnostic Icon Thesaurus with provider adapters.
- V1 source: Phosphor only, via a source adapter.
- Runtime rule: no live scraping or runtime network dependency for matching.

## Working style

- Stay in planning mode first for major changes.
- Before implementation, propose:
  1. implementation plan
  2. assumptions and risks
  3. file tree
  4. commands to run
- For non-trivial changes, wait for approval before writing lots of code.
- Keep changes minimal, modular, and easy to review.
- Prefer strong typing and small functions.
- Avoid unnecessary frameworks.
- Do not overengineer for hypothetical future needs.

## Architecture rules

- The core internal model is called `Icon Thesaurus`.
- Do not hardcode the app around Phosphor-specific naming.
- Phosphor is a source adapter, not the app’s data model.
- Matching logic must depend on normalized internal schema, not raw source-specific fields.
- Keep schema evolution explicit and versioned.
- Keep source versioning separate from plugin versioning.
- Runtime compiled dataset should live in a source-agnostic path.

## Data rules

- Prefer `@phosphor-icons/core` as the primary structured source for v1.
- Treat `phosphor-icons/homepage` only as optional reference material.
- Do not scrape live site HTML unless explicitly approved as a fallback.
- Keep source instability isolated inside adapters.
- If source ingestion is unstable, create a deterministic fallback compiled dataset.

## UX rules

- Never write to component descriptions without explicit confirmation.
- Default write mode: merge and deduplicate.
- Support append and replace modes too.
- Always show:
  - original name
  - normalized name
  - matched canonical name
  - confidence
  - source attribution
  - proposed tags
  - existing description preview
  - final description preview
- Keep the UI compact and utility-first.

## Description rules

- Use plain text in v1.
- Preserve existing descriptions unless replace mode is chosen.
- If a prior Mimir-generated block exists, update it instead of duplicating it.
- Keep generated descriptions readable by humans, not just machines.

## Code quality

- Use TypeScript.
- Keep dependencies minimal.
- Prefer esbuild or similarly lightweight tooling.
- Handle unsupported node types gracefully.
- Never crash on partial failure.
- Continue processing other nodes if one write fails.
- Include a JSON session report export.

## Validation workflow

When implementing a feature:

1. explain the plan
2. implement
3. run targeted verification
4. summarize what worked, what is unverified, and any limitations

If verification is missing, say so explicitly.
Do not claim something works unless you verified it.

## Docs to maintain

Always keep these files updated when behavior changes:

- README.md
- docs/how-to-use.md
- docs/publish-listing.md
- docs/testing-checklist.md

## Publish requirements

The Community listing must match actual behavior.
Do not describe features that are not implemented.
Make docs and screenshots easy to produce from the current build.

## Commands

Claude should prefer npm scripts over ad hoc commands whenever possible.
If adding a new recurring workflow, add an npm script for it.

Expected scripts:

- npm install
- npm run build
- npm run dev
- npm run watch
- npm run refresh-sources
- npm run build-thesaurus

## Git workflow

- Make small commits at logical milestones.
- Do not rewrite unrelated files.
- Keep diffs focused.
- Ask before large refactors.

## When uncertain

If there is ambiguity about Figma API behavior, source schema, or search reliability:

- state the uncertainty clearly
- isolate the risk
- choose the safest working v1 path
- document the limitation in README and testing notes
