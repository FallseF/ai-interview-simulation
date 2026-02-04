import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { validateEnv, PORT, MOCK_MODE } from "./config.js";
import { InterviewOrchestrator } from "./orchestrator/InterviewOrchestrator.js";
import type { PatternConfig, InterviewPattern, JapaneseLevel, Role } from "./types/roles.js";
import {
  initializeSchema,
  getRecentSessions,
  getSessionById,
  getTranscriptsBySessionId,
  getEvaluationBySessionId,
  getStatistics,
  isDbEnabled,
} from "./db/index.js";
import { listScenarios, getScenario, type ScenarioName } from "./testScenarios/index.js";
import { isAudioDebugEnabled, AudioDebugger } from "./audioTest/AudioDebugger.js";
import {
  generateSineWave,
  generateSilence,
  pcm16ToBase64,
  inspectAudioData,
} from "./audioTest/audioUtils.js";

// Validate environment
validateEnv();

// Initialize database schema (async, non-blocking)
initializeSchema().catch((err) => {
  console.error("[Server] Database schema initialization failed:", err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express app setup
const app = express();
const server = createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server, path: "/ws" });

// Serve static files from frontend build (production) or public folder
const publicPath = path.join(__dirname, "../../frontend/dist");
const fallbackPath = path.join(__dirname, "../../public");

// Try frontend/dist first, fallback to public
app.use(express.static(publicPath));
app.use(express.static(fallbackPath));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// ========================================
// データベース統計エンドポイント
// ========================================

// DB接続状態
app.get("/api/db/status", (req, res) => {
  res.json({
    enabled: isDbEnabled(),
    info: isDbEnabled()
      ? "📊 Database logging enabled"
      : "Database logging disabled - set TURSO_DATABASE_URL to enable",
  });
});

// 最近のセッション一覧
app.get("/api/sessions/recent", async (req, res) => {
  const limit = parseInt((req.query.limit as string) || "10", 10);
  const sessions = await getRecentSessions(limit);
  res.json({ sessions });
});

// セッション詳細
app.get("/api/sessions/:id", async (req, res) => {
  const session = await getSessionById(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  res.json({ session });
});

// トランスクリプト取得
app.get("/api/sessions/:id/transcripts", async (req, res) => {
  const limit = parseInt((req.query.limit as string) || "200", 10);
  const transcripts = await getTranscriptsBySessionId(req.params.id, limit);
  res.json({ transcripts });
});

// 評価取得
app.get("/api/sessions/:id/evaluation", async (req, res) => {
  const evaluation = await getEvaluationBySessionId(req.params.id);
  if (!evaluation) {
    res.status(404).json({ error: "Evaluation not found" });
    return;
  }
  res.json({ evaluation });
});

// 統計情報
app.get("/api/stats", async (req, res) => {
  const stats = await getStatistics();
  res.json(stats);
});

// ========================================
// デバッグ・テスト用エンドポイント
// ========================================

// サーバー状態（モックモードかどうかなど）
app.get("/api/debug/status", (req, res) => {
  res.json({
    mockMode: MOCK_MODE,
    availableScenarios: listScenarios(),
    info: MOCK_MODE
      ? "🧪 Mock mode enabled - OpenAI API not used"
      : "🔴 Production mode - using real OpenAI API",
  });
});

// 利用可能なシナリオ一覧
app.get("/api/debug/scenarios", (req, res) => {
  const scenarios = listScenarios();
  const details = scenarios.map((name) => {
    const scenario = getScenario(name);
    return {
      name,
      interviewerTurns: scenario.interviewer.length,
      candidateTurns: scenario.candidate.length,
    };
  });
  res.json({ scenarios: details });
});

// 特定のシナリオの内容を取得
app.get("/api/debug/scenarios/:name", (req, res) => {
  const name = req.params.name as ScenarioName;
  const scenarios = listScenarios();

  if (!scenarios.includes(name)) {
    res.status(404).json({ error: `Scenario '${name}' not found` });
    return;
  }

  res.json(getScenario(name));
});

// ========================================
// 音声テスト用エンドポイント
// ========================================

// 音声デバッグ状態
app.get("/api/debug/audio/status", (req, res) => {
  res.json({
    audioDebugEnabled: isAudioDebugEnabled(),
    info: isAudioDebugEnabled()
      ? "🎤 Audio debug enabled - audio files will be saved"
      : "Audio debug disabled. Set DEBUG_AUDIO=true to enable",
  });
});

// テスト用音声を生成してBase64で返す
app.get("/api/debug/audio/generate", (req, res) => {
  const type = (req.query.type as string) || "tone";
  const durationMs = parseInt((req.query.duration as string) || "1000", 10);
  const frequency = parseInt((req.query.frequency as string) || "440", 10);

  let pcm16: Buffer;

  if (type === "silence") {
    pcm16 = generateSilence(durationMs);
  } else {
    pcm16 = generateSineWave(frequency, durationMs, 0.3);
  }

  const base64 = pcm16ToBase64(pcm16);
  const info = inspectAudioData(pcm16);

  res.json({
    audioBase64: base64,
    info: {
      type,
      durationMs: info.durationMs,
      samples: info.samples,
      frequency: type === "tone" ? frequency : null,
    },
  });
});

// Base64音声データを分析
app.post("/api/debug/audio/analyze", express.json({ limit: "10mb" }), (req, res) => {
  const { audioBase64 } = req.body;

  if (!audioBase64) {
    res.status(400).json({ error: "audioBase64 is required" });
    return;
  }

  try {
    const info = AudioDebugger.analyzeBase64Audio(audioBase64);
    res.json(info);
  } catch (error) {
    res.status(400).json({ error: `Failed to analyze audio: ${error}` });
  }
});

// Serve index.html for SPA routes
app.use((req, res) => {
  // Try frontend build first
  const frontendIndex = path.join(publicPath, "index.html");
  const fallbackIndex = path.join(fallbackPath, "index.html");

  res.sendFile(frontendIndex, (err) => {
    if (err) {
      res.sendFile(fallbackIndex);
    }
  });
});

// Helper function to get participants based on pattern
function getParticipantsForPattern(pattern: InterviewPattern): Role[] {
  switch (pattern) {
    case "pattern1":
      // 営業(human) vs 学生(AI) - 出席確認・自己紹介練習
      return ["candidate", "human"];
    case "pattern2":
      // 営業(human) vs 学生(AI) vs 面接官(AI) - 面接本番
      return ["interviewer", "candidate", "human"];
    case "pattern3":
      // 営業(human) vs 面接官(AI) - 学生退席後のヒアリング
      return ["interviewer", "human"];
    default:
      return ["interviewer", "candidate", "human"];
  }
}

// WebSocket connection handler
wss.on("connection", (clientSocket) => {
  console.log("[Server] New client connected");

  let orchestrator: InterviewOrchestrator | null = null;

  // Wait for start_session message to create orchestrator with correct pattern
  const messageHandler = (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());

      // Handle start_session before orchestrator is created
      if (data.type === "start_session" && !orchestrator) {
        const pattern: InterviewPattern = data.pattern || "pattern2";
        const japaneseLevel: JapaneseLevel = data.japaneseLevel || "N4";
        const mode = data.mode || "step";
        const persona = data.persona; // ペルソナ設定（オプション）

        const patternConfig: PatternConfig = {
          pattern,
          japaneseLevel,
          participants: getParticipantsForPattern(pattern),
        };

        console.log(`[Server] ====== START SESSION ======`);
        console.log(`[Server] Pattern: ${pattern}`);
        console.log(`[Server] Japanese Level: ${japaneseLevel}`);
        console.log(`[Server] Mode: ${mode}`);
        console.log(`[Server] Participants: ${patternConfig.participants.join(", ")}`);
        if (persona) {
          console.log(`[Server] Persona: ${JSON.stringify(persona, null, 2)}`);
        }
        console.log(`[Server] ===========================`);

        // Create orchestrator with the actual pattern config and persona
        // Orchestrator will automatically start interview when AI connections are ready
        orchestrator = new InterviewOrchestrator(clientSocket, patternConfig, mode, persona);

        // Remove this handler since orchestrator now handles messages
        clientSocket.off("message", messageHandler);
      }
    } catch (error) {
      console.error("[Server] Failed to parse initial message:", error);
    }
  };

  clientSocket.on("message", messageHandler);
});

// Error handling
wss.on("error", (error) => {
  console.error("[Server] WebSocket server error:", error);
});

// Start server
server.listen(PORT, () => {
  const modeInfo = MOCK_MODE
    ? "🧪 MOCK MODE (OpenAI API not used)"
    : "🔴 PRODUCTION MODE (using real OpenAI API)";

  const audioDebugInfo = isAudioDebugEnabled()
    ? "🎤 AUDIO DEBUG ON"
    : "Audio debug off";

  console.log(`
===============================================
  AI Interview Simulation Server
===============================================

  ${modeInfo}
  ${audioDebugInfo}

  Server running at: http://localhost:${PORT}
  WebSocket endpoint: ws://localhost:${PORT}/ws

  Environment:
  - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "Set" : "Not set"}
  - MOCK_MODE: ${MOCK_MODE}
  - DEBUG_AUDIO: ${isAudioDebugEnabled()}

  Debug Endpoints:
  - GET /api/debug/status           - Server status
  - GET /api/debug/scenarios        - Available test scenarios
  - GET /api/debug/audio/status     - Audio debug status
  - GET /api/debug/audio/generate   - Generate test audio
  - POST /api/debug/audio/analyze   - Analyze audio data

  Audio Test Client:
  npx tsx src/audioTest/audioTestClient.ts --help

  To enable mock mode:
  MOCK_MODE=true npm run dev

  To enable audio debug:
  DEBUG_AUDIO=true npm run dev

===============================================
`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[Server] Shutting down...");
  wss.clients.forEach((client) => {
    client.close();
  });
  server.close(() => {
    console.log("[Server] Server closed");
    process.exit(0);
  });
});
