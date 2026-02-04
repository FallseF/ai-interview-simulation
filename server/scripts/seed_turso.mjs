import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server/ first, then repo root if needed
const envCandidates = [
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
];
for (const envPath of envCandidates) {
  dotenv.config({ path: envPath });
  if (process.env.TURSO_DATABASE_URL) break;
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("[Seed] TURSO_DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const PATTERNS = ["pattern1", "pattern2", "pattern3"];
const MODES = ["step", "auto"];
const JAPANESE_LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const GENDERS = ["male", "female"];
const INDUSTRIES = ["manufacturing", "nursing", "restaurant", "retail", "logistics", "construction", "it", "other"];
const PERSONALITIES = ["detailed", "casual", "inquisitive", "friendly", "strict"];
const LITERACY = ["high", "low"];
const DIALECTS = ["standard", "kansai", "kyushu", "tohoku"];
const DIFFICULTY = ["beginner", "hard"];
const NATIONALITIES = ["ベトナム", "ネパール", "インドネシア", "フィリピン", "ミャンマー", "中国"];

const SUMMARY_TEMPLATES = [
  "終始落ち着いた受け答えで、質問に対する反応が安定していました。",
  "要点を短く伝えられた一方、具体例の深掘りが不足していました。",
  "説明は丁寧でしたが、結論までの整理に改善余地があります。",
  "受け答えのテンポが良く、相手の意図を正確に汲み取れていました。",
];

const STRENGTHS_POOL = [
  "質問の意図を理解する姿勢",
  "簡潔で聞き取りやすい回答",
  "丁寧な言葉遣い",
  "相手の話を最後まで聞く姿勢",
  "自分の経験を具体化できている点",
];

const IMPROVEMENTS_POOL = [
  "エピソードの具体性をもう一段深める",
  "結論を先に述べてから詳細に入る",
  "言葉の選び方をもう少し自然にする",
  "質問への回答速度を整える",
  "話の長さを要点で整理する",
];

const ACTION_ITEMS_POOL = [
  "自己紹介を90秒にまとめて練習する",
  "志望動機のキーワードを3点整理する",
  "回答の冒頭で結論を言う練習をする",
  "想定問答を録音して振り返る",
];

const CATEGORY_POOL = [
  "コミュニケーション",
  "敬語・表現",
  "論理構成",
  "姿勢・マナー",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, count) {
  const copy = [...arr];
  const result = [];
  while (copy.length > 0 && result.length < count) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function gradeFromPercentage(percentage) {
  if (percentage >= 95) return "S";
  if (percentage >= 85) return "A";
  if (percentage >= 75) return "B";
  if (percentage >= 65) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

function buildPersona(japaneseLevel) {
  return {
    interviewer: {
      gender: pick(GENDERS),
      industry: pick(INDUSTRIES),
      personality: pick(PERSONALITIES),
      foreignHiringLiteracy: pick(LITERACY),
      dialect: pick(DIALECTS),
      difficulty: pick(DIFFICULTY),
    },
    candidate: {
      japaneseLevel,
      nationality: pick(NATIONALITIES),
      workExperience: Math.random() < 0.6,
    },
  };
}

function buildTranscripts(pattern, startedAt) {
  const base = new Date(startedAt);
  const lines = [];

  if (pattern === "pattern1") {
    lines.push(["human", "出席確認をします。お名前を教えてください。"]);
    lines.push(["candidate", "本日よろしくお願いします。名前はグエン・ティ・ミンです。"]);
    lines.push(["human", "簡単に自己紹介をお願いします。"]);
    lines.push(["candidate", "ベトナム出身で、物流の仕事に興味があります。"]);
    lines.push(["human", "志望動機を短く教えてください。"]);
    lines.push(["candidate", "安定した職場で成長したいと思っています。"]);
  } else if (pattern === "pattern2") {
    lines.push(["interviewer", "本日はお越しいただきありがとうございます。まず自己紹介をお願いします。"]);
    lines.push(["candidate", "インドネシア出身で、製造業で働きたいです。"]);
    lines.push(["interviewer", "志望動機を教えてください。"]);
    lines.push(["candidate", "品質管理の仕事に興味があり、コツコツ学びたいです。"]);
    lines.push(["human", "補足すると、現場での安全意識が高い方です。"]);
    lines.push(["interviewer", "最後に質問はありますか？"]);
    lines.push(["candidate", "研修制度について教えてください。"]);
  } else {
    lines.push(["interviewer", "候補者の第一印象を教えてください。"]);
    lines.push(["human", "質問の意図を理解しており、礼儀正しい印象でした。"]);
    lines.push(["interviewer", "改善点があれば教えてください。"]);
    lines.push(["human", "具体例が不足気味なので、経験を掘り下げる必要があります。"]);
  }

  return lines.map((line, idx) => {
    const timestamp = new Date(base.getTime() + idx * 60000);
    return {
      speaker: line[0],
      text: line[1],
      timestamp: timestamp.toISOString(),
    };
  });
}

function buildEvaluation() {
  const categories = pickMany(CATEGORY_POOL, 3).map((name) => {
    const maxScore = 10;
    const score = 6 + Math.floor(Math.random() * 5);
    return {
      name,
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
    };
  });

  const scoreMax = categories.reduce((sum, c) => sum + c.maxScore, 0);
  const scoreTotal = categories.reduce((sum, c) => sum + c.score, 0);
  const percentage = Math.round((scoreTotal / scoreMax) * 100);
  const grade = gradeFromPercentage(percentage);

  const improvements = pickMany(IMPROVEMENTS_POOL, 2);
  const strengths = pickMany(STRENGTHS_POOL, 2);
  const actionItems = pickMany(ACTION_ITEMS_POOL, 2);

  const criticalIssues = percentage < 65
    ? [{ description: "要点が散漫", feedback: "結論から話す癖を付けましょう。" }]
    : [];

  const missingItems = percentage < 60
    ? [{ name: "志望動機の具体例", feedback: "経験と結び付けて説明してください。" }]
    : [];

  return {
    passed: percentage >= 75,
    grade,
    scoreTotal,
    scoreMax,
    percentage,
    summary: pick(SUMMARY_TEMPLATES),
    categories,
    strengths,
    improvements,
    actionItems,
    criticalIssues,
    missingItems,
  };
}

async function ensureSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      pattern TEXT NOT NULL,
      japanese_level TEXT,
      mode TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      duration_seconds INTEGER,
      end_reason TEXT,
      persona_json TEXT
    )
  `);

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

  const result = await client.execute(`PRAGMA table_info(sessions)`);
  const hasPersona = result.rows.some((row) => row.name === "persona_json");
  if (!hasPersona) {
    await client.execute(`ALTER TABLE sessions ADD COLUMN persona_json TEXT`);
  }
}

async function clearAll() {
  await client.execute("DELETE FROM transcripts");
  await client.execute("DELETE FROM evaluations");
  await client.execute("DELETE FROM sessions");
}

async function seed() {
  await ensureSchema();
  await clearAll();

  const now = Date.now();
  const base = now - 1000 * 60 * 60 * 24 * 25; // 25 days ago

  let transcriptCount = 0;
  let evalCount = 0;

  for (let i = 0; i < 20; i += 1) {
    const id = crypto.randomUUID();
    const pattern = PATTERNS[i % PATTERNS.length];
    const mode = MODES[i % MODES.length];
    const japaneseLevel = JAPANESE_LEVELS[i % JAPANESE_LEVELS.length];
    const startedAt = new Date(base + i * 1000 * 60 * 60 * 6);
    const durationSeconds = 900 + (i % 5) * 180; // 15-27 min
    const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);
    const endReason = i % 9 === 0 ? "aborted" : "normal";

    const persona = buildPersona(japaneseLevel);

    await client.execute({
      sql: `INSERT INTO sessions (id, pattern, japanese_level, mode, started_at, ended_at, duration_seconds, end_reason, persona_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        pattern,
        japaneseLevel,
        mode,
        startedAt.toISOString(),
        endedAt.toISOString(),
        durationSeconds,
        endReason,
        JSON.stringify(persona),
      ],
    });

    const transcripts = buildTranscripts(pattern, startedAt);
    for (const entry of transcripts) {
      await client.execute({
        sql: `INSERT INTO transcripts (session_id, speaker, text, timestamp)
              VALUES (?, ?, ?, ?)`,
        args: [id, entry.speaker, entry.text, entry.timestamp],
      });
      transcriptCount += 1;
    }

    const evaluation = buildEvaluation();
    await client.execute({
      sql: `INSERT INTO evaluations (
              session_id, passed, grade,
              score_total, score_max, score_percentage,
              summary, categories_json, strengths_json,
              improvements_json, action_items_json,
              critical_issues_json, missing_items_json,
              evaluated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      args: [
        id,
        evaluation.passed ? 1 : 0,
        evaluation.grade,
        evaluation.scoreTotal,
        evaluation.scoreMax,
        evaluation.percentage,
        evaluation.summary,
        JSON.stringify(evaluation.categories),
        JSON.stringify(evaluation.strengths),
        JSON.stringify(evaluation.improvements),
        JSON.stringify(evaluation.actionItems),
        JSON.stringify(evaluation.criticalIssues),
        JSON.stringify(evaluation.missingItems),
        endedAt.toISOString(),
      ],
    });
    evalCount += 1;
  }

  console.log(`[Seed] Inserted 20 sessions, ${transcriptCount} transcripts, ${evalCount} evaluations.`);
}

seed()
  .then(() => {
    console.log("[Seed] Done.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Seed] Failed:", error);
    process.exit(1);
  });
