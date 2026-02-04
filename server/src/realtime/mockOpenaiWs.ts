/**
 * MockOpenAIRealtimeConnection
 *
 * テスト用のモックOpenAI接続。本物のAPIに繋がず、
 * 事前に設定した応答パターンを返す。
 *
 * これで音声入力せんでもテストできるようになるで。
 */

import type { AIPersonaConfig } from "../types/roles.js";
import type { OpenAIConnectionCallbacks } from "./openaiWs.js";

export interface MockResponse {
  text: string;
  delayMs?: number; // 応答までの遅延（リアルな挙動をシミュレート）
}

export interface MockScenario {
  interviewer: MockResponse[];
  candidate: MockResponse[];
}

// デフォルトのテストシナリオ
const DEFAULT_SCENARIO: MockScenario = {
  interviewer: [
    { text: "はい、それでは面接を始めさせていただきます。まず、自己紹介をお願いできますか？", delayMs: 500 },
    { text: "なるほど、ありがとうございます。では、これまでのご経験について教えてください。", delayMs: 500 },
    { text: "興味深いですね。何か質問はありますか？", delayMs: 500 },
    { text: "承知しました。本日の面接は以上となります。ありがとうございました。【面接終了】", delayMs: 500 },
  ],
  candidate: [
    { text: "はい、私はグエン・ミンと申します。ベトナム出身で、日本で5年間エンジニアとして働いております。", delayMs: 500 },
    { text: "前職では、Webアプリケーションの開発を担当しておりました。ReactとNode.jsを使った開発が得意です。", delayMs: 500 },
    { text: "御社の技術スタックについて、もう少し詳しく教えていただけますか？", delayMs: 500 },
    { text: "ありがとうございました。本日は貴重なお時間をいただき、ありがとうございます。", delayMs: 500 },
  ],
};

export class MockOpenAIRealtimeConnection {
  private name: string;
  private config: AIPersonaConfig;
  private callbacks: OpenAIConnectionCallbacks;
  private isReady = false;
  private responseIndex = 0;
  private scenario: MockScenario;
  private role: "interviewer" | "candidate";

  constructor(
    name: string,
    config: AIPersonaConfig,
    callbacks: OpenAIConnectionCallbacks,
    scenario?: MockScenario
  ) {
    this.name = name;
    this.config = config;
    this.callbacks = callbacks;
    this.scenario = scenario || DEFAULT_SCENARIO;
    this.role = config.role;
  }

  connect(): void {
    console.log(`[Mock ${this.name}] Simulating connection...`);

    // 少し遅延してからsession readyを通知（本物っぽく）
    setTimeout(() => {
      console.log(`[Mock ${this.name}] Session ready`);
      this.isReady = true;
      this.callbacks.onSessionReady();
    }, 100);
  }

  // テキストメッセージを受け取る（ログするだけ）
  addTextMessage(text: string, _role: "user" | "assistant" = "user"): void {
    console.log(`[Mock ${this.name}] Received text message: ${text}`);
  }

  // 音声データを受け取る（ログするだけ）
  appendAudio(_audioBase64: string): void {
    console.log(`[Mock ${this.name}] Received audio chunk`);
  }

  // 音声バッファをコミット（ログするだけ）
  commitAudio(): void {
    console.log(`[Mock ${this.name}] Audio committed`);
  }

  // 音声バッファをクリア
  clearAudio(): void {
    console.log(`[Mock ${this.name}] Audio cleared`);
  }

  // AIに応答を要求 - ここがメインの処理
  requestResponse(): void {
    console.log(`[Mock ${this.name}] Response requested (index: ${this.responseIndex})`);

    const responses = this.role === "interviewer"
      ? this.scenario.interviewer
      : this.scenario.candidate;

    if (this.responseIndex >= responses.length) {
      console.log(`[Mock ${this.name}] No more responses in scenario`);
      // 応答がなくなったらループする or デフォルトメッセージ
      this.responseIndex = 0;
    }

    const response = responses[this.responseIndex];
    this.responseIndex++;

    const delay = response.delayMs || 500;

    setTimeout(() => {
      // transcript deltaを少しずつ送る（リアルな挙動）
      this.simulateTranscriptStream(response.text);
    }, delay);
  }

  private simulateTranscriptStream(fullText: string): void {
    // テキストを文字ずつ送信するシミュレーション
    const chars = fullText.split("");
    let index = 0;

    const streamInterval = setInterval(() => {
      if (index < chars.length) {
        // 数文字ずつ送る
        const chunk = chars.slice(index, index + 3).join("");
        this.callbacks.onTranscriptDelta(chunk);
        index += 3;
      } else {
        clearInterval(streamInterval);

        // 完了通知
        this.callbacks.onTranscriptDone(fullText);

        // 音声ダミー（実際の音声は送らない、done だけ）
        this.callbacks.onAudioDone();

        // レスポンス完了
        this.callbacks.onResponseDone("completed");
      }
    }, 30); // 30msごとに送信
  }

  // 応答をキャンセル
  cancelResponse(): void {
    console.log(`[Mock ${this.name}] Response cancelled`);
  }

  close(): void {
    console.log(`[Mock ${this.name}] Connection closed`);
    this.isReady = false;
    this.callbacks.onClose();
  }

  get ready(): boolean {
    return this.isReady;
  }

  get connected(): boolean {
    return this.isReady;
  }

  // テスト用：シナリオを設定
  setScenario(scenario: MockScenario): void {
    this.scenario = scenario;
    this.responseIndex = 0;
  }

  // テスト用：レスポンスインデックスをリセット
  resetResponseIndex(): void {
    this.responseIndex = 0;
  }

  // テスト用：現在のインデックスを取得
  getResponseIndex(): number {
    return this.responseIndex;
  }
}

// シナリオをファイルから読み込むヘルパー
export function createMockScenario(
  interviewerResponses: string[],
  candidateResponses: string[],
  delayMs = 500
): MockScenario {
  return {
    interviewer: interviewerResponses.map((text) => ({ text, delayMs })),
    candidate: candidateResponses.map((text) => ({ text, delayMs })),
  };
}
