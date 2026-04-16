import * as fs from "fs";
import * as path from "path";
import { SourceRegistry } from "../src/sources/registry";
import { PhosphorAdapter } from "../src/sources/phosphor.adapter";
import { mergeSourceOutputs } from "../src/core/merge-sources";
import { SCHEMA_VERSION } from "../src/schema/icon-thesaurus";
import type { CompiledIconThesaurus, CompiledSourceMetadata } from "../src/schema/compiled-dataset";

async function main(): Promise<void> {
  const registry = new SourceRegistry();
  registry.register(new PhosphorAdapter());

  const adapters = registry.getAll();
  console.log(`Running ${adapters.length} source adapter(s)...`);

  const allEntries = [];
  const sourceMetas: CompiledSourceMetadata[] = [];

  for (const adapter of adapters) {
    console.log(`  → ${adapter.sourceId} (${adapter.sourceVersion})`);
    const raw = await adapter.fetchOrLoadRawData();
    const entries = await adapter.transformToSemanticEntries(raw);
    allEntries.push(entries);
    sourceMetas.push({
      sourceId: adapter.sourceId,
      sourceVersion: adapter.sourceVersion,
      entryCount: entries.length,
      generatedAt: new Date().toISOString(),
    });
    console.log(`     ${entries.length} entries`);
  }

  const mergedEntries = mergeSourceOutputs(allEntries);
  console.log(`Merged: ${mergedEntries.length} total entries`);

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const phosphorVersion = sourceMetas.find((s) => s.sourceId === "phosphor")?.sourceVersion ?? "unknown";
  const datasetVersion = `${SCHEMA_VERSION}-phosphor-${phosphorVersion}-${dateStr}`;

  const thesaurus: CompiledIconThesaurus = {
    schemaVersion: SCHEMA_VERSION,
    datasetVersion,
    generatedAt: now.toISOString(),
    sources: sourceMetas,
    entries: mergedEntries,
  };

  const outDir = path.join(__dirname, "../src/data/compiled");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "icon-thesaurus.v1.json");
  fs.writeFileSync(outPath, JSON.stringify(thesaurus, null, 2));

  console.log(`\n✓ Built ${outPath}`);
  console.log(`  schemaVersion: ${thesaurus.schemaVersion}`);
  console.log(`  datasetVersion: ${thesaurus.datasetVersion}`);
  console.log(`  entries: ${thesaurus.entries.length}`);
  console.log(`  sources: ${thesaurus.sources.map((s) => `${s.sourceId}@${s.sourceVersion}`).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
