import type { IconSemanticEntry } from "../schema/icon-thesaurus";

/**
 * Merge entries from multiple source adapters into a single deduplicated list.
 * In v1 with a single source, this is a passthrough.
 * Future: deduplicate by canonicalId, merge sourceAttributions and tags.
 */
export function mergeSourceOutputs(
  sourcesEntries: IconSemanticEntry[][]
): IconSemanticEntry[] {
  if (sourcesEntries.length === 1) {
    return sourcesEntries[0];
  }

  const merged = new Map<string, IconSemanticEntry>();

  for (const entries of sourcesEntries) {
    for (const entry of entries) {
      const existing = merged.get(entry.canonicalId);
      if (!existing) {
        merged.set(entry.canonicalId, { ...entry });
      } else {
        // Merge: deduplicate tags, combine attributions
        const mergedTags = Array.from(
          new Set([...existing.tags, ...entry.tags])
        );
        const mergedAliases = Array.from(
          new Set([...existing.aliases, ...entry.aliases])
        );
        const mergedAttributions = [
          ...existing.sourceAttributions,
          ...entry.sourceAttributions,
        ];
        merged.set(entry.canonicalId, {
          ...existing,
          tags: mergedTags,
          aliases: mergedAliases,
          sourceAttributions: mergedAttributions,
        });
      }
    }
  }

  return Array.from(merged.values());
}
