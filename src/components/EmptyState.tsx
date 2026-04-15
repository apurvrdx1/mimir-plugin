import { h } from "preact";

type EmptyStateVariant = "no-selection" | "no-supported" | "no-matches" | "scanning" | "done";

interface EmptyStateProps {
  variant: EmptyStateVariant;
}

const CONTENT: Record<EmptyStateVariant, { icon: string; title: string; body: string }> = {
  "no-selection": {
    icon: "◻",
    title: "No selection",
    body: "Select icon components or component sets in Figma, then click Scan Selection.",
  },
  "no-supported": {
    icon: "⚠",
    title: "No supported nodes",
    body: "Selection contains no ComponentNode or ComponentSetNode types.",
  },
  "no-matches": {
    icon: "○",
    title: "No matches found",
    body: "None of the selected icons matched the Icon Thesaurus. Try enabling low-confidence matches.",
  },
  "scanning": {
    icon: "◌",
    title: "Scanning…",
    body: "Reading selection from Figma.",
  },
  "done": {
    icon: "✓",
    title: "Done",
    body: "Descriptions written successfully.",
  },
};

export function EmptyState({ variant }: EmptyStateProps) {
  const { icon, title, body } = CONTENT[variant];
  return (
    <div class="empty">
      <div class="empty__icon">{icon}</div>
      <div class="empty__title">{title}</div>
      <div class="empty__body">{body}</div>
    </div>
  );
}
