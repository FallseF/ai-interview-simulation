/**
 * 音声テスト用ユーティリティ
 *
 * 音声のエンコード/デコード、ファイル読み書きなどの
 * テスト用ヘルパー関数を提供
 */

import fs from "fs";
import path from "path";

// OpenAI Realtime APIの音声フォーマット
export const AUDIO_FORMAT = {
  sampleRate: 24000, // 24kHz
  channels: 1, // モノラル
  bitDepth: 16, // 16bit (PCM16)
};

/**
 * PCM16データをBase64にエンコード
 */
export function pcm16ToBase64(pcm16Buffer: Buffer): string {
  return pcm16Buffer.toString("base64");
}

/**
 * Base64をPCM16データにデコード
 */
export function base64ToPcm16(base64: string): Buffer {
  return Buffer.from(base64, "base64");
}

/**
 * Float32配列をPCM16 Bufferに変換
 * （フロントエンドの音声処理と同じロジック）
 */
export function float32ToPcm16(float32Array: Float32Array): Buffer {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return Buffer.from(pcm16.buffer);
}

/**
 * PCM16 BufferをFloat32配列に変換
 */
export function pcm16ToFloat32(pcm16Buffer: Buffer): Float32Array {
  const int16Array = new Int16Array(
    pcm16Buffer.buffer,
    pcm16Buffer.byteOffset,
    pcm16Buffer.length / 2
  );
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / (int16Array[i] < 0 ? 0x8000 : 0x7fff);
  }
  return float32Array;
}

/**
 * 無音のPCM16データを生成（テスト用）
 * @param durationMs ミリ秒
 */
export function generateSilence(durationMs: number): Buffer {
  const samples = Math.floor((AUDIO_FORMAT.sampleRate * durationMs) / 1000);
  const pcm16 = new Int16Array(samples);
  // 全て0（無音）
  return Buffer.from(pcm16.buffer);
}

/**
 * サイン波のPCM16データを生成（テスト用）
 * @param frequency 周波数 (Hz)
 * @param durationMs ミリ秒
 * @param amplitude 振幅 (0.0 - 1.0)
 */
export function generateSineWave(
  frequency: number,
  durationMs: number,
  amplitude = 0.5
): Buffer {
  const samples = Math.floor((AUDIO_FORMAT.sampleRate * durationMs) / 1000);
  const pcm16 = new Int16Array(samples);

  for (let i = 0; i < samples; i++) {
    const t = i / AUDIO_FORMAT.sampleRate;
    const value = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    pcm16[i] = Math.floor(value * 0x7fff);
  }

  return Buffer.from(pcm16.buffer);
}

/**
 * 音声データをWAVファイルとして保存
 */
export function saveAsWav(pcm16Buffer: Buffer, filePath: string): void {
  const wavHeader = createWavHeader(pcm16Buffer.length);
  const wavData = Buffer.concat([wavHeader, pcm16Buffer]);
  fs.writeFileSync(filePath, wavData);
}

/**
 * WAVヘッダーを生成
 */
function createWavHeader(dataLength: number): Buffer {
  const header = Buffer.alloc(44);

  // RIFF header
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);

  // fmt chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // chunk size
  header.writeUInt16LE(1, 20); // audio format (PCM)
  header.writeUInt16LE(AUDIO_FORMAT.channels, 22);
  header.writeUInt32LE(AUDIO_FORMAT.sampleRate, 24);
  header.writeUInt32LE(
    AUDIO_FORMAT.sampleRate * AUDIO_FORMAT.channels * (AUDIO_FORMAT.bitDepth / 8),
    28
  ); // byte rate
  header.writeUInt16LE(AUDIO_FORMAT.channels * (AUDIO_FORMAT.bitDepth / 8), 32); // block align
  header.writeUInt16LE(AUDIO_FORMAT.bitDepth, 34);

  // data chunk
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

/**
 * WAVファイルを読み込んでPCM16データを取得
 */
export function loadWavFile(filePath: string): Buffer {
  const wavData = fs.readFileSync(filePath);

  // WAVヘッダーをスキップ（44バイト）
  // 注意: これは標準的なWAVファイルを想定。拡張ヘッダーがある場合は要調整
  const dataOffset = 44;
  return wavData.subarray(dataOffset);
}

/**
 * PCM16データをチャンク分割（ストリーミング用）
 * @param pcm16Buffer 元のPCM16データ
 * @param chunkDurationMs 1チャンクあたりのミリ秒
 */
export function splitIntoChunks(
  pcm16Buffer: Buffer,
  chunkDurationMs: number
): Buffer[] {
  const samplesPerChunk = Math.floor(
    (AUDIO_FORMAT.sampleRate * chunkDurationMs) / 1000
  );
  const bytesPerChunk = samplesPerChunk * 2; // 16bit = 2bytes

  const chunks: Buffer[] = [];
  for (let offset = 0; offset < pcm16Buffer.length; offset += bytesPerChunk) {
    const end = Math.min(offset + bytesPerChunk, pcm16Buffer.length);
    chunks.push(pcm16Buffer.subarray(offset, end));
  }

  return chunks;
}

/**
 * 音声ファイルをBase64チャンクのリストに変換
 * （WebSocket経由で送信する形式）
 */
export function audioFileToBase64Chunks(
  filePath: string,
  chunkDurationMs = 100
): string[] {
  const pcm16 = loadWavFile(filePath);
  const chunks = splitIntoChunks(pcm16, chunkDurationMs);
  return chunks.map((chunk) => pcm16ToBase64(chunk));
}

/**
 * デバッグ用: 音声データの情報を表示
 */
export function inspectAudioData(pcm16Buffer: Buffer): {
  durationMs: number;
  samples: number;
  maxAmplitude: number;
  rms: number;
  isSilent: boolean;
} {
  const samples = pcm16Buffer.length / 2;
  const durationMs = (samples / AUDIO_FORMAT.sampleRate) * 1000;

  const int16Array = new Int16Array(
    pcm16Buffer.buffer,
    pcm16Buffer.byteOffset,
    samples
  );

  let maxAmplitude = 0;
  let sumSquares = 0;

  for (let i = 0; i < int16Array.length; i++) {
    const abs = Math.abs(int16Array[i]);
    if (abs > maxAmplitude) maxAmplitude = abs;
    sumSquares += int16Array[i] * int16Array[i];
  }

  const rms = Math.sqrt(sumSquares / samples);
  const isSilent = rms < 100; // しきい値

  return {
    durationMs: Math.round(durationMs),
    samples,
    maxAmplitude,
    rms: Math.round(rms),
    isSilent,
  };
}

/**
 * テスト用の音声データディレクトリ
 */
export const TEST_AUDIO_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../../testAudio"
);

/**
 * テスト用音声ディレクトリを初期化
 */
export function ensureTestAudioDir(): void {
  if (!fs.existsSync(TEST_AUDIO_DIR)) {
    fs.mkdirSync(TEST_AUDIO_DIR, { recursive: true });
  }
}
