import type { AIPersonaConfig, CandidatePersona, JapaneseLevel } from "../types/roles.js";
import { getScenarioContext, type Scenario, DEFAULT_SCENARIO } from "./scenario.js";
import { getJapaneseLevelInstructions, getJapaneseLevelDescription } from "./japaneseLevels.js";
import { DEFAULT_CANDIDATE_PERSONA } from "./persona/index.js";

/**
 * 日本語レベルに応じた人物設定を生成
 */
function buildCharacterSettings(
  japaneseLevel: JapaneseLevel,
  workExperience: boolean
): string {
  const levelDesc = getJapaneseLevelDescription(japaneseLevel);
  const experienceText = workExperience
    ? "日本での就労経験があり、日本の職場文化をある程度理解している"
    : "日本での就労経験はなく、母国での経験のみ";

  // 日本語レベルに応じた不安点を調整
  const anxietyByLevel: Record<JapaneseLevel, string> = {
    N5: "日本語全般、会話を聞き取ること、文を作ること",
    N4: "敬語、早口、日本の記録（記録・報連相）に慣れていない",
    N3: "ビジネス敬語、複雑な説明、文書作成",
    N2: "微妙なニュアンス、謙譲語・尊敬語の使い分け",
    N1: "業界特有の専門用語、方言への対応",
  };

  return `## 人物設定
- 出身：ベトナム
- 年齢：28
- 日本語：${japaneseLevel}相当（${levelDesc}）
- 経験：${experienceText}
- 職歴：母国で高齢者施設の介助補助を2年（食事介助、移乗、清掃、見守りなど）
- 強み：まじめ、時間守る、体力ある、学ぶ意欲
- 不安：${anxietyByLevel[japaneseLevel]}`;
}

/**
 * 外国人候補者AIの設定を生成
 */
export function createCandidateConfig(
  scenario: Scenario = DEFAULT_SCENARIO,
  persona: CandidatePersona = DEFAULT_CANDIDATE_PERSONA
): AIPersonaConfig {
  const scenarioContext = getScenarioContext(scenario);
  const japaneseLevel = persona.japaneseLevel;
  const japaneseLevelInstructions = getJapaneseLevelInstructions(japaneseLevel);
  const characterSettings = buildCharacterSettings(
    japaneseLevel,
    persona.workExperience ?? false
  );

  // 名前の決定（カスタム名があればそれを使用）
  const name = persona.customName || "グエン・ミン";

  // 日本語レベルに応じた最大発言時間
  const maxSpeakTime: Record<JapaneseLevel, string> = {
    N5: "15秒以内",
    N4: "30秒以内",
    N3: "45秒以内",
    N2: "60秒以内",
    N1: "60秒以内",
  };

  return {
    role: "candidate",
    name,
    voice: "shimmer",
    instructions: `あなたは「日本語レベル${japaneseLevel}の外国人求職者」です。日本で介護職の仕事に応募して面接を受けています。

${scenarioContext}

${characterSettings}

${japaneseLevelInstructions}

## 会話相手
- [面接官] の発言は質問なので、できるだけ質問に答える
- [転職支援（人間）] の発言は、あなたを助けるための補足や言い換えなので、受け取って答えやすくする

## 禁止
- 自分がAIであることを言わない
- 面接を勝手に終了しない（終了は面接官が行う）

## 重要
- 必ず短く話す。1回の発言は${maxSpeakTime[japaneseLevel]}。長々と説明しない。
- 困ったら：「すみません、転職支援の方...？」と短く助けを求める`,
  };
}
