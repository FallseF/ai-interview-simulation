import { useEffect, useRef, useState } from "react";
import type { AutoProceedStatus } from "../types/ws";

interface AutoProceedBarProps {
  status: AutoProceedStatus;
  onPause: () => void;
  onResume: () => void;
}

export function AutoProceedBar({ status, onPause, onResume }: AutoProceedBarProps) {
  const [remainingMs, setRemainingMs] = useState(status.remainingMs);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (status.state === "scheduled") {
      endAtRef.current = Date.now() + status.remainingMs;
      setRemainingMs(status.remainingMs);
      return;
    }

    endAtRef.current = null;
    setRemainingMs(status.remainingMs);
  }, [status.state, status.remainingMs]);

  useEffect(() => {
    if (status.state !== "scheduled") return;

    const id = window.setInterval(() => {
      if (!endAtRef.current) return;
      const nextRemaining = Math.max(0, endAtRef.current - Date.now());
      setRemainingMs(nextRemaining);
    }, 100);

    return () => window.clearInterval(id);
  }, [status.state]);

  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress = status.totalMs > 0
    ? Math.max(0, Math.min(1, remainingMs / status.totalMs))
    : 0;
  const progressPercent = Math.round(progress * 100);
  const isPaused = status.state === "paused";

  return (
    <div className={`auto-proceed ${isPaused ? "paused" : ""}`}>
      <div className="auto-proceed-header">
        <div>
          <span className="auto-proceed-title">補足タイム</span>
          <span className="auto-proceed-remaining">
            {isPaused ? "一時停止中" : `残り ${remainingSeconds} 秒`}
          </span>
        </div>
        <button
          className="auto-proceed-btn"
          onClick={isPaused ? onResume : onPause}
        >
          {isPaused ? "再開" : "一時停止"}
        </button>
      </div>
      <div className="auto-proceed-bar">
        <div
          className="auto-proceed-bar-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
