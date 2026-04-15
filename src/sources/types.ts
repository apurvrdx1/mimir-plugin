import type { IconSemanticEntry } from "../schema/icon-thesaurus";

export interface SemanticSourceAdapter {
  readonly sourceId: string;
  readonly sourceVersion: string;
  fetchOrLoadRawData(): Promise<unknown>;
  transformToSemanticEntries(raw: unknown): Promise<IconSemanticEntry[]>;
}
