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

// === ペルソナ設定 ===

// 性別
export type Gender = "male" | "female";

// 業種
export type Industry =
  | "manufacturing"   // 製造業
  | "nursing"         // 介護
  | "restaurant"      // 飲食
  | "retail"          // 小売
  | "logistics"       // 物流
  | "construction"    // 建設
  | "it"              // IT
  | "other";          // その他

// 面接官の性格
export type InterviewerPersonality =
  | "detailed"        // 細かい
  | "casual"          // ガサツ
  | "inquisitive"     // 質問が多い
  | "friendly"        // フレンドリー
  | "strict";         // 厳格

// 外国人雇用に関する理解度
export type ForeignHiringLiteracy = "high" | "low";

// 方言
export type Dialect = "standard" | "kansai" | "kyushu" | "tohoku";

// 難易度モード
export type DifficultyMode = "beginner" | "hard";

// 面接官ペルソナ設定
export interface InterviewerPersona {
  gender: Gender;
  industry: Industry;
  personality: InterviewerPersonality;
  foreignHiringLiteracy: ForeignHiringLiteracy;
  dialect: Dialect;
  difficulty: DifficultyMode;
  customName?: string;
}

// 外国人候補者ペルソナ設定
export interface CandidatePersona {
  japaneseLevel: JapaneseLevel;
  nationality?: string;
  workExperience?: boolean;
  customName?: string;
}

// 統合ペルソナ設定
export interface PersonaConfig {
  interviewer?: InterviewerPersona;
  candidate?: CandidatePersona;
}

// Client → Server Messages
export type ClientMessage =
  | { type: "start_session"; mode: InterviewMode; pattern: InterviewPattern; japaneseLevel?: JapaneseLevel; persona?: PersonaConfig }
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

// ============================================================
// History / Database API Types
// ============================================================

export interface SessionSummary {
  id: string;
  pattern: InterviewPattern;
  japaneseLevel?: JapaneseLevel;
  mode: InterviewMode;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  endReason?: "normal" | "aborted" | null;
  persona?: PersonaConfig;
}

export interface TranscriptRecord {
  sessionId?: string;
  speaker: Speaker | string;
  text: string;
  timestamp: string;
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

// UI Phase for page transitions
export type UIPhase = "setup" | "interview" | "result";

// Helper function to map WebSocket phase to UI phase
export function getUIPhase(wsPhase: InterviewState["phase"]): UIPhase {
  if (wsPhase === "waiting") return "setup";
  if (wsPhase === "ended") return "result";
  return "interview";
}
