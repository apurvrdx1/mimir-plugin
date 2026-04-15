// Icon Thesaurus schema — Phase 2a stub
// Full implementation lives in the schema layer (Phase 2a).
// This stub satisfies the type contract consumed by the source adapter layer.

export const SCHEMA_VERSION = "1.0.0" as const;

export interface SourceAttribution {
  sourceId: string;
  sourceVersion: string;
  sourceEntryId: string;
  confidence: "high" | "medium" | "low";
}

export interface IconSemanticEntry {
  schemaVersion: string;
  canonicalId: string;
  canonicalName: string;
  normalizedKeys: string[];
  aliases: string[];
  tags: string[];
  category: string | undefined;
  figmaCategory: string | undefined;
  regions: string[];
  languages: string[];
  sourceAttributions: SourceAttribution[];
}
