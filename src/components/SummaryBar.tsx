import { h } from "preact";

interface SummaryBarProps {
  total: number;
  matched: number;
  unmatched: number;
  skipped: number;
}

export function SummaryBar({ total, matched, unmatched, skipped }: SummaryBarProps) {
  if (total === 0) return null;
  return (
    <div class="summary">
      <span class="summary__item">
        <span class="summary__count">{total}</span>
        <span class="summary__label">selected</span>
      </span>
      <span class="summary__item">
        <span class="summary__count">{matched}</span>
        <span class="summary__label">matched</span>
      </span>
      {unmatched > 0 && (
        <span class="summary__item">
          <span class="summary__count">{unmatched}</span>
          <span class="summary__label">unmatched</span>
        </span>
      )}
      {skipped > 0 && (
        <span class="summary__item">
          <span class="summary__count">{skipped}</span>
          <span class="summary__label">skipped</span>
        </span>
      )}
    </div>
  );
}
