/**
 * 音声デバッグヘルパー
 *
 * 受信した音声データを保存・分析するためのヘルパークラス
 * DEBUG_AUDIO=true で有効化
 */

import fs from "fs";
import path from "path";
import {
  base64ToPcm16,
  saveAsWav,
  inspectAudioData,
  ensureTestAudioDir,
  TEST_AUDIO_DIR,
} from "./audioUtils.js";

export const AUDIO_DEBUG = process.env.DEBUG_AUDIO === "true";

export class AudioDebugger {
  private sessionId: string;
  private audioChunks: Map<string, Buffer[]> = new Map();
  private enabled: boolean;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || Date.now().toString();
    this.enabled = AUDIO_DEBUG;

    if (this.enabled) {
      ensureTestAudioDir();
      console.log(`[AudioDebugger] 🔧 Debug enabled, session: ${this.sessionId}`);
    }
  }

  /**
   * 受信した音声チャンクを記録
   */
  recordChunk(source: string, audioBase64: string): void {
    if (!this.enabled) return;

    const pcm16 = base64ToPcm16(audioBase64);

    if (!this.audioChunks.has(source)) {
      this.audioChunks.set(source, []);
    }
    this.audioChunks.get(source)!.push(pcm16);

    console.log(`[AudioDebugger] Recorded chunk from ${source}: ${pcm16.length} bytes`);
  }

  /**
   * 記録した音声をファイルに保存
   */
  saveRecordedAudio(source: string, suffix = ""): string | null {
    if (!this.enabled) return null;

    const chunks = this.audioChunks.get(source);
    if (!chunks || chunks.length === 0) {
      console.log(`[AudioDebugger] No audio to save for ${source}`);
      return null;
    }

    const combined = Buffer.concat(chunks);
    const filename = `${this.sessionId}_${source}${suffix}.wav`;
    const filePath = path.join(TEST_AUDIO_DIR, filename);

    saveAsWav(combined, filePath);

    const info = inspectAudioData(combined);
    console.log(`[AudioDebugger] Saved ${source} audio:`);
    console.log(`   File: ${filePath}`);
    console.log(`   Duration: ${info.durationMs}ms`);
    console.log(`   Samples: ${info.samples}`);
    console.log(`   Silent: ${info.isSilent}`);

    return filePath;
  }

  /**
   * 全ての記録を保存
   */
  saveAll(): string[] {
    if (!this.enabled) return [];

    const savedFiles: string[] = [];
    for (const source of this.audioChunks.keys()) {
      const file = this.saveRecordedAudio(source);
      if (file) savedFiles.push(file);
    }
    return savedFiles;
  }

  /**
   * 記録をクリア
   */
  clear(source?: string): void {
    if (source) {
      this.audioChunks.delete(source);
    } else {
      this.audioChunks.clear();
    }
  }

  /**
   * Base64音声データを分析
   */
  static analyzeBase64Audio(audioBase64: string): ReturnType<typeof inspectAudioData> {
    const pcm16 = base64ToPcm16(audioBase64);
    return inspectAudioData(pcm16);
  }

  /**
   * Base64音声データをファイルに保存（ワンショット）
   */
  static saveBase64ToFile(audioBase64: string, filename: string): string {
    ensureTestAudioDir();
    const pcm16 = base64ToPcm16(audioBase64);
    const filePath = path.join(TEST_AUDIO_DIR, filename);
    saveAsWav(pcm16, filePath);
    return filePath;
  }
}

/**
 * 音声デバッグが有効かどうか
 */
export function isAudioDebugEnabled(): boolean {
  return AUDIO_DEBUG;
}
