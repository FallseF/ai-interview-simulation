/**
 * テスト用シナリオ集
 *
 * モックモードで使うシナリオを定義。
 * 実際の面接パターンをシミュレートして、
 * 音声入力なしでシステムのテストができる。
 */

import type { MockScenario } from "../realtime/mockOpenaiWs.js";

// ========================================
// 基本的な面接シナリオ（正常系）
// ========================================
export const BASIC_INTERVIEW_SCENARIO: MockScenario = {
  interviewer: [
    {
      text: "本日は面接にお越しいただきありがとうございます。私は人事部の田中と申します。まず、簡単に自己紹介をお願いできますか？",
      delayMs: 300,
    },
    {
      text: "なるほど、ベトナムからいらしたんですね。日本での開発経験について、もう少し詳しく教えていただけますか？",
      delayMs: 300,
    },
    {
      text: "React と Node.js のご経験があるんですね。弊社でもそれらの技術を使っています。何か質問はありますか？",
      delayMs: 300,
    },
    {
      text: "承知しました。それでは本日の面接は以上となります。結果は1週間以内にご連絡いたします。ありがとうございました。【面接終了】",
      delayMs: 300,
    },
  ],
  candidate: [
    {
      text: "はい、ありがとうございます。私はグエン・ミンと申します。ベトナム出身で、日本で5年間ソフトウェアエンジニアとして働いております。",
      delayMs: 300,
    },
    {
      text: "はい、主にWebアプリケーション開発を担当してきました。React でのフロントエンド開発と、Node.js でのバックエンド開発の両方を経験しています。",
      delayMs: 300,
    },
    {
      text: "御社のチーム構成について教えていただけますか？また、リモートワークの制度はありますか？",
      delayMs: 300,
    },
    {
      text: "ありがとうございました。御社でぜひ働かせていただきたいと思います。よろしくお願いいたします。",
      delayMs: 300,
    },
  ],
};

// ========================================
// 短いテスト用シナリオ（クイックテスト）
// ========================================
export const QUICK_TEST_SCENARIO: MockScenario = {
  interviewer: [
    { text: "こんにちは、面接を始めます。自己紹介をお願いします。", delayMs: 100 },
    { text: "ありがとうございます。面接終了です。【面接終了】", delayMs: 100 },
  ],
  candidate: [
    { text: "グエン・ミンです。よろしくお願いします。", delayMs: 100 },
    { text: "ありがとうございました。", delayMs: 100 },
  ],
};

// ========================================
// 転職支援介入シナリオ（ユーザーが介入するケース）
// ========================================
export const AGENT_INTERVENTION_SCENARIO: MockScenario = {
  interviewer: [
    {
      text: "本日はよろしくお願いします。では、早速ですが志望動機を教えてください。",
      delayMs: 300,
    },
    {
      text: "なるほど。それでは次に、5年後のキャリアプランについて教えてください。",
      delayMs: 300,
    },
    {
      text: "わかりました。何か弊社について質問はありますか？",
      delayMs: 300,
    },
    {
      text: "承知しました。本日は以上です。お疲れ様でした。【面接終了】",
      delayMs: 300,
    },
  ],
  candidate: [
    {
      text: "御社の技術力に魅力を感じています。特にAI開発のプロジェクトに参加したいと考えています。",
      delayMs: 300,
    },
    {
      text: "5年後には、テックリードとしてチームをまとめる立場になりたいと考えています。",
      delayMs: 300,
    },
    {
      text: "研修制度について詳しく教えていただけますか？",
      delayMs: 300,
    },
    {
      text: "ありがとうございました。",
      delayMs: 300,
    },
  ],
};

// ========================================
// 面接中止シナリオ（エラーケーステスト）
// ========================================
export const ABORTED_INTERVIEW_SCENARIO: MockScenario = {
  interviewer: [
    {
      text: "申し訳ございません、急用が入りまして面接を中断させていただきます。【面接中止】",
      delayMs: 300,
    },
  ],
  candidate: [
    { text: "承知いたしました。", delayMs: 300 },
  ],
};

// ========================================
// 長時間面接シナリオ（ストレステスト）
// ========================================
export const LONG_INTERVIEW_SCENARIO: MockScenario = {
  interviewer: [
    { text: "では面接を始めます。自己紹介をお願いします。", delayMs: 200 },
    { text: "これまでの職務経歴を教えてください。", delayMs: 200 },
    { text: "得意な技術は何ですか？", delayMs: 200 },
    { text: "苦手なことはありますか？", delayMs: 200 },
    { text: "チームでの開発経験について教えてください。", delayMs: 200 },
    { text: "リーダー経験はありますか？", delayMs: 200 },
    { text: "困難を乗り越えた経験を教えてください。", delayMs: 200 },
    { text: "転職理由を教えてください。", delayMs: 200 },
    { text: "希望年収はいくらですか？", delayMs: 200 },
    { text: "いつから働けますか？", delayMs: 200 },
    { text: "最後に質問はありますか？", delayMs: 200 },
    { text: "ありがとうございました。面接終了です。【面接終了】", delayMs: 200 },
  ],
  candidate: [
    { text: "グエン・ミンです。5年の開発経験があります。", delayMs: 200 },
    { text: "前職ではECサイトの開発を担当していました。", delayMs: 200 },
    { text: "React と TypeScript が得意です。", delayMs: 200 },
    { text: "人前でのプレゼンが少し苦手です。", delayMs: 200 },
    { text: "5人チームでアジャイル開発をしていました。", delayMs: 200 },
    { text: "サブリーダーとして2人のメンバーを指導していました。", delayMs: 200 },
    { text: "納期が厳しいプロジェクトで、効率化を図って乗り越えました。", delayMs: 200 },
    { text: "より大規模なプロジェクトに挑戦したいと考えています。", delayMs: 200 },
    { text: "現在と同等以上を希望しています。", delayMs: 200 },
    { text: "1ヶ月後から可能です。", delayMs: 200 },
    { text: "チームの雰囲気について教えてください。", delayMs: 200 },
    { text: "ありがとうございました。", delayMs: 200 },
  ],
};

// シナリオをまとめてエクスポート
export const SCENARIOS = {
  basic: BASIC_INTERVIEW_SCENARIO,
  quick: QUICK_TEST_SCENARIO,
  intervention: AGENT_INTERVENTION_SCENARIO,
  aborted: ABORTED_INTERVIEW_SCENARIO,
  long: LONG_INTERVIEW_SCENARIO,
} as const;

export type ScenarioName = keyof typeof SCENARIOS;

// シナリオを名前で取得
export function getScenario(name: ScenarioName): MockScenario {
  return SCENARIOS[name];
}

// 利用可能なシナリオ一覧を取得
export function listScenarios(): ScenarioName[] {
  return Object.keys(SCENARIOS) as ScenarioName[];
}
