"use client";

import type { InterviewMode, InterviewState } from "@/types";

interface SessionControlsProps {
  state: InterviewState;
  isLoading: boolean;
  onStart: (mode: InterviewMode) => void;
  onModeChange: (mode: InterviewMode) => void;
  onNextTurn: () => void;
  onReset: () => void;
}

export function SessionControls({
  state,
  isLoading,
  onStart,
  onModeChange,
  onNextTurn,
  onReset,
}: SessionControlsProps) {
  const { phase, mode, waitingForNext } = state;

  // Waiting state - show start button
  if (phase === "waiting") {
    return (
      <div className="control-bar">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span className="loading-text">AIに接続中...</span>
          </div>
        ) : (
          <>
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === "step" ? "active" : ""}`}
                onClick={() => onModeChange("step")}
              >
                ステップ
              </button>
              <button
                className={`mode-btn ${mode === "auto" ? "active" : ""}`}
                onClick={() => onModeChange("auto")}
              >
                オート
              </button>
            </div>
            <button
              className="control-btn start"
              onClick={() => onStart(mode)}
              disabled={isLoading}
            >
              面接を開始
            </button>
          </>
        )}
      </div>
    );
  }

  // Ended state - show restart button
  if (phase === "ended") {
    return (
      <div className="end-screen">
        <div className={`end-icon-wrapper ${state.endReason === "aborted" ? "aborted" : ""}`}>
          {state.endReason === "aborted" ? "!" : "✓"}
        </div>
        <div className="end-title">
          {state.endReason === "aborted" ? "面接中止" : "面接終了"}
        </div>
        <div className="end-message">
          {state.endReason === "aborted"
            ? "面接官が面接を打ち切りました。"
            : "お疲れ様でした。面接が終了しました。"}
        </div>
        <button className="action-btn primary" onClick={onReset}>
          もう一度
        </button>
      </div>
    );
  }

  // User choice state - show action buttons
  if (phase === "user_choice" || waitingForNext) {
    return (
      <div className="action-buttons visible">
        {mode === "step" && !isLoading && (
          <button className="control-btn next" onClick={onNextTurn}>
            次へ進む (Step)
          </button>
        )}
        {isLoading && (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span className="loading-text">AIが考え中...</span>
          </div>
        )}
      </div>
    );
  }

  // Speaking states - show loading or mode toggle
  return (
    <div className="control-bar">
      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <span className="loading-text">AIが話しています...</span>
        </div>
      ) : (
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === "step" ? "active" : ""}`}
            onClick={() => onModeChange("step")}
          >
            ステップ
          </button>
          <button
            className={`mode-btn ${mode === "auto" ? "active" : ""}`}
            onClick={() => onModeChange("auto")}
          >
            オート
          </button>
        </div>
      )}
    </div>
  );
}
