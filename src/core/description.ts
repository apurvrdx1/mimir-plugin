import { SCHEMA_VERSION } from "../schema/icon-thesaurus";
import type { IconSemanticEntry } from "../schema/icon-thesaurus";
import type { MatchResult } from "./match";

export const MIMIR_BLOCK_START = "[mimir:start]";
export const MIMIR_BLOCK_END = "[mimir:end]";

export type WriteMode = "merge" | "append" | "replace";

export interface ParsedDescription {
  /** Text BEFORE the mimir block (trimmed). */
  userContent: string;
  /** The existing mimir block text (between sentinels, trimmed), or null if absent. */
  mimirBlock: string | null;
}

/**
 * Split an existing description into user-authored content and the Mimir-managed block.
 */
export function parseExistingDescription(text: string): ParsedDescription {
  const startIdx = text.indexOf(MIMIR_BLOCK_START);
  const endIdx = text.indexOf(MIMIR_BLOCK_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return { userContent: text.trim(), mimirBlock: null };
  }

  const userContent = text.slice(0, startIdx).trim();
  const mimirBlock = text
    .slice(startIdx + MIMIR_BLOCK_START.length, endIdx)
    .trim();

  return { userContent, mimirBlock };
}

/**
 * Build the Mimir-managed block that gets written into a component description.
 *
 * Example output:
 * ```
 * [mimir:start]
 * Search tags: delete, trash, trash can, dustbin, remove, discard, bin
 * Source: phosphor · matched: delete · confidence: high
 * Mimir: 1.0.0 · schema: 1.0.0
 * [mimir:end]
 * ```
 */
export function formatMimirBlock(
  entry: IconSemanticEntry,
  tags: string[],
  matchResult: MatchResult,
  pluginVersion: string
): string {
  const sourceId =
    entry.sourceAttributions.length > 0
      ? entry.sourceAttributions[0].sourceId
      : "unknown";

  const tagLine = `Search tags: ${tags.join(", ")}`;
  const sourceLine = `Source: ${sourceId} · matched: ${entry.canonicalName} · confidence: ${matchResult.confidence}`;
  const versionLine = `Mimir: ${pluginVersion} · schema: ${SCHEMA_VERSION}`;

  return [MIMIR_BLOCK_START, tagLine, sourceLine, versionLine, MIMIR_BLOCK_END].join(
    "\n"
  );
}

/**
 * Compose the final description string from existing content and a freshly
 * formatted Mimir block, respecting the requested write mode.
 *
 * - `"merge"`:   Replace the existing Mimir block in-place (or append if none).
 *                Preserves user content above with one blank-line separator.
 * - `"append"`:  Always append the new block after existing text, even if a
 *                Mimir block already exists.
 * - `"replace"`: Return the new Mimir block only, discarding all prior content.
 */
export function composeDescription(
  existing: string,
  newMimirBlock: string,
  mode: WriteMode
): string {
  switch (mode) {
    case "replace":
      return newMimirBlock;

    case "append": {
      const trimmed = existing.trim();
      if (trimmed === "") {
        return newMimirBlock;
      }
      return `${trimmed}\n\n${newMimirBlock}`;
    }

    case "merge": {
      const { userContent } = parseExistingDescription(existing);
      if (userContent === "") {
        return newMimirBlock;
      }
      return `${userContent}\n\n${newMimirBlock}`;
    }
  }
}

/**
 * Deduplicate a tag array, preserving first-occurrence casing.
 * Filters out empty strings after trimming.
 */
export function deduplicateTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (trimmed === "") continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }

  return result;
}
