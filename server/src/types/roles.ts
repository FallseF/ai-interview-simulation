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
  | "detailed"        // 細かい（書類や経歴を細かくチェック）
  | "casual"          // ガサツ（大まかに判断）
  | "inquisitive"     // 質問が多い（深掘りする）
  | "friendly"        // フレンドリー（和やかに進める）
  | "strict";         // 厳格（ルールに厳しい）

// 外国人雇用に関する理解度（面接官）
export type ForeignHiringLiteracy = "high" | "low";

// 方言
export type Dialect =
  | "standard"        // 標準語
  | "kansai"          // 関西弁
  | "kyushu"          // 九州弁
  | "tohoku";         // 東北弁

// 難易度モード
export type DifficultyMode =
  | "beginner"        // 初心者モード（流れ重視）
  | "hard";           // ハードモード（ツッコミ・割り込み重視）

// 面接官ペルソナ設定
export interface InterviewerPersona {
  gender: Gender;
  industry: Industry;
  personality: InterviewerPersonality;
  foreignHiringLiteracy: ForeignHiringLiteracy;
  dialect: Dialect;
  difficulty: DifficultyMode;
  customName?: string;  // カスタム名（オプション）
}

// 外国人候補者ペルソナ設定
export interface CandidatePersona {
  japaneseLevel: JapaneseLevel;
  nationality?: string;       // 国籍（オプション）
  workExperience?: boolean;   // 日本での就労経験
  customName?: string;        // カスタム名（オプション）
}

// 統合ペルソナ設定
export interface PersonaConfig {
  interviewer?: InterviewerPersona;
  candidate?: CandidatePersona;
}

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
