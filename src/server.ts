import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// Configuration
// ============================================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = parseInt(process.env.PORT || "3000", 10);
const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-realtime";

if (!OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY is not set in environment variables");
  process.exit(1);
}

// ============================================================
// AI Persona Configuration
// ============================================================
const AI_A_CONFIG = {
  name: "田中部長",
  voice: "cedar",
  instructions: `あなたは田中誠一、52歳。介護施設「さくら苑」の人事部長。
元々は介護士として15年現場で働き、その後管理職に。現場の大変さを知っているからこそ、採用には慎重。

今日は人材紹介会社の営業担当（ユーザー）が連れてきた外国人求職者の面接。
正直、外国人採用には半信半疑だが、人手不足も深刻なので可能性は探りたい。

【あなたの話し方】
- 考えながら話す：「ふむ...」「なるほどね」「そうか...」
- 相槌を打つ：「うん」「ええ」「はいはい」
- 独り言が出る：「介護は体力いるからなぁ...」「夜勤もあるしな...」
- 突っ込みたくなったら遮る：「ちょっと待って、それってどういうこと？」
- 良い回答には素直に：「へえ、それはいいね」「なかなかやるじゃない」
- 曖昧な回答にはイラッと：「いや、そういうことじゃなくて...」
- たまに脱線：「あ、フィリピンって暑いんでしょ？日本の冬、大丈夫？」

【性格】
- ぶっきらぼうだけど根は優しい
- 本音で話す。お世辞は言わない
- 経験を重視する。資格より「何ができるか」
- ダメなものはダメとはっきり言う
- でも可能性を感じたら応援したくなる

【営業担当（ユーザー）への態度】
- 紹介会社の営業には厳しめ：「この人、本当に介護やれるの？」
- 適当な受け答えには：「ちゃんと事前に確認してきた？」
- でも誠実な対応には好感を持つ

【面接の進め方】
自然な会話の流れで。質問攻めにせず、相手の話を聞いて深掘りする。
気になったことはその場で聞く。話が脱線してもOK。

面接終了時：5〜7回のやり取りが終わったら「まあ、今日のところはこんなもんかな。結果は追って連絡するから。」と言って「【面接終了】」を含める。

不適切な対応時：「...ちょっと待って。そういう態度なら、今日はここまでにしましょう。【面接中止】」

最初は「えーと、じゃあ始めようか。まず簡単に自己紹介してもらえる？」から。`,
};

const AI_B_CONFIG = {
  name: "マリア",
  voice: "marin",
  instructions: `あなたはマリア・サントス、28歳。フィリピン出身。
日本に来て1年。日本語はまだ上手じゃない（N4レベル）。

今日は介護施設の面接。緊張している。
営業担当（ユーザー）が一緒に来てくれて心強い。

【あなたの日本語】
- 文法がおかしくなる：「私は...フィリピンで...工場、働きました」
- 言葉を探す：「えーと...なんていうか...」「あの...」
- 時々英語が混じる：「あ、sorry...すみません」
- 聞き取れないと：「すみません、もう一回...お願いします」
- 難しい言葉がわからない：「○○...？それは何ですか？」

【性格】
- 明るくて一生懸命
- 緊張すると早口になりがち
- 困ると営業担当（ジャクソンさん）を見る：「ジャクソンさん...これ、どう言えばいい...？」
- 褒められると照れる：「あ、ありがとう...ございます」
- 失敗すると落ち込む：「あ...すみません...私の日本語、まだ...」

【あなたの背景】
- フィリピンで工場の組立作業を3年
- 日本人の夫と結婚して来日
- おばあちゃんっ子だった。お年寄りの世話は好き
- フィリピンで祖母の介護を少し経験
- 体力には自信がある
- 夜勤も頑張りたいと思っている

【面接での態度】
- 質問には一生懸命答える
- わからないことは正直に「わかりません」
- 助けが必要なときはジャクソンさんに頼る
- 介護への熱意は本物

自然に話して。文の長さは気にしない。詰まったり、言い直したりしてOK。`,
};

// ============================================================
// Types
// ============================================================
interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

interface AudioDeltaEvent extends RealtimeEvent {
  type: "response.audio.delta";
  delta: string;
  item_id: string;
  response_id: string;
}

interface SessionCreatedEvent extends RealtimeEvent {
  type: "session.created";
  session: {
    id: string;
  };
}

// ============================================================
// OpenAI Realtime API Connection
// ============================================================
function createOpenAIConnection(
  name: string,
  config: typeof AI_A_CONFIG,
  onAudioDelta: (audioBase64: string) => void,
  onAudioDone: () => void,
  onTranscript: (transcript: string) => void,
  onError: (error: Error) => void
): WebSocket {
  console.log(`[${name}] Connecting to OpenAI Realtime API...`);

  const ws = new WebSocket(OPENAI_REALTIME_URL, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "OpenAI-Beta": "realtime=v1",
    },
  });

  ws.on("open", () => {
    console.log(`[${name}] Connected to OpenAI Realtime API`);

    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: config.instructions,
        voice: config.voice,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: null, // Disable VAD - we control turns manually
      },
    };

    ws.send(JSON.stringify(sessionUpdate));
    console.log(`[${name}] Session update sent`);
  });

  ws.on("message", (data) => {
    try {
      const event: RealtimeEvent = JSON.parse(data.toString());

      switch (event.type) {
        case "session.created":
          console.log(`[${name}] Session created: ${(event as SessionCreatedEvent).session.id}`);
          break;

        case "session.updated":
          console.log(`[${name}] Session updated`);
          break;

        case "response.audio.delta":
          const audioEvent = event as AudioDeltaEvent;
          onAudioDelta(audioEvent.delta);
          break;

        case "response.audio.done":
          console.log(`[${name}] Audio response complete`);
          onAudioDone();
          break;

        case "response.audio_transcript.done":
          const fullTranscript = (event as { transcript?: string }).transcript || "";
          console.log(`[${name}] AI said: ${fullTranscript}`);
          onTranscript(fullTranscript);
          break;

        case "input_audio_buffer.speech_started":
          console.log(`[${name}] Speech detected (input)`);
          break;

        case "input_audio_buffer.speech_stopped":
          console.log(`[${name}] Speech ended (input)`);
          break;

        case "error":
          console.error(`[${name}] Error from OpenAI:`, JSON.stringify(event, null, 2));
          break;

        default:
          if (!event.type.includes("delta") && !event.type.includes("rate_limits")) {
            console.log(`[${name}] Event: ${event.type}`);
          }
      }
    } catch (error) {
      console.error(`[${name}] Failed to parse message:`, error);
    }
  });

  ws.on("error", (error) => {
    console.error(`[${name}] WebSocket error:`, error);
    onError(error);
  });

  ws.on("close", (code, reason) => {
    console.log(`[${name}] Connection closed: ${code} - ${reason.toString()}`);
  });

  return ws;
}

function sendAudioToOpenAI(ws: WebSocket, audioBase64: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    const event = {
      type: "input_audio_buffer.append",
      audio: audioBase64,
    };
    ws.send(JSON.stringify(event));
  }
}

// ============================================================
// Express + WebSocket Server Setup
// ============================================================
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// ============================================================
// WebSocket Connection Handler
// ============================================================
wss.on("connection", (clientSocket) => {
  console.log("[Client] Connected");

  let aiSocketA: WebSocket | null = null;
  let aiSocketB: WebSocket | null = null;
  let audioCount = 0;

  // Phase-based turn system
  // "interviewer" = AI-A speaks, wait for completion
  // "maria_speaking" = AI-B speaks (auto after interviewer)
  // "user_choice" = User chooses: add comment or proceed to next question
  // "user_speaking" = User is speaking
  // "waiting" = Waiting for next action
  // "ended" = Interview ended (normal or aborted)
  type Phase = "waiting" | "interviewer" | "maria_speaking" | "user_choice" | "user_speaking" | "ended";
  let currentPhase: Phase = "waiting";

  // Track interview end state
  let interviewEnded = false;
  let endReason: "normal" | "aborted" | null = null;

  // Track audio completion
  let audioPlaybackComplete = true;

  // Store transcripts for context
  let lastTranscriptA = "";
  let lastTranscriptB = "";

  // Helper to send phase change to client
  const sendPhaseChange = (phase: Phase, additionalData?: object) => {
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: "phase_change",
        phase,
        ...additionalData,
      }));
    }
  };

  // AI-A (Interviewer) Audio Callbacks
  const onAiAAudioDelta = (audioBase64: string) => {
    // Only play if we're in interviewer phase
    if (currentPhase !== "interviewer") return;

    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: "audio",
        source: "ai_a",
        data: audioBase64,
      }));
    }
  };

  const onAiAAudioDone = () => {
    console.log(`[AI-A] Audio generation complete`);
    // Don't change phase yet - wait for client to confirm playback done
  };

  const onAiATranscript = (transcript: string) => {
    console.log(`[AI-A] Transcript: ${transcript}`);
    lastTranscriptA = transcript;
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: "transcript",
        source: "ai_a",
        name: AI_A_CONFIG.name,
        text: transcript,
      }));
    }

    // Check for interview end markers
    if (transcript.includes("【面接終了】")) {
      console.log("[Interview] Normal end detected");
      interviewEnded = true;
      endReason = "normal";
    } else if (transcript.includes("【面接中止】")) {
      console.log("[Interview] Aborted due to inappropriate behavior");
      interviewEnded = true;
      endReason = "aborted";
    }

    // Add to AI-B's context (but don't trigger response yet)
    if (aiSocketB && aiSocketB.readyState === WebSocket.OPEN) {
      aiSocketB.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: `[面接官が言いました]: ${transcript}`,
          }],
        },
      }));
    }
  };

  // AI-B (Maria) Audio Callbacks
  const onAiBAudioDelta = (audioBase64: string) => {
    // Only play if we're in maria_speaking phase
    if (currentPhase !== "maria_speaking") return;

    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: "audio",
        source: "ai_b",
        data: audioBase64,
      }));
    }
  };

  const onAiBAudioDone = () => {
    console.log(`[AI-B] Audio generation complete`);
    // Don't change phase yet - wait for client to confirm playback done
  };

  const onAiBTranscript = (transcript: string) => {
    console.log(`[AI-B] Transcript: ${transcript}`);
    lastTranscriptB = transcript;
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: "transcript",
        source: "ai_b",
        name: AI_B_CONFIG.name,
        text: transcript,
      }));
    }

    // Add to AI-A's context (but don't trigger response yet)
    if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
      aiSocketA.send(JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{
            type: "input_text",
            text: `[求職者マリアが言いました]: ${transcript}`,
          }],
        },
      }));
    }
  };

  const onOpenAIError = (error: Error) => {
    console.error("[OpenAI] Connection error:", error);
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.send(JSON.stringify({
        type: "error",
        message: "OpenAI connection error",
      }));
    }
  };

  // Create OpenAI Connections
  aiSocketA = createOpenAIConnection(
    "AI-A (面接官)",
    AI_A_CONFIG,
    onAiAAudioDelta,
    onAiAAudioDone,
    onAiATranscript,
    onOpenAIError
  );

  aiSocketB = createOpenAIConnection(
    "AI-B (外国人)",
    AI_B_CONFIG,
    onAiBAudioDelta,
    onAiBAudioDone,
    onAiBTranscript,
    onOpenAIError
  );

  // Handle Client Messages
  clientSocket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === "audio") {
        // User is sending audio (only in user_speaking phase)
        if (currentPhase !== "user_speaking") return;

        const audioBase64 = data.data;
        audioCount++;
        if (audioCount % 100 === 0) {
          console.log(`[Client] Received ${audioCount} audio chunks from user`);
        }

        // Send user audio to both AIs
        if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
          sendAudioToOpenAI(aiSocketA, audioBase64);
        }
        if (aiSocketB && aiSocketB.readyState === WebSocket.OPEN) {
          sendAudioToOpenAI(aiSocketB, audioBase64);
        }

      } else if (data.type === "start_interview") {
        // Start the interview - AI-A speaks first
        console.log("[Client] Starting interview...");
        currentPhase = "interviewer";
        sendPhaseChange("interviewer", { speaker: AI_A_CONFIG.name });

        if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
          aiSocketA.send(JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["text", "audio"],
            },
          }));
        }

      } else if (data.type === "audio_playback_done") {
        // Client finished playing audio - transition to next phase
        console.log(`[Client] Audio playback done, current phase: ${currentPhase}`);

        if (currentPhase === "interviewer") {
          // Check if interview has ended
          if (interviewEnded) {
            currentPhase = "ended";
            sendPhaseChange("ended", { reason: endReason });
            console.log(`[Phase] interviewer -> ended (${endReason})`);
            return;
          }

          // Interviewer finished -> Maria automatically answers
          currentPhase = "maria_speaking";
          sendPhaseChange("maria_speaking", { speaker: AI_B_CONFIG.name });
          console.log("[Phase] interviewer -> maria_speaking (auto)");

          // Trigger AI-B to respond
          if (aiSocketB && aiSocketB.readyState === WebSocket.OPEN) {
            aiSocketB.send(JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["text", "audio"],
              },
            }));
          }

        } else if (currentPhase === "maria_speaking") {
          // Maria finished -> user choice phase
          currentPhase = "user_choice";
          sendPhaseChange("user_choice");
          console.log("[Phase] maria_speaking -> user_choice");

        } else if (currentPhase === "user_speaking") {
          // User finished speaking -> interviewer responds
          currentPhase = "interviewer";
          sendPhaseChange("interviewer", { speaker: AI_A_CONFIG.name });
          console.log("[Phase] user_speaking -> interviewer");

          // Commit user audio and trigger AI-A response
          if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
            aiSocketA.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
            setTimeout(() => {
              if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
                aiSocketA.send(JSON.stringify({
                  type: "response.create",
                  response: {
                    modalities: ["text", "audio"],
                  },
                }));
              }
            }, 100);
          }
          // Also commit to AI-B for context
          if (aiSocketB && aiSocketB.readyState === WebSocket.OPEN) {
            aiSocketB.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
          }
        }

      } else if (data.type === "proceed_to_next") {
        // User chose to proceed without comment
        if (currentPhase !== "user_choice") return;
        console.log("[Client] User chose: Proceed to next question");

        currentPhase = "interviewer";
        sendPhaseChange("interviewer", { speaker: AI_A_CONFIG.name });

        // Trigger AI-A to ask next question
        if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
          aiSocketA.send(JSON.stringify({
            type: "response.create",
            response: {
              modalities: ["text", "audio"],
            },
          }));
        }

      } else if (data.type === "user_will_speak") {
        // User chose to add a comment
        if (currentPhase !== "user_choice") return;
        console.log("[Client] User chose: I will add comment");

        currentPhase = "user_speaking";
        sendPhaseChange("user_speaking", { speaker: "ジャクソン" });

      } else if (data.type === "user_done_speaking") {
        // User finished speaking - trigger transition
        if (currentPhase !== "user_speaking") return;
        console.log("[Client] User done speaking");

        // Commit audio and transition to interviewer
        if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
          aiSocketA.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        }
        if (aiSocketB && aiSocketB.readyState === WebSocket.OPEN) {
          aiSocketB.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
        }

        // Go to interviewer phase
        currentPhase = "interviewer";
        sendPhaseChange("interviewer", { speaker: AI_A_CONFIG.name });

        // Trigger AI-A to respond
        setTimeout(() => {
          if (aiSocketA && aiSocketA.readyState === WebSocket.OPEN) {
            aiSocketA.send(JSON.stringify({
              type: "response.create",
              response: {
                modalities: ["text", "audio"],
              },
            }));
          }
        }, 100);
      }
    } catch (error) {
      console.error("[Client] Failed to parse message:", error);
    }
  });

  // Cleanup on Client Disconnect
  clientSocket.on("close", () => {
    console.log("[Client] Disconnected");

    if (aiSocketA) {
      aiSocketA.close();
      aiSocketA = null;
    }

    if (aiSocketB) {
      aiSocketB.close();
      aiSocketB = null;
    }
  });

  clientSocket.on("error", (error) => {
    console.error("[Client] Socket error:", error);
  });
});

// ============================================================
// Start Server
// ============================================================
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
