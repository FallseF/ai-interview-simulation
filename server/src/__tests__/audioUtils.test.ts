/**
 * 音声ユーティリティのテスト
 *
 * PCM16/Float32変換、Base64エンコード/デコードなど
 * 音声処理の正確性を確認する
 */

import { describe, it, expect } from "vitest";
import {
  pcm16ToBase64,
  base64ToPcm16,
  float32ToPcm16,
  pcm16ToFloat32,
  generateSilence,
  generateSineWave,
  splitIntoChunks,
  inspectAudioData,
  AUDIO_FORMAT,
} from "../audioTest/audioUtils.js";

describe("Audio Encoding/Decoding", () => {
  describe("Base64 conversion", () => {
    it("should encode and decode PCM16 data correctly", () => {
      const original = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe]);
      const base64 = pcm16ToBase64(original);
      const decoded = base64ToPcm16(base64);

      expect(decoded).toEqual(original);
    });

    it("should handle empty buffer", () => {
      const original = Buffer.alloc(0);
      const base64 = pcm16ToBase64(original);
      const decoded = base64ToPcm16(base64);

      expect(decoded.length).toBe(0);
    });

    it("should handle large buffer", () => {
      // 1秒分のデータ (24000 samples * 2 bytes)
      const original = generateSineWave(440, 1000);
      const base64 = pcm16ToBase64(original);
      const decoded = base64ToPcm16(base64);

      expect(decoded).toEqual(original);
    });
  });

  describe("Float32 <-> PCM16 conversion", () => {
    it("should convert Float32 to PCM16 and back", () => {
      const float32 = new Float32Array([0, 0.5, -0.5, 1.0, -1.0]);
      const pcm16 = float32ToPcm16(float32);
      const restored = pcm16ToFloat32(pcm16);

      // 量子化誤差があるので近似比較
      for (let i = 0; i < float32.length; i++) {
        expect(restored[i]).toBeCloseTo(float32[i], 3);
      }
    });

    it("should clamp values outside [-1, 1]", () => {
      const float32 = new Float32Array([2.0, -2.0]);
      const pcm16 = float32ToPcm16(float32);
      const restored = pcm16ToFloat32(pcm16);

      expect(restored[0]).toBeCloseTo(1.0, 3);
      expect(restored[1]).toBeCloseTo(-1.0, 3);
    });

    it("should handle zero (silence)", () => {
      const float32 = new Float32Array([0, 0, 0, 0]);
      const pcm16 = float32ToPcm16(float32);
      const restored = pcm16ToFloat32(pcm16);

      for (let i = 0; i < restored.length; i++) {
        expect(restored[i]).toBe(0);
      }
    });
  });
});

describe("Audio Generation", () => {
  describe("generateSilence", () => {
    it("should generate correct duration", () => {
      const durationMs = 500;
      const buffer = generateSilence(durationMs);

      const expectedSamples = Math.floor((AUDIO_FORMAT.sampleRate * durationMs) / 1000);
      expect(buffer.length).toBe(expectedSamples * 2); // 16bit = 2 bytes
    });

    it("should generate zero values (silence)", () => {
      const buffer = generateSilence(100);
      const int16 = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

      for (let i = 0; i < int16.length; i++) {
        expect(int16[i]).toBe(0);
      }
    });
  });

  describe("generateSineWave", () => {
    it("should generate correct duration", () => {
      const durationMs = 1000;
      const buffer = generateSineWave(440, durationMs);

      const expectedSamples = Math.floor((AUDIO_FORMAT.sampleRate * durationMs) / 1000);
      expect(buffer.length).toBe(expectedSamples * 2);
    });

    it("should have non-zero values", () => {
      const buffer = generateSineWave(440, 100);
      const int16 = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

      let hasNonZero = false;
      for (let i = 0; i < int16.length; i++) {
        if (int16[i] !== 0) {
          hasNonZero = true;
          break;
        }
      }
      expect(hasNonZero).toBe(true);
    });

    it("should respect amplitude", () => {
      const amplitude = 0.5;
      const buffer = generateSineWave(440, 100, amplitude);
      const int16 = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);

      let maxVal = 0;
      for (let i = 0; i < int16.length; i++) {
        if (Math.abs(int16[i]) > maxVal) {
          maxVal = Math.abs(int16[i]);
        }
      }

      // 最大値は amplitude * 0x7fff 付近のはず
      const expectedMax = amplitude * 0x7fff;
      expect(maxVal).toBeCloseTo(expectedMax, -2); // 100程度の誤差許容
    });
  });
});

describe("Audio Chunking", () => {
  it("should split audio into correct number of chunks", () => {
    // 1秒の音声を100msずつに分割
    const buffer = generateSineWave(440, 1000);
    const chunks = splitIntoChunks(buffer, 100);

    expect(chunks.length).toBe(10);
  });

  it("should preserve total data when recombined", () => {
    const original = generateSineWave(440, 500);
    const chunks = splitIntoChunks(original, 100);
    const recombined = Buffer.concat(chunks);

    expect(recombined.length).toBe(original.length);
    expect(recombined).toEqual(original);
  });

  it("should handle odd-sized data", () => {
    // 117msのデータを50msチャンクに分割
    const buffer = generateSineWave(440, 117);
    const chunks = splitIntoChunks(buffer, 50);

    const recombined = Buffer.concat(chunks);
    expect(recombined.length).toBe(buffer.length);
  });
});

describe("Audio Inspection", () => {
  it("should detect silence", () => {
    const silence = generateSilence(100);
    const info = inspectAudioData(silence);

    expect(info.isSilent).toBe(true);
    expect(info.maxAmplitude).toBe(0);
    expect(info.rms).toBe(0);
  });

  it("should detect non-silent audio", () => {
    const tone = generateSineWave(440, 100, 0.5);
    const info = inspectAudioData(tone);

    expect(info.isSilent).toBe(false);
    expect(info.maxAmplitude).toBeGreaterThan(0);
    expect(info.rms).toBeGreaterThan(0);
  });

  it("should report correct duration", () => {
    const durationMs = 250;
    const buffer = generateSineWave(440, durationMs);
    const info = inspectAudioData(buffer);

    expect(info.durationMs).toBeCloseTo(durationMs, -1); // 10ms程度の誤差許容
  });

  it("should report correct sample count", () => {
    const durationMs = 100;
    const buffer = generateSilence(durationMs);
    const info = inspectAudioData(buffer);

    const expectedSamples = Math.floor((AUDIO_FORMAT.sampleRate * durationMs) / 1000);
    expect(info.samples).toBe(expectedSamples);
  });
});
