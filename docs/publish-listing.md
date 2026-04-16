# Figma Community Listing — Mimir

## Plugin name

Mimir

## Subtitle

Add semantic tags to icon components so they're easier to find in Figma libraries, without tagging them manually.

## Short description (under 100 words)

Mimir adds semantic tags to icon components so teams can find icons with natural search terms, not just exact component names, while saving time on manual tagging and cleanup.

## Long description

Mimir helps design teams make icon libraries easier to search in Figma. Icon components are often named after the original SVG file or a narrow visual label, but people search in many different ways, including by action, object, intent, region, language, or team convention. One person may look for "delete," while another searches for "trash," "bin," "dustbin," or "remove." Mimir scans selected icon components, matches them to semantic metadata, and writes searchable tags into component descriptions so the right icon is easier to find, even when the search term does not exactly match the component name. Instead of tagging each icon by hand, teams can use Mimir to automate much of that repetitive cleanup work, save time, and keep libraries easier to discover and maintain.

**How it works:**
1. Select icon components or component sets in Figma
2. Click Scan — Mimir normalizes names and matches them against the bundled Icon Thesaurus
3. Review proposed tags with confidence scores (high / medium / low)
4. Edit any tags inline
5. Choose write mode: merge (default), append, or replace
6. Click Write — tags are saved to component descriptions

**Safe by default:** Nothing is written until you confirm. Existing descriptions are preserved in merge mode.

**Works offline:** The plugin uses a compiled, bundled semantic dataset. No network calls are made during use.

## Community tags

icons, design systems, search, metadata, components, libraries, naming, taxonomy, tagging, icon library, semantic search, discoverability

## Cover image concept

Plugin panel shown alongside a Figma canvas with icon components selected. Panel shows scan results with confidence badges and tag lists. A before/after description comparison is visible in the right-side panel, showing the original terse component description alongside the enriched version with semantic tags.

## Screenshot checklist

- [ ] Plugin panel open, scan complete, showing 5–10 results with mixed confidence levels
- [ ] Single row expanded showing normalized name, match path, editable tags, and description preview
- [ ] Write mode controls visible (merge / append / replace toggle)
- [ ] Before/after: component description panel showing old vs. new content
- [ ] Unmatched results visible with "Copy unmatched" button

## Support

- **Support email:** apurvrdx@gmail.com
- **Issue reporting:** Open an issue on the project GitHub repository
- **Include in reports:** Figma file type (library vs. local), component names that failed to match, plugin version from the JSON session report

## Publish checklist

- [ ] `npm run build` passes cleanly with no TypeScript errors
- [ ] `npm run build-thesaurus` has been run with the latest `@phosphor-icons/core`
- [ ] All docs reflect actual plugin behavior (README, how-to-use, testing-checklist)
- [ ] Tested against a real Figma file with Phosphor icon components
- [ ] Screenshots captured and match the current UI
- [ ] Plugin ID in `manifest.json` updated to the real Figma-assigned numeric ID from the developer portal
