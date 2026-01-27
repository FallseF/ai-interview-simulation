import { useEffect, useRef } from "react";
import type { TranscriptEntry, Speaker } from "../types/ws";

interface TranscriptPanelProps {
  transcripts: TranscriptEntry[];
  currentSpeaker: Speaker | null;
}

export function TranscriptPanel({ transcripts }: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcripts]);

  if (transcripts.length === 0) {
    return (
      <div className="chat-messages" ref={containerRef}>
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="empty-text">
            「面接を開始」ボタンを押すと
            <br />
            会話が始まります
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-messages" ref={containerRef}>
      {transcripts.map((entry) => (
        <Message key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

interface MessageProps {
  entry: TranscriptEntry;
}

function Message({ entry }: MessageProps) {
  const { speaker, name, text } = entry;

  // System messages
  if (name === "システム") {
    return (
      <div className="message system">
        <div className="message-content">
          <div className="message-bubble">{text}</div>
        </div>
      </div>
    );
  }

  const avatarInitial = getAvatarInitial(speaker);

  return (
    <div className={`message ${speaker}`}>
      <div className={`message-avatar ${speaker}`}>{avatarInitial}</div>
      <div className="message-content">
        <div className="message-sender">{name}</div>
        <div className="message-bubble">{text}</div>
      </div>
    </div>
  );
}

function getAvatarInitial(speaker: Speaker): string {
  switch (speaker) {
    case "interviewer":
      return "面";
    case "candidate":
      return "求";
    case "human":
      return "支";
    default:
      return "?";
  }
}
