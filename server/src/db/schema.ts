import { getDbClient } from "./client.js";

/**
 * データベーススキーマを初期化
 */
export async function initializeSchema(): Promise<void> {
  const client = getDbClient();
  if (!client) return;

  try {
    // セッションテーブル
    await client.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        japanese_level TEXT,
        mode TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        duration_seconds INTEGER,
        end_reason TEXT
      )
    `);

    // トランスクリプトテーブル
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        speaker TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // 評価結果テーブル
    await client.execute(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL UNIQUE,
        passed INTEGER NOT NULL,
        grade TEXT NOT NULL,
        score_total REAL NOT NULL,
        score_max REAL NOT NULL,
        score_percentage REAL NOT NULL,
        summary TEXT,
        categories_json TEXT,
        strengths_json TEXT,
        improvements_json TEXT,
        action_items_json TEXT,
        critical_issues_json TEXT,
        missing_items_json TEXT,
        evaluated_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // インデックス作成
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_transcripts_session_id ON transcripts(session_id)
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_evaluations_session_id ON evaluations(session_id)
    `);
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at)
    `);

    console.log("[DB] Schema initialized successfully");
  } catch (error) {
    console.error("[DB] Failed to initialize schema:", error);
    throw error;
  }
}
