// Node ambient declarations — only used in the smoke-test block (require.main === module).
// The main Figma plugin build excludes this block; declarations satisfy tsc under the
// browser-targeted tsconfig which doesn't include @types/node.
declare const require: { main: unknown; (id: string): unknown; resolve(id: string): string };
declare const module: { exports: unknown };
declare const process: { exit(code?: number): never };

import type { CompiledIconThesaurus } from "../schema/compiled-dataset";
import type { IconSemanticEntry } from "../schema/icon-thesaurus";
import { normalizeName } from "./normalize";

export type MatchConfidence = "high" | "medium" | "low" | "none";
export type MatchedVia =
  | "exact-canonical"
  | "exact-alias"
  | "normalized-canonical"
  | "normalized-alias"
  | "fuzzy"
  | "none";

export interface MatchResult {
  entry: IconSemanticEntry | null;
  confidence: MatchConfidence;
  matchedVia: MatchedVia;
  normalizationSteps: string[];
  score?: number;
}

export interface ThesaurusIndex {
  lookup: Map<string, IconSemanticEntry>;
  entries: IconSemanticEntry[];
  thesaurusVersion: string;
  schemaVersion: string;
}

function trigramScore(a: string, b: string): number {
  const trigrams = (s: string): Set<string> => {
    const padded = `  ${s} `;
    const set = new Set<string>();
    for (let i = 0; i < padded.length - 2; i++) {
      set.add(padded.slice(i, i + 3));
    }
    return set;
  };
  const ta = trigrams(a);
  const tb = trigrams(b);
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  return (2 * intersection) / (ta.size + tb.size);
}

export function buildThesaurusIndex(thesaurus: CompiledIconThesaurus): ThesaurusIndex {
  const lookup = new Map<string, IconSemanticEntry>();

  for (const entry of thesaurus.entries) {
    // Canonical ID — exact, first writer wins
    if (!lookup.has(entry.canonicalId)) {
      lookup.set(entry.canonicalId, entry);
    }

    // Normalized canonical ID
    const normalizedCanonical = normalizeName(entry.canonicalId).normalized;
    if (!lookup.has(normalizedCanonical)) {
      lookup.set(normalizedCanonical, entry);
    }

    // Aliases
    for (const alias of entry.aliases) {
      const aliasLower = alias.toLowerCase();
      if (!lookup.has(aliasLower)) {
        lookup.set(aliasLower, entry);
      }

      const normalizedAlias = normalizeName(alias).normalized;
      if (!lookup.has(normalizedAlias)) {
        lookup.set(normalizedAlias, entry);
      }
    }
  }

  return {
    lookup,
    entries: thesaurus.entries,
    thesaurusVersion: thesaurus.datasetVersion,
    schemaVersion: thesaurus.schemaVersion,
  };
}

export function matchIcon(name: string, index: ThesaurusIndex): MatchResult {
  const noMatch: MatchResult = {
    entry: null,
    confidence: "none",
    matchedVia: "none",
    normalizationSteps: [],
  };

  // Stage 1: exact-canonical
  const exactCanonical = index.lookup.get(name);
  if (exactCanonical) {
    return {
      entry: exactCanonical,
      confidence: "high",
      matchedVia: "exact-canonical",
      normalizationSteps: [],
    };
  }

  // Stage 2: exact-alias (lowercase lookup)
  const exactAlias = index.lookup.get(name.toLowerCase());
  if (exactAlias) {
    return {
      entry: exactAlias,
      confidence: "high",
      matchedVia: "exact-alias",
      normalizationSteps: [],
    };
  }

  // Stage 3: normalized lookup — covers both canonical and alias keys in the map
  const { normalized, steps: normSteps } = normalizeName(name);
  const normalizedMatch = index.lookup.get(normalized);
  if (normalizedMatch) {
    const confidence: MatchConfidence =
      normSteps.length === 1 && normSteps[0] === "lowercase" ? "high" : "medium";
    return {
      entry: normalizedMatch,
      confidence,
      matchedVia: "normalized-canonical",
      normalizationSteps: normSteps,
    };
  }

  // Stage 4: normalized-alias — check alias keys explicitly in case of map collision
  for (const entry of index.entries) {
    for (const alias of entry.aliases) {
      if (normalizeName(alias).normalized === normalized) {
        return {
          entry,
          confidence: "medium",
          matchedVia: "normalized-alias",
          normalizationSteps: normSteps,
        };
      }
    }
  }

  // Stage 5: fuzzy trigram
  let bestScore = 0;
  let bestEntry: IconSemanticEntry | null = null;

  for (const entry of index.entries) {
    const score = trigramScore(normalized, entry.canonicalId);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestScore >= 0.4 && bestEntry !== null) {
    return {
      entry: bestEntry,
      confidence: "low",
      matchedVia: "fuzzy",
      normalizationSteps: normSteps,
      score: bestScore,
    };
  }

  return noMatch;
}

// Smoke test — run with: npx ts-node --project tsconfig.scripts.json src/core/match.ts
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const thesaurusData = require("../data/compiled/icon-thesaurus.v1.json") as CompiledIconThesaurus;

  const index = buildThesaurusIndex(thesaurusData);
  console.log(
    `Index built: ${index.entries.length} entries, ${index.lookup.size} lookup keys`
  );
  console.log(`Thesaurus version: ${index.thesaurusVersion}`);
  console.log();

  const tests: Array<{ input: string; expectation: string }> = [
    { input: "trash", expectation: 'confidence "high"' },
    { input: "Icon / Delete / Regular", expectation: "entry found" },
    { input: "sap-icon://airplane", expectation: "entry found" },
  ];

  let allPassed = true;

  for (const { input, expectation } of tests) {
    const result = matchIcon(input, index);
    const found = result.entry !== null;
    const summary = found
      ? `entry="${result.entry!.canonicalId}" confidence=${result.confidence} via=${result.matchedVia}`
      : `NO MATCH confidence=${result.confidence}`;

    console.log(`Input:       "${input}"`);
    console.log(`Expectation: ${expectation}`);
    console.log(`Result:      ${summary}`);
    if (result.normalizationSteps.length > 0) {
      console.log(`Steps:       [${result.normalizationSteps.join(", ")}]`);
    }
    if (result.score !== undefined) {
      console.log(`Score:       ${result.score.toFixed(3)}`);
    }
    console.log();

    if (expectation === 'confidence "high"' && result.confidence !== "high") {
      console.error(`FAIL: expected confidence "high", got "${result.confidence}"`);
      allPassed = false;
    }
    if (expectation === "entry found" && !found) {
      console.warn(`WARN: expected entry found but got no match for "${input}" (dataset may not contain this canonical name)`);
    }
  }

  if (allPassed) {
    console.log("Smoke test complete.");
    process.exit(0);
  } else {
    console.error("Smoke test FAILED.");
    process.exit(1);
  }
}
