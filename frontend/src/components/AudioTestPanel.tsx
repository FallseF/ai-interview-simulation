/**
 * 音声テストパネル
 *
 * 開発時に音声周りのテストを行うためのUI
 * マイク入力の代わりに、生成した音声やファイルを送信できる
 */

import { useState, useCallback, useRef } from "react";
import type { Target } from "../types/ws";

interface AudioTestPanelProps {
  target: Target;
  onAudioChunk: (target: Target, audioBase64: string) => void;
  onCommit: (target: Target) => void;
  onStartSpeaking: () => void;
  disabled?: boolean;
}

interface ServerStatus {
  mockMode: boolean;
  audioDebugEnabled: boolean;
  availableScenarios: string[];
}

export function AudioTestPanel({
  target,
  onAudioChunk,
  onCommit,
  onStartSpeaking,
  disabled = false,
}: AudioTestPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ログを追加
  const addLog = useCallback((message: string) => {
    setLog((prev) => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  }, []);

  // サーバー状態を取得
  const fetchStatus = useCallback(async () => {
    try {
      const [statusRes, audioRes] = await Promise.all([
        fetch("/api/debug/status"),
        fetch("/api/debug/audio/status"),
      ]);
      const status = await statusRes.json();
      const audioStatus = await audioRes.json();

      setServerStatus({
        mockMode: status.mockMode,
        audioDebugEnabled: audioStatus.audioDebugEnabled,
        availableScenarios: status.availableScenarios,
      });
      addLog("サーバー状態を取得しました");
    } catch (error) {
      addLog(`エラー: ${error}`);
    }
  }, [addLog]);

  // パネルを展開したときに状態を取得
  const handleToggle = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (newState && !serverStatus) {
      fetchStatus();
    }
  }, [isExpanded, serverStatus, fetchStatus]);

  // テスト音声を生成して送信
  const sendGeneratedAudio = useCallback(
    async (type: "tone" | "silence") => {
      if (disabled || isSending) return;

      setIsSending(true);
      addLog(`テスト音声(${type})を生成中...`);

      try {
        const res = await fetch(
          `/api/debug/audio/generate?type=${type}&duration=1000&frequency=440`
        );
        const data = await res.json();

        addLog(`生成完了: ${data.info.durationMs}ms`);
        onStartSpeaking();

        // チャンクに分けて送信（100msごと）
        const chunkSize = 4800; // 100ms分のサンプル (24000 * 0.1 * 2 bytes)
        const audioBuffer = atob(data.audioBase64);
        const chunks: string[] = [];

        for (let i = 0; i < audioBuffer.length; i += chunkSize) {
          const chunk = audioBuffer.slice(i, i + chunkSize);
          chunks.push(btoa(chunk));
        }

        addLog(`${chunks.length}チャンクを送信中...`);

        for (let i = 0; i < chunks.length; i++) {
          onAudioChunk(target, chunks[i]);
          await new Promise((r) => setTimeout(r, 50));
        }

        onCommit(target);
        addLog("送信完了");
      } catch (error) {
        addLog(`エラー: ${error}`);
      } finally {
        setIsSending(false);
      }
    },
    [disabled, isSending, target, onAudioChunk, onCommit, onStartSpeaking, addLog]
  );

  // WAVファイルをアップロードして送信
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || disabled || isSending) return;

      setIsSending(true);
      addLog(`ファイル読み込み中: ${file.name}`);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // WAVヘッダーをスキップ（44バイト）
        const pcmData = uint8Array.slice(44);

        // Binary文字列に変換
        let binary = "";
        for (let i = 0; i < pcmData.length; i++) {
          binary += String.fromCharCode(pcmData[i]);
        }

        addLog(`ファイルサイズ: ${pcmData.length}バイト`);
        onStartSpeaking();

        // チャンクに分けて送信
        const chunkSize = 4800;
        const chunks: string[] = [];

        for (let i = 0; i < binary.length; i += chunkSize) {
          const chunk = binary.slice(i, i + chunkSize);
          chunks.push(btoa(chunk));
        }

        addLog(`${chunks.length}チャンクを送信中...`);

        for (let i = 0; i < chunks.length; i++) {
          onAudioChunk(target, chunks[i]);
          await new Promise((r) => setTimeout(r, 50));
        }

        onCommit(target);
        addLog("送信完了");
      } catch (error) {
        addLog(`エラー: ${error}`);
      } finally {
        setIsSending(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [disabled, isSending, target, onAudioChunk, onCommit, onStartSpeaking, addLog]
  );

  return (
    <div className="audio-test-panel">
      <button
        className="audio-test-toggle"
        onClick={handleToggle}
        title="音声テストパネル"
      >
        🧪 {isExpanded ? "▼" : "▶"}
      </button>

      {isExpanded && (
        <div className="audio-test-content">
          <div className="audio-test-header">
            <h4>音声テストパネル</h4>
            <button onClick={fetchStatus} className="refresh-btn">
              🔄
            </button>
          </div>

          {serverStatus && (
            <div className="audio-test-status">
              <span className={serverStatus.mockMode ? "status-mock" : "status-prod"}>
                {serverStatus.mockMode ? "🧪 Mock" : "🔴 Prod"}
              </span>
              <span className={serverStatus.audioDebugEnabled ? "status-on" : "status-off"}>
                {serverStatus.audioDebugEnabled ? "🎤 Debug ON" : "Debug OFF"}
              </span>
            </div>
          )}

          <div className="audio-test-actions">
            <button
              onClick={() => sendGeneratedAudio("tone")}
              disabled={disabled || isSending}
              className="test-btn"
            >
              🔊 テスト音声送信
            </button>
            <button
              onClick={() => sendGeneratedAudio("silence")}
              disabled={disabled || isSending}
              className="test-btn"
            >
              🔇 無音送信
            </button>
            <label className="file-upload-btn">
              📁 WAVファイル
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav"
                onChange={handleFileUpload}
                disabled={disabled || isSending}
                style={{ display: "none" }}
              />
            </label>
          </div>

          <div className="audio-test-target">
            送信先: <strong>{target}</strong>
          </div>

          <div className="audio-test-log">
            {log.map((msg, i) => (
              <div key={i} className="log-line">
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .audio-test-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        .audio-test-toggle {
          background: #333;
          color: #fff;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .audio-test-toggle:hover {
          background: #444;
        }
        .audio-test-content {
          position: absolute;
          bottom: 40px;
          right: 0;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 12px;
          width: 280px;
          color: #fff;
        }
        .audio-test-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .audio-test-header h4 {
          margin: 0;
          font-size: 14px;
        }
        .refresh-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
        }
        .audio-test-status {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 12px;
        }
        .status-mock { color: #4ade80; }
        .status-prod { color: #f87171; }
        .status-on { color: #4ade80; }
        .status-off { color: #888; }
        .audio-test-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .test-btn, .file-upload-btn {
          background: #333;
          border: 1px solid #555;
          color: #fff;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .test-btn:hover, .file-upload-btn:hover {
          background: #444;
        }
        .test-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .audio-test-target {
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
        }
        .audio-test-log {
          background: #000;
          border-radius: 4px;
          padding: 6px;
          max-height: 120px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 10px;
        }
        .log-line {
          color: #888;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
