import { createClient, type Client } from "@libsql/client";

let client: Client | null = null;

/**
 * Tursoクライアントを取得（シングルトン）
 */
export function getDbClient(): Client | null {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // 環境変数が設定されていない場合はnullを返す（DB保存をスキップ）
  if (!url) {
    console.log("[DB] TURSO_DATABASE_URL not set - database logging disabled");
    return null;
  }

  try {
    client = createClient({
      url,
      authToken,
    });
    console.log("[DB] Connected to Turso database");
    return client;
  } catch (error) {
    console.error("[DB] Failed to connect to Turso:", error);
    return null;
  }
}

/**
 * DB接続が有効かどうか
 */
export function isDbEnabled(): boolean {
  return !!process.env.TURSO_DATABASE_URL;
}
