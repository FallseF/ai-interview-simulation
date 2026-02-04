import type { ChatMessage, TranscriptEntry, Speaker } from "@/types";

/**
 * Convert transcript entries to Chat API messages
 * Handles the AI-AI conversation context properly
 */
export function transcriptToChatMessages(
  transcripts: TranscriptEntry[],
  targetRole: "interviewer" | "candidate"
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  for (const entry of transcripts) {
    if (entry.speaker === targetRole) {
      // This AI's own previous messages
      messages.push({
        role: "assistant",
        content: entry.text,
      });
    } else {
      // Other speakers' messages - treat as user input
      const label = getSpeakerLabel(entry.speaker);
      messages.push({
        role: "user",
        content: `[${label}]: ${entry.text}`,
      });
    }
  }

  return messages;
}

/**
 * Get speaker label for context
 */
function getSpeakerLabel(speaker: Speaker): string {
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

/**
 * Build context messages for interviewer
 * Interviewer sees: their own messages as assistant, candidate as user
 * Human messages are excluded here (passed separately as system message)
 */
export function buildInterviewerMessages(transcripts: TranscriptEntry[]): ChatMessage[] {
  // Filter out human messages (they're passed separately as system message)
  const filtered = transcripts.filter((t) => t.speaker !== "human");
  return transcriptToChatMessages(filtered, "interviewer");
}

/**
 * Build context messages for candidate
 * Candidate sees: their own messages as assistant, interviewer/human as user
 */
export function buildCandidateMessages(transcripts: TranscriptEntry[]): ChatMessage[] {
  return transcriptToChatMessages(transcripts, "candidate");
}

/**
 * Get the appropriate voice for a speaker
 */
export function getSpeakerVoice(speaker: "interviewer" | "candidate"): string {
  return speaker === "interviewer" ? "cedar" : "shimmer";
}

/**
 * Get display name for a speaker
 */
export function getSpeakerDisplayName(speaker: Speaker): string {
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
