// ============================================================
// Core Types
// ============================================================

// Participant roles in the interview
export type Role = "interviewer" | "candidate" | "human";

// Speaker types (for audio/transcript events)
export type Speaker = "interviewer" | "candidate" | "human";

// Target for human input
export type Target = "interviewer" | "candidate" | "both";

// Interview mode
export type InterviewMode = "step" | "auto";

// Interview phase
export type Phase =
  | "waiting"       // Initial state, waiting to start
  | "interviewer"   // AI interviewer is speaking
  | "candidate"     // AI candidate is speaking
  | "user_choice"   // Waiting for human to choose action (step mode)
  | "user_speaking" // Human is speaking
  | "ended";        // Interview ended

// Interview end reason
export type EndReason = "normal" | "aborted" | null;

// ============================================================
// AI Configuration
// ============================================================

// AI persona configuration
export interface AIPersonaConfig {
  role: "interviewer" | "candidate";
  name: string;
  voice: string;
  instructions: string;
}

// ============================================================
// Conversation Types (for Chat API)
// ============================================================

// OpenAI Chat API message format
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Conversation history entry
export interface ConversationEntry {
  speaker: Speaker;
  text: string;
  timestamp: Date;
}

// ============================================================
// Interview State
// ============================================================

export interface TurnState {
  phase: Phase;
  currentSpeaker: Speaker | null;
  waitingForNext: boolean;
  turnCount: number;
  interviewerTurns: number;
  candidateTurns: number;
  lastAISpeaker: "interviewer" | "candidate" | null;
}

export interface InterviewState {
  phase: Phase;
  currentSpeaker: Speaker | null;
  waitingForNext: boolean;
  mode: InterviewMode;
  endReason?: EndReason;
}

// ============================================================
// Transcript Types
// ============================================================

export interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  name: string;
  text: string;
  timestamp: Date;
}

// ============================================================
// API Request/Response Types
// ============================================================

// Chat API
export interface ChatRequest {
  role: "interviewer" | "candidate";
  messages: ChatMessage[];
  humanInput?: {
    target: Target;
    text: string;
  };
}

export interface ChatResponse {
  text: string;
  shouldEnd: boolean;
  endReason?: EndReason;
}

// TTS API
export interface TTSRequest {
  text: string;
  voice: string;
}

export interface TTSResponse {
  audioBase64: string;
}

// ============================================================
// Interview Configuration
// ============================================================

export interface InterviewConfig {
  MIN_TURNS: number;
  MAX_TURNS: number;
  END_MARKER: string;
  ABORT_MARKER: string;
}

export const INTERVIEW_CONFIG: InterviewConfig = {
  MIN_TURNS: 5,
  MAX_TURNS: 15,
  END_MARKER: "【面接終了】",
  ABORT_MARKER: "【面接中止】",
};

// ============================================================
// Provider Interfaces (for abstraction)
// ============================================================

export interface ChatProvider {
  chat(messages: ChatMessage[], systemPrompt: string): Promise<string>;
}

export interface TTSProvider {
  synthesize(text: string, voice: string): Promise<ArrayBuffer>;
}

// ============================================================
// Evaluation Types
// ============================================================

// 評価項目
export interface EvaluationCriteria {
  communication: number;    // コミュニケーション対応力 (1-5)
  manner: number;           // マナー・態度 (1-5)
  support: number;          // サポート力 (1-5)
  judgment: number;         // 状況判断 (1-5)
}

// 評価結果
export interface EvaluationResult {
  criteria: EvaluationCriteria;
  totalScore: number;       // 合計点 (0-100)
  feedback: string;         // LLMからのフィードバック
  strengths: string[];      // 良かった点
  improvements: string[];   // 改善点
}

// 保存する面接記録
export interface InterviewRecord {
  id: string;
  createdAt: string;        // ISO string
  transcript: TranscriptEntry[];
  endReason: EndReason;
  evaluation: EvaluationResult | null;
}

// 評価APIリクエスト
export interface EvaluateRequest {
  transcript: TranscriptEntry[];
  endReason: EndReason;
}

// 評価APIレスポンス
export interface EvaluateResponse {
  evaluation: EvaluationResult;
}
