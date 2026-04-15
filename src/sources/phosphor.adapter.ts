// Node ambient declarations — used only in resolvePhosphorVersion() which is
// called at build time via tsconfig.scripts.json, not bundled into the Figma plugin.
declare const require: { (id: string): unknown; resolve(id: string): string };

import { icons } from "@phosphor-icons/core";
import type { IconEntry } from "@phosphor-icons/core";
import { SCHEMA_VERSION } from "../schema/icon-thesaurus";
import type { IconSemanticEntry } from "../schema/icon-thesaurus";
import type { SemanticSourceAdapter } from "./types";

// @phosphor-icons/core does not expose package.json via its exports map,
// so we resolve the package directory via require.resolve and read the file directly.
function resolvePhosphorVersion(): string {
  try {
    // resolve the main entry to get a path inside the package directory
    const entryPath: string = require.resolve("@phosphor-icons/core");
    // walk up until we find node_modules/@phosphor-icons/core
    const parts = entryPath.split(/[\\/]/);
    const pkgIdx = parts.lastIndexOf("@phosphor-icons");
    if (pkgIdx === -1) return "unknown";
    const pkgRoot = parts.slice(0, pkgIdx + 2).join("/");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(`${pkgRoot}/package.json`) as { version: string };
    return pkg.version;
  } catch {
    return "unknown";
  }
}

export class PhosphorAdapter implements SemanticSourceAdapter {
  readonly sourceId = "phosphor";
  readonly sourceVersion: string;

  constructor() {
    this.sourceVersion = resolvePhosphorVersion();
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
