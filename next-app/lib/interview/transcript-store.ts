import type { Speaker, TranscriptEntry } from "@/types";

// Generate unique ID for entries
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class TranscriptStore {
  private entries: TranscriptEntry[] = [];

  // Add a new entry
  add(speaker: Speaker, text: string): TranscriptEntry {
    const entry: TranscriptEntry = {
      id: generateId(),
      speaker,
      name: this.getSpeakerName(speaker),
      text,
      timestamp: new Date(),
    };

    this.entries.push(entry);
    return entry;
  }

  // Get all entries
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

  // Export for context sharing between AIs (for Chat API)
  toContextString(): string {
    return this.entries
      .map((e) => {
        const label = this.getSpeakerLabel(e.speaker);
        return `[${label}]: ${e.text}`;
      })
      .join("\n");
  }

  // Get speaker display name
  private getSpeakerName(speaker: Speaker): string {
    switch (speaker) {
      case "interviewer":
        return "田中部長";
      case "candidate":
        return "グエン・ミン";
      case "human":
        return "転職支援";
      default:
        return speaker;
    }
  }

  // Get speaker label for context
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

  // Serialize entries for storage
  serialize(): TranscriptEntry[] {
    return this.entries.map((e) => ({
      ...e,
      timestamp: e.timestamp,
    }));
  }

  // Restore entries from storage
  restore(entries: TranscriptEntry[]): void {
    this.entries = entries.map((e) => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));
  }

  // Set entries directly (for client-side state management)
  setEntries(entries: TranscriptEntry[]): void {
    this.entries = entries;
  }
}
