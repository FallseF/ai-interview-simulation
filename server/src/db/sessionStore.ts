import { getDbClient, isDbEnabled } from "./client.js";
import type { InterviewPattern, JapaneseLevel, InterviewMode, EndReason } from "../types/roles.js";
import type { EvaluationResultMessage } from "../types/ws.js";
import { randomUUID } from "crypto";

export interface SessionData {
  id: string;
  pattern: InterviewPattern;
  japaneseLevel?: JapaneseLevel;
  mode: InterviewMode;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  endReason?: EndReason;
}

export interface TranscriptData {
  sessionId: string;
  speaker: string;
  text: string;
  timestamp: Date;
}

/**
 * セッションストア - DBへの保存を担当
 */
export class SessionStore {
  private sessionId: string;
  private pendingTranscripts: TranscriptData[] = [];
  private sessionData: SessionData | null = null;

  constructor() {
    this.sessionId = randomUUID();
  }

  /**
   * セッションIDを取得
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * セッション開始を記録
   */
  async startSession(
    pattern: InterviewPattern,
    mode: InterviewMode,
    japaneseLevel?: JapaneseLevel
  ): Promise<void> {
    this.sessionData = {
      id: this.sessionId,
      pattern,
      japaneseLevel,
      mode,
      startedAt: new Date(),
    };

    if (!isDbEnabled()) return;

    const client = getDbClient();
    if (!client) return;

    try {
      await client.execute({
        sql: `INSERT INTO sessions (id, pattern, japanese_level, mode, started_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          this.sessionId,
          pattern,
          japaneseLevel || null,
          mode,
          this.sessionData.startedAt.toISOString(),
        ],
      });
      console.log(`[DB] Session started: ${this.sessionId}`);
    } catch (error) {
      console.error("[DB] Failed to save session start:", error);
    }
  }

  /**
   * トランスクリプトを追加
   */
  async addTranscript(speaker: string, text: string): Promise<void> {
    const transcript: TranscriptData = {
      sessionId: this.sessionId,
      speaker,
      text,
      timestamp: new Date(),
    };

    this.pendingTranscripts.push(transcript);

    if (!isDbEnabled()) return;

    const client = getDbClient();
    if (!client) return;

    try {
      await client.execute({
        sql: `INSERT INTO transcripts (session_id, speaker, text, timestamp)
              VALUES (?, ?, ?, ?)`,
        args: [
          transcript.sessionId,
          transcript.speaker,
          transcript.text,
          transcript.timestamp.toISOString(),
        ],
      });
    } catch (error) {
      console.error("[DB] Failed to save transcript:", error);
    }
  }

  /**
   * セッション終了を記録
   */
  async endSession(endReason: EndReason): Promise<void> {
    if (!this.sessionData) return;

    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - this.sessionData.startedAt.getTime()) / 1000
    );

    this.sessionData.endedAt = endedAt;
    this.sessionData.durationSeconds = durationSeconds;
    this.sessionData.endReason = endReason;

    if (!isDbEnabled()) return;

    const client = getDbClient();
    if (!client) return;

    try {
      await client.execute({
        sql: `UPDATE sessions
              SET ended_at = ?, duration_seconds = ?, end_reason = ?
              WHERE id = ?`,
        args: [
          endedAt.toISOString(),
          durationSeconds,
          endReason,
          this.sessionId,
        ],
      });
      console.log(`[DB] Session ended: ${this.sessionId} (${durationSeconds}s)`);
    } catch (error) {
      console.error("[DB] Failed to save session end:", error);
    }
  }

  /**
   * 評価結果を保存
   */
  async saveEvaluation(result: EvaluationResultMessage): Promise<void> {
    if (!isDbEnabled()) return;

    const client = getDbClient();
    if (!client) return;

    try {
      await client.execute({
        sql: `INSERT INTO evaluations (
                session_id, passed, grade,
                score_total, score_max, score_percentage,
                summary, categories_json, strengths_json,
                improvements_json, action_items_json,
                critical_issues_json, missing_items_json,
                evaluated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          this.sessionId,
          result.passed ? 1 : 0,
          result.grade,
          result.score.total,
          result.score.max,
          result.score.percentage,
          result.summary,
          JSON.stringify(result.categories),
          JSON.stringify(result.strengths),
          JSON.stringify(result.improvements),
          JSON.stringify(result.actionItems),
          JSON.stringify(result.criticalIssues),
          JSON.stringify(result.missingItems),
          result.evaluatedAt,
        ],
      });
      console.log(`[DB] Evaluation saved for session: ${this.sessionId}`);
    } catch (error) {
      console.error("[DB] Failed to save evaluation:", error);
    }
  }

  /**
   * セッションのトランスクリプトを取得（メモリから）
   */
  getTranscripts(): TranscriptData[] {
    return [...this.pendingTranscripts];
  }

  /**
   * セッションデータを取得
   */
  getSessionData(): SessionData | null {
    return this.sessionData;
  }
}

// ============================================================
// クエリ関数（分析用）
// ============================================================

/**
 * 最近のセッション一覧を取得
 */
export async function getRecentSessions(limit = 10): Promise<SessionData[]> {
  const client = getDbClient();
  if (!client) return [];

  try {
    const result = await client.execute({
      sql: `SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?`,
      args: [limit],
    });
    return result.rows.map((row) => ({
      id: row.id as string,
      pattern: row.pattern as InterviewPattern,
      japaneseLevel: row.japanese_level as JapaneseLevel | undefined,
      mode: row.mode as InterviewMode,
      startedAt: new Date(row.started_at as string),
      endedAt: row.ended_at ? new Date(row.ended_at as string) : undefined,
      durationSeconds: row.duration_seconds as number | undefined,
      endReason: row.end_reason as EndReason,
    }));
  } catch (error) {
    console.error("[DB] Failed to get recent sessions:", error);
    return [];
  }
}

/**
 * セッションの評価結果を取得
 */
export async function getEvaluationBySessionId(
  sessionId: string
): Promise<EvaluationResultMessage | null> {
  const client = getDbClient();
  if (!client) return null;

  try {
    const result = await client.execute({
      sql: `SELECT * FROM evaluations WHERE session_id = ?`,
      args: [sessionId],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      passed: row.passed === 1,
      grade: row.grade as string,
      gradeEmoji: getGradeEmoji(row.grade as string),
      gradeMessage: getGradeMessage(row.grade as string),
      score: {
        total: row.score_total as number,
        max: row.score_max as number,
        percentage: row.score_percentage as number,
      },
      summary: row.summary as string,
      categories: JSON.parse(row.categories_json as string),
      strengths: JSON.parse(row.strengths_json as string),
      improvements: JSON.parse(row.improvements_json as string),
      actionItems: JSON.parse(row.action_items_json as string),
      criticalIssues: JSON.parse(row.critical_issues_json as string),
      missingItems: JSON.parse(row.missing_items_json as string),
      duration: 0, // セッションから取得する必要あり
      evaluatedAt: row.evaluated_at as string,
    };
  } catch (error) {
    console.error("[DB] Failed to get evaluation:", error);
    return null;
  }
}

/**
 * 統計情報を取得
 */
export async function getStatistics(): Promise<{
  totalSessions: number;
  passRate: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
}> {
  const client = getDbClient();
  if (!client) {
    return { totalSessions: 0, passRate: 0, averageScore: 0, gradeDistribution: {} };
  }

  try {
    // 総セッション数
    const totalResult = await client.execute(`SELECT COUNT(*) as count FROM sessions`);
    const totalSessions = totalResult.rows[0].count as number;

    // 合格率と平均スコア
    const evalResult = await client.execute(`
      SELECT
        COUNT(*) as total,
        SUM(passed) as passed_count,
        AVG(score_percentage) as avg_score
      FROM evaluations
    `);
    const evalRow = evalResult.rows[0];
    const evalTotal = evalRow.total as number;
    const passRate = evalTotal > 0 ? ((evalRow.passed_count as number) / evalTotal) * 100 : 0;
    const averageScore = (evalRow.avg_score as number) || 0;

    // グレード分布
    const gradeResult = await client.execute(`
      SELECT grade, COUNT(*) as count
      FROM evaluations
      GROUP BY grade
    `);
    const gradeDistribution: Record<string, number> = {};
    for (const row of gradeResult.rows) {
      gradeDistribution[row.grade as string] = row.count as number;
    }

    return { totalSessions, passRate, averageScore, gradeDistribution };
  } catch (error) {
    console.error("[DB] Failed to get statistics:", error);
    return { totalSessions: 0, passRate: 0, averageScore: 0, gradeDistribution: {} };
  }
}

// ヘルパー関数
function getGradeEmoji(grade: string): string {
  const emojis: Record<string, string> = {
    S: "🌟", A: "✨", B: "👍", C: "📝", D: "⚠️", F: "❌",
  };
  return emojis[grade] || "📋";
}

function getGradeMessage(grade: string): string {
  const messages: Record<string, string> = {
    S: "素晴らしい対応です！",
    A: "良い対応です",
    B: "合格ラインです",
    C: "もう少し頑張りましょう",
    D: "改善が必要です",
    F: "不合格",
  };
  return messages[grade] || "";
}
