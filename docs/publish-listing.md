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
2. Open the plugin — it scans your selection automatically
3. Review proposed tags and confidence levels for each icon
4. Optionally strip naming prefixes (e.g., `brand-`, `01-`) to improve match quality
5. Choose write mode: merge (default) or append
6. Click Write — tags are saved to component descriptions and a changelog is created

**Safe by default:** Nothing is written until you confirm. Existing descriptions are preserved in merge mode.

**Works offline:** The plugin uses a compiled, bundled semantic dataset. No network calls are made during use.

**Remembers your prefixes:** If your icon library uses naming prefixes, the plugin saves them and auto-applies them the next time you open the same file.

## Community tags

icons, design systems, search, metadata, components, libraries, naming, taxonomy, tagging, icon library, semantic search, discoverability

## Cover image concept

Plugin panel shown alongside a Figma canvas with icon components selected. Panel shows scan results with component names and tag lists. A before/after comparison in Figma's right panel shows an empty or terse component description next to the enriched version with semantic search tags.

## Screenshot checklist

- [ ] Plugin panel open, scan complete, showing 6–10 results with names and tag lists
- [ ] Single row expanded to show normalized name, normalization steps, and existing description
- [ ] Controls row visible with mode toggle (merge / append) and Low confidence checkbox
- [ ] Prefix strip input visible with a Re-match button
- [ ] Changelog page in Figma showing a written frame with component names and tags
- [ ] Before/after: component description panel showing terse original vs. enriched with search tags

## Support

- **Support email:** apurvrdx@gmail.com
- **Issue reporting:** Open an issue on the GitHub repository
- **Include in reports:** Figma file type (library vs. local), component names that failed to match, plugin version from the description block meta line

## Publish checklist

- [ ] `npm run build` passes cleanly
- [ ] `npm run build-thesaurus` has been run with the latest `@phosphor-icons/core`
- [ ] Plugin ID in `manifest.json` updated to the real Figma-assigned numeric ID
- [ ] All docs reflect actual plugin behavior (README, how-to-use.md, testing-checklist.md)
- [ ] Tested against a real Figma file with icon components — scan, write, and changelog all work
- [ ] Screenshots captured and match the current UI
- [ ] Listing copy matches `mimir-copy-v1.0.md`
