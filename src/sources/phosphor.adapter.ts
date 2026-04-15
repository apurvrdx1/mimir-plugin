import { icons } from "@phosphor-icons/core";
import type { IconEntry } from "@phosphor-icons/core";
import phosphorPkg from "@phosphor-icons/core/package.json";
import { SCHEMA_VERSION } from "../schema/icon-thesaurus";
import type { IconSemanticEntry } from "../schema/icon-thesaurus";
import type { SemanticSourceAdapter } from "./types";

export class PhosphorAdapter implements SemanticSourceAdapter {
  readonly sourceId = "phosphor";
  readonly sourceVersion: string;

  constructor() {
    this.sourceVersion = phosphorPkg.version;
  }

  async fetchOrLoadRawData(): Promise<IconEntry[]> {
    return icons as unknown as IconEntry[];
  }

  async transformToSemanticEntries(raw: unknown): Promise<IconSemanticEntry[]> {
    const entries = raw as IconEntry[];
    return entries.map((entry) => this.toSemanticEntry(entry));
  }

  private toSemanticEntry(entry: IconEntry): IconSemanticEntry {
    const aliases: string[] = entry.alias
      ? [entry.alias.name, entry.alias.pascal_name]
      : [];

    const tags = (entry.tags as string[]).filter(
      (t) => !/^\*.*\*$/.test(t)
    );

    return {
      schemaVersion: SCHEMA_VERSION,
      canonicalId: entry.name,
      canonicalName: entry.name,
      normalizedKeys: [entry.name],
      aliases,
      tags,
      category: entry.categories[0] as string | undefined,
      figmaCategory: entry.figma_category as string | undefined,
      regions: [],
      languages: [],
      sourceAttributions: [
        {
          sourceId: this.sourceId,
          sourceVersion: this.sourceVersion,
          sourceEntryId: entry.name,
          confidence: "high",
        },
      ],
    };
  }
}
