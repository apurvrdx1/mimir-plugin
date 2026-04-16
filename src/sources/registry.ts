import type { SemanticSourceAdapter } from "./types";

export class SourceRegistry {
  private readonly adapters: Map<string, SemanticSourceAdapter> = new Map();

  register(adapter: SemanticSourceAdapter): void {
    this.adapters.set(adapter.sourceId, adapter);
  }

  get(sourceId: string): SemanticSourceAdapter | undefined {
    return this.adapters.get(sourceId);
  }

  getAll(): SemanticSourceAdapter[] {
    return Array.from(this.adapters.values());
  }
}
