import type { Target, Speaker, InterviewMode, InterviewPattern, JapaneseLevel, Role, PersonaConfig } from "./roles.js";

// ============================================================
// Client → Server Messages
// ============================================================
export type ClientMessage =
  | { type: "start_session"; mode: InterviewMode; pattern: InterviewPattern; japaneseLevel?: JapaneseLevel; persona?: PersonaConfig }
  | { type: "set_mode"; mode: InterviewMode }
  | { type: "next_turn" }  // step mode: trigger next AI speaker

  // Human (career support) input
  | { type: "human_text"; target: Target; text: string }
  | { type: "human_audio_chunk"; target: Target; audioBase64: string }
  | { type: "human_audio_commit"; target: Target }

  | { type: "end_session" }

  // Legacy support (backward compatibility)
  | { type: "start_interview" }
  | { type: "audio"; data: string }
  | { type: "audio_playback_done" }
  | { type: "proceed_to_next" }
  | { type: "user_will_speak" }
  | { type: "user_done_speaking" };

// ============================================================
// Server → Client Messages
// ============================================================
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
  | { type: "evaluation_result"; result: EvaluationResultMessage }

  // Error handling
  | { type: "error"; message: string }

  // Legacy support (backward compatibility)
  | { type: "phase_change"; phase: string; speaker?: string; reason?: string }
  | { type: "transcript"; source: string; name: string; text: string }
  | { type: "audio"; source: string; data: string }
  | { type: "waiting_for_sessions" }
  | { type: "sessions_ready" };

// Evaluation result message structure
export interface EvaluationResultMessage {
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
// OpenAI Realtime API Events (subset we care about)
// ============================================================
export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export interface SessionCreatedEvent extends RealtimeEvent {
  type: "session.created";
  session: {
    id: string;
  };
}

export interface SessionUpdatedEvent extends RealtimeEvent {
  type: "session.updated";
}

export interface AudioDeltaEvent extends RealtimeEvent {
  type: "response.audio.delta";
  delta: string;
  item_id: string;
  response_id: string;
}

export interface AudioDoneEvent extends RealtimeEvent {
  type: "response.audio.done";
}

export interface TranscriptDeltaEvent extends RealtimeEvent {
  type: "response.audio_transcript.delta";
  delta: string;
}

export interface TranscriptDoneEvent extends RealtimeEvent {
  type: "response.audio_transcript.done";
  transcript: string;
}

export interface ResponseDoneEvent extends RealtimeEvent {
  type: "response.done";
  response: {
    status: string;
    status_details?: {
      error?: {
        message: string;
        code: string;
      };
    };
  };
}

export interface ErrorEvent extends RealtimeEvent {
  type: "error";
  error: {
    message: string;
    code: string;
  };
}

// Input audio transcription events
export interface InputAudioTranscriptionDeltaEvent extends RealtimeEvent {
  type: "conversation.item.input_audio_transcription.delta";
  delta: string;
}

export interface InputAudioTranscriptionCompletedEvent extends RealtimeEvent {
  type: "conversation.item.input_audio_transcription.completed";
  transcript: string;
}
