export const MIMIR_SEPARATOR = "______________";

export type WriteMode = "merge" | "append";

export interface ParsedDescription {
  /** Text BEFORE the mimir block (trimmed). */
  userContent: string;
  /** The existing mimir block text (trimmed), or null if absent. */
  mimirBlock: string | null;
}

/**
 * Split an existing description into user-authored content and the Mimir-managed block.
 * Detects both the current format (tags-first, separator at end) and the legacy format
 * (separator-first) so old blocks are replaced cleanly on the next merge write.
 */
export function parseExistingDescription(text: string): ParsedDescription {
  // Current format: "search tags:…\n(mimir …)\n______________"
  const newMatch = /\n?search tags:[\s\S]*\n_{14}\s*$/.exec(text);
  if (newMatch) {
    return {
      userContent: text.slice(0, newMatch.index).trim(),
      mimirBlock: text.slice(newMatch.index).trim(),
    };
  }
  // Legacy format: "______________\nsearch tags:…"
  const legacyMatch = /\n?_{14}\nsearch tags:/.exec(text);
  if (legacyMatch) {
    return {
      userContent: text.slice(0, legacyMatch.index).trim(),
      mimirBlock: text.slice(legacyMatch.index).trim(),
    };
  }
  return { userContent: text.trim(), mimirBlock: null };
}

/**
 * Build the Mimir-managed block written into a component description.
 *
 * Example output:
 * ```
 * search tags: delete, trash, trash can, dustbin, remove, discard, bin
 * (mimir 1.0.0 · added: 2026-04-16 10:01 am)
 * ______________
 * ```
 */
export function formatMimirBlock(
  tags: string[],
  pluginVersion: string,
  date: string,
  time = ""
): string {
  const tagLine = `search tags: ${tags.join(", ")}`;
  const metaLine = `(mimir ${pluginVersion} · added: ${date}${time ? ` ${time}` : ""})`;
  return [tagLine, metaLine, MIMIR_SEPARATOR].join("\n");
}

/**
 * Compose the final description string from existing content and a freshly
 * formatted Mimir block, respecting the requested write mode.
 *
 * - `"merge"`:   Replace the existing Mimir block in-place (or append if none).
 *                Preserves user content above with one blank-line separator.
 * - `"append"`:  Always append the new block after existing text, even if a
 *                Mimir block already exists.
 */
export function composeDescription(
  existing: string,
  newMimirBlock: string,
  mode: WriteMode
): string {
  switch (mode) {
    case "append": {
      const trimmed = existing.trim();
      if (trimmed === "") return newMimirBlock;
      return `${trimmed}\n\n${newMimirBlock}`;
    }

    case "merge": {
      const { userContent } = parseExistingDescription(existing);
      if (userContent === "") return newMimirBlock;
      return `${userContent}\n\n${newMimirBlock}`;
    }
  }
}

/**
 * Extract the tag array from the Mimir block already present in a description.
 * Returns null if no Mimir block is found.
 */
export function extractMimirTags(description: string): string[] | null {
  const { mimirBlock } = parseExistingDescription(description);
  if (!mimirBlock) return null;
  const match = mimirBlock.match(/^search tags:\s*(.+)$/m);
  if (!match) return null;
  return match[1]
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
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
