/**
 * 音声テストクライアント
 *
 * コマンドラインから音声ファイルを送信して、
 * 音声認識・応答のフローをテストできる
 *
 * 使い方:
 *   npx tsx src/audioTest/audioTestClient.ts [オプション]
 *
 * オプション:
 *   --file <path>    送信する音声ファイル（WAV形式、24kHz、モノラル）
 *   --generate       テスト用音声を自動生成して送信
 *   --text <text>    テキストを送信（音声の代わり）
 *   --target <target> 送信先 (interviewer/candidate/both) デフォルト: both
 *   --mode <mode>    面接モード (step/auto) デフォルト: step
 */

import WebSocket from "ws";
import {
  generateSineWave,
  generateSilence,
  pcm16ToBase64,
  splitIntoChunks,
  loadWavFile,
  inspectAudioData,
  saveAsWav,
  ensureTestAudioDir,
  TEST_AUDIO_DIR,
} from "./audioUtils.js";
import path from "path";

interface Options {
  file?: string;
  generate?: boolean;
  text?: string;
  target: "interviewer" | "candidate" | "both";
  mode: "step" | "auto";
  serverUrl: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    target: "both",
    mode: "step",
    serverUrl: "ws://localhost:3000/ws",
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--file":
        options.file = args[++i];
        break;
      case "--generate":
        options.generate = true;
        break;
      case "--text":
        options.text = args[++i];
        break;
      case "--target":
        options.target = args[++i] as Options["target"];
        break;
      case "--mode":
        options.mode = args[++i] as Options["mode"];
        break;
      case "--server":
        options.serverUrl = args[++i];
        break;
      case "--help":
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
音声テストクライアント

使い方:
  npx tsx src/audioTest/audioTestClient.ts [オプション]

オプション:
  --file <path>      送信する音声ファイル（WAV形式、24kHz、モノラル）
  --generate         テスト用音声を自動生成して送信
  --text <text>      テキストを送信（音声の代わり）
  --target <target>  送信先 (interviewer/candidate/both) デフォルト: both
  --mode <mode>      面接モード (step/auto) デフォルト: step
  --server <url>     サーバーURL デフォルト: ws://localhost:3000/ws
  --help             このヘルプを表示

例:
  # テスト音声を生成して送信
  npx tsx src/audioTest/audioTestClient.ts --generate

  # 音声ファイルを送信
  npx tsx src/audioTest/audioTestClient.ts --file test.wav

  # テキストを送信
  npx tsx src/audioTest/audioTestClient.ts --text "こんにちは"

  # autoモードで実行
  npx tsx src/audioTest/audioTestClient.ts --generate --mode auto
`);
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log("🎤 音声テストクライアント起動");
  console.log("-----------------------------");
  console.log(`サーバー: ${options.serverUrl}`);
  console.log(`モード: ${options.mode}`);
  console.log(`ターゲット: ${options.target}`);

  // WebSocket接続
  const ws = new WebSocket(options.serverUrl);

  const messages: Array<Record<string, unknown>> = [];

  ws.on("open", () => {
    console.log("\n✅ サーバーに接続しました");

    // セッション開始
    ws.send(JSON.stringify({ type: "start_session", mode: options.mode }));
  });

  ws.on("message", async (data) => {
    const msg = JSON.parse(data.toString());
    messages.push(msg);

    // メッセージの種類に応じて表示
    switch (msg.type) {
      case "session_ready":
        console.log("\n📍 セッション準備完了");

        // 少し待ってから入力を送信
        await sleep(500);

        if (options.text) {
          sendText(ws, options.target, options.text);
        } else if (options.file) {
          await sendAudioFile(ws, options.target, options.file);
        } else if (options.generate) {
          await sendGeneratedAudio(ws, options.target);
        } else {
          console.log("\n📝 オプションが指定されていません。--help を参照してください。");
          ws.close();
        }
        break;

      case "transcript_delta":
        process.stdout.write(msg.textDelta);
        break;

      case "transcript_done":
        console.log(`\n\n💬 [${msg.speaker}] ${msg.text}`);
        break;

      case "audio_delta":
        process.stdout.write("🔊");
        break;

      case "audio_done":
        console.log(" (音声完了)");
        break;

      case "turn_state":
        console.log(`\n📍 ターン: ${msg.currentSpeaker}, 待機: ${msg.waitingForNext}`);

        // stepモードで待機中なら次のターンへ
        if (options.mode === "step" && msg.waitingForNext) {
          await sleep(1000);
          console.log("➡️ 次のターンへ");
          ws.send(JSON.stringify({ type: "next_turn" }));
        }
        break;

      case "phase_change":
        if (msg.phase === "ended") {
          console.log("\n✅ 面接終了");
          await sleep(1000);
          ws.close();
        }
        break;

      case "error":
        console.error(`\n❌ エラー: ${msg.message}`);
        break;
    }
  });

  ws.on("close", () => {
    console.log("\n👋 接続を終了しました");
    console.log(`\n受信メッセージ数: ${messages.length}`);
    process.exit(0);
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocketエラー:", err.message);
    process.exit(1);
  });
}

function sendText(
  ws: WebSocket,
  target: Options["target"],
  text: string
): void {
  console.log(`\n📤 テキスト送信: "${text}"`);
  ws.send(
    JSON.stringify({
      type: "human_text",
      target,
      text,
    })
  );
}

async function sendAudioFile(
  ws: WebSocket,
  target: Options["target"],
  filePath: string
): Promise<void> {
  console.log(`\n📂 音声ファイル読み込み: ${filePath}`);

  try {
    const pcm16 = loadWavFile(filePath);
    const info = inspectAudioData(pcm16);
    console.log(`   長さ: ${info.durationMs}ms, サンプル数: ${info.samples}`);
    console.log(`   最大振幅: ${info.maxAmplitude}, RMS: ${info.rms}`);
    console.log(`   無音: ${info.isSilent ? "はい" : "いいえ"}`);

    await sendAudioBuffer(ws, target, pcm16);
  } catch (err) {
    console.error(`❌ ファイル読み込みエラー: ${err}`);
  }
}

async function sendGeneratedAudio(
  ws: WebSocket,
  target: Options["target"]
): Promise<void> {
  console.log("\n🔧 テスト用音声を生成中...");

  // 短い無音 + サイン波 + 無音（簡単なテストパターン）
  const silence1 = generateSilence(200);
  const tone = generateSineWave(440, 500, 0.3); // 440Hz, 500ms
  const silence2 = generateSilence(200);

  const combined = Buffer.concat([silence1, tone, silence2]);

  const info = inspectAudioData(combined);
  console.log(`   生成: ${info.durationMs}ms, 440Hzサイン波`);

  // デバッグ用にファイルにも保存
  ensureTestAudioDir();
  const debugPath = path.join(TEST_AUDIO_DIR, "generated_test.wav");
  saveAsWav(combined, debugPath);
  console.log(`   保存: ${debugPath}`);

  await sendAudioBuffer(ws, target, combined);
}

async function sendAudioBuffer(
  ws: WebSocket,
  target: Options["target"],
  pcm16: Buffer
): Promise<void> {
  console.log("\n📤 音声送信開始...");

  // チャンクに分割（100msごと）
  const chunks = splitIntoChunks(pcm16, 100);
  console.log(`   チャンク数: ${chunks.length}`);

  // チャンクを順番に送信
  for (let i = 0; i < chunks.length; i++) {
    const base64 = pcm16ToBase64(chunks[i]);
    ws.send(
      JSON.stringify({
        type: "human_audio_chunk",
        target,
        audioBase64: base64,
      })
    );
    process.stdout.write(".");

    // リアルな間隔でストリーミング
    await sleep(50);
  }

  console.log("\n   送信完了、コミット中...");

  // 音声送信完了を通知
  ws.send(
    JSON.stringify({
      type: "human_audio_commit",
      target,
    })
  );

  console.log("✅ 音声コミット完了");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 実行
main().catch(console.error);
