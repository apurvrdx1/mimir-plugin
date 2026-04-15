import * as fs from "fs";
import * as path from "path";
import type { CompiledIconThesaurus } from "../src/schema/compiled-dataset";
import { buildThesaurusIndex, matchIcon } from "../src/core/match";

const thesaurusPath = path.join(__dirname, "../src/data/compiled/icon-thesaurus.v1.json");
const thesaurus = JSON.parse(fs.readFileSync(thesaurusPath, "utf8")) as CompiledIconThesaurus;
const index = buildThesaurusIndex(thesaurus);

console.log(`Index built: ${index.entries.length} entries`);

const cases = [
  "trash",
  "Icon / Delete / Regular",
  "sap-icon://airplane",
];

for (const input of cases) {
  const result = matchIcon(input, index);
  console.log(`"${input}" → ${result.entry?.canonicalId ?? "no match"} [${result.confidence}] via ${result.matchedVia}`);
}

console.log("Done.");
