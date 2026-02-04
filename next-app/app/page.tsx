"use client";

import { useState, useCallback } from "react";
import { useInterview } from "@/hooks/useInterview";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { ParticipantsBar } from "@/components/CoachPanel";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

export default function InterviewPage() {
  const {
    isLoading,
    isEvaluating,
    state,
    transcripts,
    evaluation,
    startSession,
    nextTurn,
    sendText,
    reset,
  } = useInterview();

  const [inputText, setInputText] = useState("");
  const { isRecording, isProcessing, startRecording, stopRecording, error: micError } =
    useAudioRecorder();

  // 補足を送信
  const handleSendText = useCallback(() => {
    if (inputText.trim()) {
      sendText(inputText.trim());
      setInputText("");
    }
  }, [inputText, sendText]);

  // Enter で送信
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText]
  );

  // マイクボタン
  const handleMicClick = useCallback(async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        sendText(text);
      }
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording, sendText]);

  // 入力可能か
  const canInput = state.waitingForNext && state.phase !== "ended" && !isLoading;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">面接シミュレーション</h1>
        </div>
      </header>

      <div className="main-container">
        {/* Instructions */}
        {state.phase === "waiting" && (
          <div className="instructions-card">
            <div className="instructions-header">
              <div className="instructions-icon-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="16" y2="12" />
                  <line x1="12" x2="12.01" y1="8" y2="8" />
                </svg>
              </div>
              <span className="instructions-title">使い方</span>
            </div>
            <p className="instructions-text">
              あなたは<strong>転職支援エージェント</strong>として、外国人求職者の面接をサポートします。
            </p>
            <div className="instructions-list">
              <div className="instruction-item">
                <span className="instruction-number">1</span>
                <span>「面接を開始」で面接官が最初の質問をします</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">2</span>
                <span>「次へ」で候補者→面接官と交互に進みます</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">3</span>
                <span>候補者の回答後、補足を入力すると面接官に伝わります</span>
              </div>
            </div>
          </div>
        )}

        {/* Participants */}
        <ParticipantsBar currentSpeaker={state.currentSpeaker} />

        {/* Chat Container */}
        <div className="chat-container">
          {/* Transcript */}
          <TranscriptPanel
            transcripts={transcripts}
            currentSpeaker={state.currentSpeaker}
          />

          {/* Input Controls - 候補者の後に表示 */}
          {canInput && (
            <div className="voice-input">
              <div className="voice-input-row">
                {/* Microphone button */}
                <button
                  className={`mic-btn ${isRecording ? "recording" : ""} ${isProcessing ? "processing" : ""}`}
                  onClick={handleMicClick}
                  disabled={isProcessing}
                  title={isRecording ? "録音を停止" : "音声で入力"}
                >
                  {isProcessing ? (
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  )}
                </button>

                {/* Text input */}
                <input
                  type="text"
                  className="voice-input-field"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRecording ? "録音中..." : "補足を入力（面接官に伝わります）..."}
                  disabled={isProcessing || isRecording}
                />

                {/* Send button */}
                <button
                  className="send-btn"
                  onClick={handleSendText}
                  disabled={isProcessing || !inputText.trim() || isRecording}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Recording indicator */}
              {isRecording && (
                <div className="recording-indicator">
                  <span className="recording-dot" />
                  <span>録音中... クリックで停止</span>
                </div>
              )}

              {/* Error message */}
              {micError && <div className="voice-input-error">{micError}</div>}
            </div>
          )}

          {/* Control Bar */}
          <div className="control-bar">
            {state.phase === "waiting" && (
              <button
                className="control-btn start"
                onClick={startSession}
                disabled={isLoading}
              >
                面接を開始
              </button>
            )}

            {state.phase !== "waiting" && state.phase !== "ended" && (
              <>
                {isLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner" />
                    <span className="loading-text">
                      {state.currentSpeaker === "interviewer" ? "面接官が話しています..." : "求職者が話しています..."}
                    </span>
                  </div>
                ) : (
                  <button
                    className="control-btn next"
                    onClick={nextTurn}
                  >
                    次へ
                  </button>
                )}
              </>
            )}

            {state.phase === "ended" && (
              <div className="end-screen">
                <div className="end-icon-wrapper">{state.endReason === "aborted" ? "!" : "✓"}</div>
                <div className="end-title">
                  {state.endReason === "aborted" ? "面接が中止されました" : "面接が終了しました"}
                </div>

                {/* 評価中 */}
                {isEvaluating && (
                  <div className="evaluating-state">
                    <div className="loading-spinner" />
                    <span>評価中...</span>
                  </div>
                )}

                {/* 評価結果 */}
                {evaluation && (
                  <div className="evaluation-result">
                    <div className="evaluation-score">
                      <span className="score-value">{evaluation.totalScore}</span>
                      <span className="score-label">/ 100点</span>
                    </div>

                    <div className="evaluation-criteria">
                      <div className="criteria-item">
                        <span className="criteria-name">コミュニケーション</span>
                        <div className="criteria-stars">
                          {"★".repeat(evaluation.criteria.communication)}
                          {"☆".repeat(5 - evaluation.criteria.communication)}
                        </div>
                      </div>
                      <div className="criteria-item">
                        <span className="criteria-name">マナー・態度</span>
                        <div className="criteria-stars">
                          {"★".repeat(evaluation.criteria.manner)}
                          {"☆".repeat(5 - evaluation.criteria.manner)}
                        </div>
                      </div>
                      <div className="criteria-item">
                        <span className="criteria-name">サポート力</span>
                        <div className="criteria-stars">
                          {"★".repeat(evaluation.criteria.support)}
                          {"☆".repeat(5 - evaluation.criteria.support)}
                        </div>
                      </div>
                      <div className="criteria-item">
                        <span className="criteria-name">状況判断</span>
                        <div className="criteria-stars">
                          {"★".repeat(evaluation.criteria.judgment)}
                          {"☆".repeat(5 - evaluation.criteria.judgment)}
                        </div>
                      </div>
                    </div>

                    <div className="evaluation-feedback">
                      <p>{evaluation.feedback}</p>
                    </div>

                    {evaluation.strengths.length > 0 && (
                      <div className="evaluation-section">
                        <h4>良かった点</h4>
                        <ul>
                          {evaluation.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluation.improvements.length > 0 && (
                      <div className="evaluation-section">
                        <h4>改善点</h4>
                        <ul>
                          {evaluation.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <button className="control-btn" onClick={reset}>
                  最初からやり直す
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
