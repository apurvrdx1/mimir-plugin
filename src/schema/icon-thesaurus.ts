export const SCHEMA_VERSION = "1.0.0";

export interface SourceAttribution {
  sourceId: string;
  sourceVersion: string;
  sourceEntryId?: string;
  sourceCanonicalName?: string;
  confidence: "high" | "medium" | "low";
  url?: string;
}

export interface IconSemanticEntry {
  schemaVersion: string;
  canonicalId: string;
  canonicalName: string;
  /** Lookup keys for matching — includes canonicalName and any normalized/alias variants */
  normalizedKeys: string[];
  /** Deprecated or alternate names from source (e.g. renamed icons) */
  aliases: string[];
  /** Semantic search terms */
  tags: string[];
  category?: string;
  figmaCategory?: string;
  /** Regional term variants — empty in v1 */
  regions?: string[];
  /** Language-specific variants — empty in v1 */
  languages?: string[];
  notes?: string;
  sourceAttributions: SourceAttribution[];
}
