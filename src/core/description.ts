export const MIMIR_SEPARATOR = "______________";

/** Matches the start of a Mimir-managed block at the end of a description. */
const MIMIR_BLOCK_PATTERN = /\n?_{10,}\nsearch tags:/;

export type WriteMode = "merge" | "append" | "replace";

export interface ParsedDescription {
  /** Text BEFORE the mimir block (trimmed). */
  userContent: string;
  /** The existing mimir block text (from separator onward, trimmed), or null if absent. */
  mimirBlock: string | null;
}

/**
 * Split an existing description into user-authored content and the Mimir-managed block.
 * Detects the new underscores-separator format.
 */
export function parseExistingDescription(text: string): ParsedDescription {
  const match = MIMIR_BLOCK_PATTERN.exec(text);
  if (!match) {
    return { userContent: text.trim(), mimirBlock: null };
  }
  const userContent = text.slice(0, match.index).trim();
  const mimirBlock = text.slice(match.index).trim();
  return { userContent, mimirBlock };
}

/**
 * Build the Mimir-managed block written into a component description.
 *
 * Example output:
 * ```
 * ______________
 * search tags: delete, trash, trash can, dustbin, remove, discard, bin
 * mimir 1.0.0 · added: 2026-04-16
 * ```
 */
export function formatMimirBlock(
  tags: string[],
  pluginVersion: string,
  date: string
): string {
  const tagLine = `search tags: ${tags.join(", ")}`;
  const metaLine = `mimir ${pluginVersion} · added: ${date}`;
  return [MIMIR_SEPARATOR, tagLine, metaLine].join("\n");
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
