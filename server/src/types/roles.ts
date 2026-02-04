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
  | "waiting"           // Initial state, waiting to start
  | "interviewer"       // AI interviewer is speaking
  | "candidate"         // AI candidate is speaking
  | "user_choice"       // Waiting for human to choose action (step mode)
  | "user_speaking"     // Human is speaking
  | "ended";            // Interview ended

// Interview end reason
export type EndReason = "normal" | "aborted" | null;

// AI persona configuration
export interface AIPersonaConfig {
  role: "interviewer" | "candidate";
  name: string;
  voice: string;
  instructions: string;
}

// Interview patterns for different scenarios
// pattern1: 営業担当(人間) vs 外国人学生(AI) - 出席確認・自己紹介練習
// pattern2: 営業担当(人間) vs 外国人学生(AI) vs 面接官(AI) - 面接本番（営業主導）
// pattern3: 営業担当(人間) vs 面接官(AI) - 学生退席後のヒアリング・クロージング
export type InterviewPattern = "pattern1" | "pattern2" | "pattern3";

// Japanese language proficiency level (JLPT standard)
// N5: 初級（ほぼ片言）
// N4: 初中級（現状の外国人候補者レベル）
// N3: 中級（日常会話OK）
// N2: 中上級（ビジネス会話可能）
// N1: 上級（ネイティブに近い）
export type JapaneseLevel = "N5" | "N4" | "N3" | "N2" | "N1";

// Pattern configuration
export interface PatternConfig {
  pattern: InterviewPattern;
  japaneseLevel?: JapaneseLevel; // Used in pattern1 and pattern2 only
  participants: Role[];
}
