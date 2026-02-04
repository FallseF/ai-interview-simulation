"use client";

import type { Speaker, InterviewState } from "@/types";

interface CoachPanelProps {
  state: InterviewState;
}

export function CoachPanel({ state }: CoachPanelProps) {
  const { phase, currentSpeaker } = state;

  // Only show during active interview
  if (phase === "waiting" || phase === "ended") {
    return null;
  }

  return (
    <div className="phase-indicator">
      <div className="phase-content">
        <div className={`phase-dot ${currentSpeaker ? "active " + currentSpeaker : ""}`} />
        <span className="phase-text">{getPhaseText(phase, currentSpeaker)}</span>
      </div>
    </div>
  );
}

function getPhaseText(phase: string, currentSpeaker: Speaker | null): string {
  switch (phase) {
    case "interviewer":
      return "面接官が話しています...";
    case "candidate":
    case "maria_speaking":
      return "求職者が答えています...";
    case "user_choice":
      return "補足しますか？";
    case "user_speaking":
      return "あなたのターンです";
    case "ended":
      return "面接終了";
    default:
      if (currentSpeaker === "interviewer") return "面接官が話しています...";
      if (currentSpeaker === "candidate") return "求職者が答えています...";
      if (currentSpeaker === "human") return "あなたのターンです";
      return "待機中";
  }
}

// Participants display component
interface ParticipantsBarProps {
  currentSpeaker: Speaker | null;
}

export function ParticipantsBar({ currentSpeaker }: ParticipantsBarProps) {
  return (
    <div className="participants-bar">
      <div className={`participant-chip interviewer ${currentSpeaker === "interviewer" ? "speaking" : ""}`}>
        <div className="chip-avatar interviewer">面</div>
        <div className="chip-info">
          <span className="chip-name">面接官</span>
          <span className="chip-role">田中部長</span>
        </div>
      </div>
      <div className={`participant-chip human ${currentSpeaker === "human" ? "speaking" : ""}`}>
        <div className="chip-avatar human">支</div>
        <div className="chip-info">
          <span className="chip-name">あなた</span>
          <span className="chip-role">転職支援</span>
        </div>
      </div>
      <div className={`participant-chip candidate ${currentSpeaker === "candidate" ? "speaking" : ""}`}>
        <div className="chip-avatar candidate">求</div>
        <div className="chip-info">
          <span className="chip-name">グエン・ミン</span>
          <span className="chip-role">求職者</span>
        </div>
      </div>
    </div>
  );
}
