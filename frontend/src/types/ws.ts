// Participant roles in the interview
export type Speaker = "interviewer" | "candidate" | "human";

// Role (participant role)
export type Role = "interviewer" | "candidate" | "human";

// Interview patterns
export type InterviewPattern = "pattern1" | "pattern2" | "pattern3";

// Japanese language proficiency levels (JLPT)
export type JapaneseLevel = "N5" | "N4" | "N3" | "N2" | "N1";

// Target for human input
export type Target = "interviewer" | "candidate" | "both";

// Interview mode
export type InterviewMode = "step" | "auto";

// Client → Server Messages
export type ClientMessage =
  | { type: "start_session"; mode: InterviewMode; pattern: InterviewPattern; japaneseLevel?: JapaneseLevel }
  | { type: "set_mode"; mode: InterviewMode }
  | { type: "next_turn" }

  // Human input
  | { type: "human_text"; target: Target; text: string }
  | { type: "human_audio_chunk"; target: Target; audioBase64: string }
  | { type: "human_audio_commit"; target: Target }

  | { type: "end_session" }

  // Legacy support
  | { type: "start_interview" }
  | { type: "audio"; data: string }
  | { type: "audio_playback_done" }
  | { type: "proceed_to_next" }
  | { type: "user_will_speak" }
  | { type: "user_done_speaking" };

// Server → Client Messages
export type ServerMessage =
  | { type: "session_ready"; pattern: InterviewPattern; japaneseLevel?: JapaneseLevel; participants: Role[] }
  | { type: "pattern_info"; pattern: InterviewPattern; description: string; participants: Role[] }
  | { type: "turn_state"; currentSpeaker: Speaker | null; waitingForNext: boolean; phase?: string; mode?: InterviewMode }

  // Transcript events
  | { type: "transcript_delta"; speaker: Speaker; textDelta: string }
  | { type: "transcript_done"; speaker: Speaker; text: string }

  // Audio events
  | { type: "audio_delta"; speaker: Speaker; audioBase64: string }
  | { type: "audio_done"; speaker: Speaker }

  // Evaluation result (after interview ends)
  | { type: "evaluation_result"; result: EvaluationResult }

  // Error
  | { type: "error"; message: string }

  // Legacy support
  | { type: "phase_change"; phase: string; speaker?: string; reason?: string }
  | { type: "transcript"; source: string; name: string; text: string }
  | { type: "audio"; source: string; data: string }
  | { type: "waiting_for_sessions" }
  | { type: "sessions_ready" };

// Evaluation result structure
export interface EvaluationResult {
  passed: boolean;
  grade: string;
  gradeEmoji: string;
  gradeMessage: string;
  score: {
    total: number;
    max: number;
    percentage: number;
  };
  summary: string;
  categories: Array<{
    name: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
  strengths: string[];
  improvements: string[];
  actionItems: string[];
  criticalIssues: Array<{
    description: string;
    feedback: string;
  }>;
  missingItems: Array<{
    name: string;
    feedback: string;
  }>;
  duration: number;
  evaluatedAt: string;
}

// Transcript entry for display
export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  name: string;
  text: string;
  timestamp: Date;
}

// Interview state
export interface InterviewState {
  phase: "waiting" | "interviewer" | "candidate" | "user_choice" | "user_speaking" | "ended";
  currentSpeaker: Speaker | null;
  waitingForNext: boolean;
  mode: InterviewMode;
  endReason?: "normal" | "aborted";
}
