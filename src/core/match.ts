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
