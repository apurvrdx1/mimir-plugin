import * as fs from "fs";
import * as path from "path";
import { PhosphorAdapter } from "../src/sources/phosphor.adapter";

async function main(): Promise<void> {
  const adapter = new PhosphorAdapter();
  console.log(`Running PhosphorAdapter v${adapter.sourceVersion}...`);
  const raw = await adapter.fetchOrLoadRawData();
  const entries = await adapter.transformToSemanticEntries(raw);
  console.log(`Transformed ${entries.length} entries`);

  const outDir = path.join(__dirname, "../src/data/sources");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "phosphor-raw.json");
  fs.writeFileSync(outPath, JSON.stringify(entries, null, 2));
  console.log(`Written to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
