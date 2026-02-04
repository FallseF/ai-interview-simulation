/**
 * 評価システムのテスト
 */

import { describe, it, expect, beforeEach } from "vitest";
import { Evaluator } from "../evaluation/Evaluator.js";
import { FeedbackFormatter } from "../evaluation/FeedbackFormatter.js";
import type { TranscriptEntry } from "../orchestrator/TranscriptStore.js";

describe("Evaluator", () => {
  let evaluator: Evaluator;

  beforeEach(() => {
    evaluator = new Evaluator("test-session");
  });

  it("should evaluate empty transcripts", () => {
    const transcripts: TranscriptEntry[] = [];
    const result = evaluator.evaluate(transcripts);

    expect(result).toBeDefined();
    expect(result.sessionId).toBe("test-session");
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.maxScore).toBeGreaterThan(0);
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });

  it("should evaluate transcripts with human input", () => {
    const transcripts: TranscriptEntry[] = [
      {
        speaker: "interviewer",
        name: "田中部長",
        text: "自己紹介をお願いします。",
        timestamp: new Date(),
      },
      {
        speaker: "candidate",
        name: "グエン・ミン",
        text: "ベトナムから来たグエンです。IT経験3年です。",
        timestamp: new Date(),
      },
      {
        speaker: "human",
        name: "転職支援",
        text: "グエンさんはプログラミングの経験が豊富で、チームワークも優れています。御社にぴったりの人材です。",
        timestamp: new Date(),
      },
    ];

    const result = evaluator.evaluate(transcripts);

    expect(result).toBeDefined();
    expect(result.categoryResults.length).toBeGreaterThan(0);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.summary).toBeTruthy();
  });

  it("should calculate grade correctly", () => {
    const transcripts: TranscriptEntry[] = [
      {
        speaker: "human",
        name: "転職支援",
        text: "この候補者は非常に優秀で、技術力も高く、コミュニケーション能力も優れています。ぜひ御社で活躍できると思います。",
        timestamp: new Date(),
      },
    ];

    const result = evaluator.evaluate(transcripts);

    expect(["S", "A", "B", "C", "D", "F"]).toContain(result.grade);
  });
});

describe("FeedbackFormatter", () => {
  let evaluator: Evaluator;

  beforeEach(() => {
    evaluator = new Evaluator("test-session");
  });

  it("should format to text", () => {
    const transcripts: TranscriptEntry[] = [
      {
        speaker: "human",
        name: "転職支援",
        text: "グエンさんは非常に優秀な候補者です。",
        timestamp: new Date(),
      },
    ];

    const result = evaluator.evaluate(transcripts);
    const text = FeedbackFormatter.toText(result);

    expect(text).toContain("評価レポート");
    expect(text).toContain("グレード:");
    expect(text).toContain("スコア:");
  });

  it("should format to JSON with correct structure", () => {
    const transcripts: TranscriptEntry[] = [
      {
        speaker: "human",
        name: "転職支援",
        text: "グエンさんは非常に優秀な候補者です。",
        timestamp: new Date(),
      },
    ];

    const result = evaluator.evaluate(transcripts);
    const json = FeedbackFormatter.toJSON(result) as Record<string, unknown>;

    expect(json).toHaveProperty("passed");
    expect(json).toHaveProperty("grade");
    expect(json).toHaveProperty("gradeEmoji");
    expect(json).toHaveProperty("gradeMessage");
    expect(json).toHaveProperty("score");
    expect(json).toHaveProperty("summary");
    expect(json).toHaveProperty("categories");
    expect(json).toHaveProperty("strengths");
    expect(json).toHaveProperty("improvements");
    expect(json).toHaveProperty("actionItems");
    expect(json).toHaveProperty("criticalIssues");
    expect(json).toHaveProperty("missingItems");
    expect(json).toHaveProperty("duration");
    expect(json).toHaveProperty("evaluatedAt");

    // Should NOT have type field (that's added by the wrapper)
    expect(json).not.toHaveProperty("type");
  });

  it("should format to chat format", () => {
    const transcripts: TranscriptEntry[] = [
      {
        speaker: "human",
        name: "転職支援",
        text: "グエンさんは非常に優秀な候補者です。",
        timestamp: new Date(),
      },
    ];

    const result = evaluator.evaluate(transcripts);
    const chat = FeedbackFormatter.toChat(result);

    expect(chat).toContain("評価:");
    expect(chat).toMatch(/合格|不合格/);
  });
});

describe("Evaluation Integration", () => {
  it("should produce consistent results", () => {
    const transcripts: TranscriptEntry[] = [
      {
        speaker: "interviewer",
        name: "田中部長",
        text: "当社を志望した理由を教えてください。",
        timestamp: new Date(),
      },
      {
        speaker: "candidate",
        name: "グエン・ミン",
        text: "御社の技術力と成長性に魅力を感じました。",
        timestamp: new Date(),
      },
      {
        speaker: "human",
        name: "転職支援",
        text: "グエンさんは御社の企業理念に共感しており、特にイノベーションへの取り組みに強い関心をお持ちです。前職でのプロジェクトリーダー経験を活かし、御社でも貢献したいと考えています。",
        timestamp: new Date(),
      },
    ];

    const evaluator1 = new Evaluator("test-1");
    const evaluator2 = new Evaluator("test-2");

    const result1 = evaluator1.evaluate(transcripts);
    const result2 = evaluator2.evaluate(transcripts);

    // Same input should produce same score
    expect(result1.percentage).toBe(result2.percentage);
    expect(result1.grade).toBe(result2.grade);
  });
});
