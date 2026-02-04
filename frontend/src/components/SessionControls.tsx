import type { InterviewState } from "../types/ws";

interface SessionControlsProps {
  state: InterviewState;
  isConnected: boolean;
  isLoading: boolean;
  onStart: () => void;
  onRestart: () => void;
}

export function SessionControls({
  state,
  isConnected,
  isLoading,
  onStart,
  onRestart,
}: SessionControlsProps) {
  const { phase } = state;

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
            <button
              className="control-btn start"
              onClick={onStart}
              disabled={!isConnected || isLoading}
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
        <button className="action-btn primary" onClick={onRestart}>
          もう一度
        </button>
      </div>
    );
  }

  return null;
}
