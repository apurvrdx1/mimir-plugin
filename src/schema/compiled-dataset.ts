import type { IconSemanticEntry } from "./icon-thesaurus";

export interface CompiledSourceMetadata {
  sourceId: string;
  sourceVersion: string;
  entryCount: number;
  generatedAt?: string;
}

export interface CompiledIconThesaurus {
  schemaVersion: string;
  datasetVersion: string;
  generatedAt: string;
  sources: CompiledSourceMetadata[];
  entries: IconSemanticEntry[];
}
