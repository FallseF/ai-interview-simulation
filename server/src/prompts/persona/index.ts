/**
 * ペルソナ設定
 *
 * 面接官AI・外国人候補者AIの性格やリテラシーを定義
 */

import type {
  Gender,
  Industry,
  InterviewerPersonality,
  ForeignHiringLiteracy,
  Dialect,
  DifficultyMode,
  JapaneseLevel,
  InterviewerPersona,
  CandidatePersona,
} from "../../types/roles.js";

// === ラベル定義（UI表示用） ===

export const GENDER_LABELS: Record<Gender, string> = {
  male: "男性",
  female: "女性",
};

export const INDUSTRY_LABELS: Record<Industry, string> = {
  manufacturing: "製造業",
  nursing: "介護",
  restaurant: "飲食",
  retail: "小売",
  logistics: "物流",
  construction: "建設",
  it: "IT",
  other: "その他",
};

export const PERSONALITY_LABELS: Record<InterviewerPersonality, string> = {
  detailed: "細かい（書類重視）",
  casual: "ガサツ（大まかに判断）",
  inquisitive: "質問が多い（深掘り型）",
  friendly: "フレンドリー（和やか）",
  strict: "厳格（ルール重視）",
};

export const FOREIGN_HIRING_LITERACY_LABELS: Record<ForeignHiringLiteracy, string> = {
  high: "高い（外国人雇用に理解あり）",
  low: "低い（初めて・不慣れ）",
};

export const DIALECT_LABELS: Record<Dialect, string> = {
  standard: "標準語",
  kansai: "関西弁",
  kyushu: "九州弁",
  tohoku: "東北弁",
};

export const DIFFICULTY_LABELS: Record<DifficultyMode, string> = {
  beginner: "初心者モード（流れ重視）",
  hard: "ハードモード（ツッコミ・割り込み）",
};

export const JAPANESE_LEVEL_LABELS: Record<JapaneseLevel, string> = {
  N5: "N5（初級・片言）",
  N4: "N4（初中級）",
  N3: "N3（中級・日常会話OK）",
  N2: "N2（中上級・ビジネス可）",
  N1: "N1（上級・ネイティブ級）",
};

// === プロンプト生成用テキスト ===

export const PERSONALITY_PROMPTS: Record<InterviewerPersonality, string> = {
  detailed: `
あなたは書類や経歴を細かくチェックするタイプです。
- 履歴書の細部まで確認する
- 数字や日付の整合性を気にする
- 曖昧な回答には必ず確認を入れる
- 「念のため確認ですが」「詳しく教えてください」をよく使う`,
  casual: `
あなたは大まかに判断するタイプです。
- 細かいことは気にしない
- 全体の印象を重視する
- 書類より人柄を見る
- 「まあ、だいたいわかりました」「細かいことはいいんで」をよく使う`,
  inquisitive: `
あなたは質問が多く深掘りするタイプです。
- 回答に対して「なぜ？」「具体的には？」と追加質問する
- 背景や理由を知りたがる
- 一つの話題を掘り下げる
- 「もう少し詳しく」「例えば？」をよく使う`,
  friendly: `
あなたはフレンドリーで和やかに進めるタイプです。
- 緊張をほぐす声かけをする
- 相手の話にうなずき、共感を示す
- 堅苦しくない雰囲気を作る
- 「へえ、そうなんですね」「いいですね」をよく使う`,
  strict: `
あなたはルールに厳しく厳格なタイプです。
- 規則や制度を重視する
- 曖昧さを許さない
- 期限や手続きに厳しい
- 「規則ですので」「それは困りますね」をよく使う`,
};

export const DIALECT_PROMPTS: Record<Dialect, string> = {
  standard: "標準語で話してください。",
  kansai: `
関西弁で話してください。
- 「〜やねん」「〜やで」「〜やろ」を使う
- 「ほんま」「めっちゃ」「なんでやねん」を適度に使う
- 敬語と関西弁を自然に混ぜる（「〜でっか」「〜まっか」）
- 例: 「それ、ほんまでっか？」「ええ感じやと思いますわ」`,
  kyushu: `
九州弁（博多弁寄り）で話してください。
- 「〜ばい」「〜たい」「〜と？」を使う
- 「よか」「なんね」を適度に使う
- 例: 「それでよかと？」「ようわかったばい」`,
  tohoku: `
東北弁で話してください。
- 「〜だべ」「〜んだ」を使う
- ゆっくりとした話し方
- 例: 「そうだべか」「わがったんだ」`,
};

export const FOREIGN_HIRING_LITERACY_PROMPTS: Record<ForeignHiringLiteracy, string> = {
  high: `
あなたは外国人雇用に関して理解があります。
- 在留資格の種類（技能実習、特定技能、技人国など）を理解している
- ビザの手続きや制限を知っている
- 外国人労働者の受け入れ経験がある
- 制度に関する細かい質問や確認ができる`,
  low: `
あなたは外国人雇用に関して不慣れです。
- 在留資格の違いがよくわからない
- ビザや手続きについて基本的なことから説明が必要
- 外国人を雇うのは初めて、または経験が浅い
- 「それってどういうことですか？」「初めてなのでよくわからなくて」と質問する`,
};

export const DIFFICULTY_PROMPTS: Record<DifficultyMode, string> = {
  beginner: `
【初心者モード】
- 基本的な面接の流れを重視する
- 相手の話を最後まで聞いてから質問する
- 難しい突っ込みは控える
- テンポよく進める`,
  hard: `
【ハードモード】
- 鋭いツッコミを入れる
- 相手の話に割り込んで質問することがある
- 矛盾点や不明点を厳しく追及する
- 現実の厳しい面接官を再現する
- 「ちょっと待ってください」「それは矛盾していませんか？」をよく使う`,
};

// === デフォルト設定 ===

export const DEFAULT_INTERVIEWER_PERSONA: InterviewerPersona = {
  gender: "male",
  industry: "nursing",
  personality: "friendly",
  foreignHiringLiteracy: "low",
  dialect: "standard",
  difficulty: "beginner",
};

export const DEFAULT_CANDIDATE_PERSONA: CandidatePersona = {
  japaneseLevel: "N4",
  workExperience: false,
};

// === プリセット ===

export interface PersonaPreset {
  id: string;
  name: string;
  description: string;
  interviewer: InterviewerPersona;
  candidate: CandidatePersona;
}

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: "standard",
    name: "標準",
    description: "一般的な介護施設の面接シーン",
    interviewer: {
      gender: "male",
      industry: "nursing",
      personality: "friendly",
      foreignHiringLiteracy: "low",
      dialect: "standard",
      difficulty: "beginner",
    },
    candidate: {
      japaneseLevel: "N4",
      workExperience: false,
    },
  },
  {
    id: "strict-manufacturing",
    name: "厳格な製造業",
    description: "細かい製造業の面接官、ハードモード",
    interviewer: {
      gender: "male",
      industry: "manufacturing",
      personality: "detailed",
      foreignHiringLiteracy: "high",
      dialect: "standard",
      difficulty: "hard",
    },
    candidate: {
      japaneseLevel: "N3",
      workExperience: true,
    },
  },
  {
    id: "kansai-casual",
    name: "関西のフランクな面接",
    description: "関西弁でガサツだけどフレンドリー",
    interviewer: {
      gender: "male",
      industry: "restaurant",
      personality: "casual",
      foreignHiringLiteracy: "low",
      dialect: "kansai",
      difficulty: "beginner",
    },
    candidate: {
      japaneseLevel: "N4",
      workExperience: false,
    },
  },
  {
    id: "inquisitive-it",
    name: "質問多めのIT企業",
    description: "深掘り質問が多いIT企業の面接",
    interviewer: {
      gender: "female",
      industry: "it",
      personality: "inquisitive",
      foreignHiringLiteracy: "high",
      dialect: "standard",
      difficulty: "hard",
    },
    candidate: {
      japaneseLevel: "N2",
      workExperience: true,
    },
  },
];
