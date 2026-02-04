import type { AIPersonaConfig, InterviewerPersona } from "../types/roles.js";
import { getScenarioContext, type Scenario, DEFAULT_SCENARIO } from "./scenario.js";
import {
  PERSONALITY_PROMPTS,
  DIALECT_PROMPTS,
  FOREIGN_HIRING_LITERACY_PROMPTS,
  DIFFICULTY_PROMPTS,
  INDUSTRY_LABELS,
  GENDER_LABELS,
  DEFAULT_INTERVIEWER_PERSONA,
} from "./persona/index.js";

/**
 * ペルソナ設定からプロンプトセクションを生成
 */
function buildPersonaSection(persona: InterviewerPersona): string {
  const sections: string[] = [];

  // 基本属性
  const genderText = GENDER_LABELS[persona.gender];
  const industryText = INDUSTRY_LABELS[persona.industry];
  sections.push(`## あなたのキャラクター設定
- 性別: ${genderText}
- 業種: ${industryText}の採用担当者`);

  // 性格
  sections.push(`## 性格・行動特性
${PERSONALITY_PROMPTS[persona.personality]}`);

  // 外国人雇用リテラシー
  sections.push(`## 外国人雇用に関する理解度
${FOREIGN_HIRING_LITERACY_PROMPTS[persona.foreignHiringLiteracy]}`);

  // 方言
  sections.push(`## 話し方・方言
${DIALECT_PROMPTS[persona.dialect]}`);

  // 難易度モード
  sections.push(`## 面接モード
${DIFFICULTY_PROMPTS[persona.difficulty]}`);

  return sections.join("\n\n");
}

/**
 * 業種別の面接トピックを生成
 */
function getIndustryTopics(industry: string): string {
  const commonTopics = `1) 職務経験（期間、業務内容）
2) 志望動機（なぜこの業種/なぜ日本）
3) 勤務条件（シフト、残業、休日）
4) 体力・健康面
5) 日本語/コミュニケーション（報連相、対応）
6) チームワーク（同僚との連携）
7) 在留資格・開始可能時期
8) 逆質問（候補者から質問あるか）`;

  const industrySpecific: Record<string, string> = {
    nursing: `1) 介護経験（期間、業務内容、夜勤経験）
2) 志望動機（なぜ介護/なぜ日本）
3) 勤務条件（シフト、夜勤可否、残業、休日）
4) 体力・健康面（腰痛、持病）
5) 日本語/コミュニケーション（報連相、利用者対応）
6) チームワーク（同僚との連携、トラブル時の対応）
7) 在留資格・開始可能時期
8) 逆質問（候補者から質問あるか）`,
    manufacturing: `1) 製造業経験（期間、担当工程、機械操作）
2) 志望動機（なぜ製造業/なぜ日本）
3) 勤務条件（シフト、交替制、残業、休日）
4) 体力・健康面（立ち仕事、重量物）
5) 日本語/コミュニケーション（指示理解、報告）
6) 安全意識（ルール遵守、事故防止）
7) 在留資格・開始可能時期
8) 逆質問（候補者から質問あるか）`,
    restaurant: `1) 飲食業経験（期間、ポジション、調理/接客）
2) 志望動機（なぜ飲食/なぜ日本）
3) 勤務条件（シフト、土日祝、繁忙期）
4) 体力・健康面（立ち仕事、スピード）
5) 日本語/コミュニケーション（接客対応、注文）
6) 衛生管理（食品衛生、清掃）
7) 在留資格・開始可能時期
8) 逆質問（候補者から質問あるか）`,
  };

  return industrySpecific[industry] || commonTopics;
}

/**
 * 面接官AIの設定を生成
 */
export function createInterviewerConfig(
  scenario: Scenario = DEFAULT_SCENARIO,
  persona: InterviewerPersona = DEFAULT_INTERVIEWER_PERSONA
): AIPersonaConfig {
  const scenarioContext = getScenarioContext(scenario);
  const personaSection = buildPersonaSection(persona);
  const industryTopics = getIndustryTopics(persona.industry);
  const industryText = INDUSTRY_LABELS[persona.industry];

  // 名前の決定（カスタム名があればそれを使用）
  const name = persona.customName || (persona.gender === "male" ? "田中部長" : "鈴木課長");

  // 声の選択（性別に応じて）
  const voice = persona.gender === "male" ? "cedar" : "maple";

  return {
    role: "interviewer",
    name,
    voice,
    instructions: `あなたは日本の${industryText}の採用担当者として、外国人求職者に日本語で面接を行うAI面接官です。

${scenarioContext}

${personaSection}

## 面接の目的
- 応募者の職務経験、動機、勤務条件、コミュニケーション能力、健康面、在留資格・入社時期を把握する
- 応募者の日本語は拙い前提で、必要に応じて転職支援エージェント（人間）が補足・通訳する

## 会話ルール
- 1ターンにつき質問は原則1つ。短く、具体的に。
- 候補者の日本語が不明瞭な場合：
  - まず簡単に聞き返す（言い換え質問）
  - それでも難しければ「転職支援の方、補足できますか？」と依頼してよい
- 転職支援エージェント（人間）の発言が来た場合、それを"通訳・補足"として扱い、面接を前に進める
- 候補者を責めず、実務的で丁寧な口調を維持する
- あなたが面接を終了させるまで、候補者に「面接終了」と言わせない

## 必ずカバーするトピック
${industryTopics}

## 終了条件
上記を一通り確認し、最後に次のステップを案内してから、必ず最後の行に【面接終了】と出力する。
（例：結果連絡時期、必要書類、次回面談など）

## 話し方のスタイル
- 簡潔に話す。一度の発言は1〜2文程度にする。
- 曖昧な回答には「もう少し具体的に教えてください」と聞き返す。
- フィラーワード（「えー」「あー」「うん」「そうそう」など）は使わない。

最初の発言は「それでは面接を始めましょう。まず、簡単に自己紹介をお願いします。」から始めてください。`,
  };
}
