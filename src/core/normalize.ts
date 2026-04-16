export interface NormalizeResult {
  normalized: string;
  steps: string[];
}

export const GENERIC_TOKENS = ["icon", "icons", "ic", "glyph", "symbol"];

export const NAMESPACE_PATTERNS = [
  "sap-icon://",
  "icon/core/",
  "icons/",
  "icon/",
  "ui:",
  "workflow:",
];

export const CATEGORY_TOKENS = [
  "action", "custom", "doctype", "standard", "utility", "core", "ui", "workflow", "system",
];

export const STYLE_SUFFIXES = [
  "regular", "filled", "outlined", "twotone", "rounded", "sharp",
  "fill", "outline", "thin", "light", "bold", "duotone", "solid",
];

export const SIZE_SUFFIXES = ["16", "20", "24", "32", "48"];

// Sort namespace patterns longest-first to avoid prefix collision
const SORTED_NAMESPACE_PATTERNS = [...NAMESPACE_PATTERNS].sort(
  (a, b) => b.length - a.length
);

export function normalizeName(raw: string): NormalizeResult {
  const steps: string[] = [];

  // Step 1: lowercase — always fires
  let current = raw.trim().toLowerCase();
  steps.push("lowercase");

  // Step 2: namespace-strip
  {
    let stripped = current;
    for (const pattern of SORTED_NAMESPACE_PATTERNS) {
      if (stripped.startsWith(pattern)) {
        stripped = stripped.slice(pattern.length);
        break;
      }
    }
    if (stripped !== current) {
      steps.push("namespace-strip");
      current = stripped;
    }
  }

  // Step 3: separator-normalize — replace [/._\s]+ with -
  {
    const next = current.replace(/[/._\s]+/g, "-");
    if (next !== current) {
      steps.push("separator-normalize");
      current = next;
    }
  }

  // Step 4: separator-collapse — replace --+ with - and trim leading/trailing -
  {
    const next = current.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
    if (next !== current) {
      steps.push("separator-collapse");
      current = next;
    }
  }

  // Step 5: variant-wrapper-strip — remove trailing style suffix segment
  {
    const parts = current.split("-");
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      if (STYLE_SUFFIXES.includes(last)) {
        const next = parts.slice(0, -1).join("-");
        steps.push("variant-wrapper-strip");
        current = next;
      }
    }
  }

  // Step 6: category-strip — remove first segment if it's a category token
  {
    const parts = current.split("-");
    if (parts.length > 1 && CATEGORY_TOKENS.includes(parts[0])) {
      const next = parts.slice(1).join("-");
      steps.push("category-strip");
      current = next;
    }
  }

  // Step 7: generic-prefix-strip — remove first segment if it's a generic token (only if remaining > 0)
  {
    const parts = current.split("-");
    if (parts.length > 1 && GENERIC_TOKENS.includes(parts[0])) {
      const next = parts.slice(1).join("-");
      steps.push("generic-prefix-strip");
      current = next;
    }
  }

  // Step 8: style-suffix-strip — catch any remaining trailing style suffix
  {
    const parts = current.split("-");
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      if (STYLE_SUFFIXES.includes(last)) {
        const next = parts.slice(0, -1).join("-");
        steps.push("style-suffix-strip");
        current = next;
      }
    }
  }

  // Step 9: size-suffix-strip — remove trailing size segment
  {
    const parts = current.split("-");
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      if (SIZE_SUFFIXES.includes(last)) {
        const next = parts.slice(0, -1).join("-");
        steps.push("size-suffix-strip");
        current = next;
      }
    }
  }

  // Step 9b: style-suffix-strip after size strip — catches patterns like "filled-24"
  // where style suffix was hidden behind a size suffix
  {
    const parts = current.split("-");
    if (parts.length > 1) {
      const last = parts[parts.length - 1];
      if (STYLE_SUFFIXES.includes(last)) {
        const next = parts.slice(0, -1).join("-");
        steps.push("style-suffix-strip");
        current = next;
      }
    }
  }

  // Step 10: separator-collapse again
  {
    const next = current.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
    if (next !== current) {
      steps.push("separator-collapse");
      current = next;
    }
  }

  // Step 11: strip-aborted-empty — if result is empty, return original lowercased input
  if (current === "") {
    current = raw.trim().toLowerCase();
    steps.push("strip-aborted-empty");
  }

  return { normalized: current, steps };
}
