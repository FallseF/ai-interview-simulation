import type { Speaker } from "../types/roles.js";

export interface TranscriptEntry {
  speaker: Speaker;
  name?: string;
  text: string;
  timestamp: Date;
}

export class TranscriptStore {
  private entries: TranscriptEntry[] = [];
  private pendingDeltas: Map<Speaker, string> = new Map();

  // Add a delta (partial transcript)
  addDelta(speaker: Speaker, delta: string): void {
    const current = this.pendingDeltas.get(speaker) || "";
    this.pendingDeltas.set(speaker, current + delta);
  }

  // Commit a completed transcript
  commit(speaker: Speaker, fullText: string): TranscriptEntry {
    // Clear any pending deltas for this speaker
    this.pendingDeltas.delete(speaker);

    const entry: TranscriptEntry = {
      speaker,
      text: fullText,
      timestamp: new Date(),
    };

    this.entries.push(entry);
    return entry;
  }

  // Get pending delta for a speaker
  getPendingDelta(speaker: Speaker): string {
    return this.pendingDeltas.get(speaker) || "";
  }

  // Get all committed entries
  getAll(): TranscriptEntry[] {
    return [...this.entries];
  }

  // Get entries by speaker
  getBySpeaker(speaker: Speaker): TranscriptEntry[] {
    return this.entries.filter((e) => e.speaker === speaker);
  }

  // Get last N entries
  getRecent(count: number): TranscriptEntry[] {
    return this.entries.slice(-count);
  }

  // Get last entry by a specific speaker
  getLastBySpeaker(speaker: Speaker): TranscriptEntry | null {
    const speakerEntries = this.getBySpeaker(speaker);
    return speakerEntries.length > 0 ? speakerEntries[speakerEntries.length - 1] : null;
  }

  // Get count of entries
  get count(): number {
    return this.entries.length;
  }

  // Get count by speaker
  getCountBySpeaker(speaker: Speaker): number {
    return this.entries.filter((e) => e.speaker === speaker).length;
  }

  // Clear all entries
  clear(): void {
    this.entries = [];
    this.pendingDeltas.clear();
  }

  // Export as formatted text
  toFormattedText(): string {
    return this.entries
      .map((e) => {
        const time = e.timestamp.toLocaleTimeString("ja-JP");
        return `[${time}] ${e.speaker}: ${e.text}`;
      })
      .join("\n");
  }

  // Export for context sharing between AIs
  toContextString(): string {
    return this.entries
      .map((e) => {
        const label = this.getSpeakerLabel(e.speaker);
        return `[${label}]: ${e.text}`;
      })
      .join("\n");
  }

  private getSpeakerLabel(speaker: Speaker): string {
    switch (speaker) {
      case "interviewer":
        return "面接官";
      case "candidate":
        return "求職者";
      case "human":
        return "転職支援";
      default:
        return speaker;
    }
  }
}
