import { useCallback } from "react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import type { Target } from "../types/ws";

interface VoiceInputProps {
  target: Target;
  onAudioChunk: (target: Target, audioBase64: string) => void;
  onCommit: (target: Target) => void;
  onStartSpeaking: () => void;
  disabled?: boolean;
}

export function VoiceInput({
  target,
  onAudioChunk,
  onCommit,
  onStartSpeaking,
  disabled = false,
}: VoiceInputProps) {
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const handleStartRecording = useCallback(async () => {
    onStartSpeaking();
    await startRecording((audioBase64) => {
      onAudioChunk(target, audioBase64);
    });
  }, [startRecording, onAudioChunk, onStartSpeaking, target]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    onCommit(target);
  }, [stopRecording, onCommit, target]);

  if (isRecording) {
    return (
      <div className="voice-input-container">
        <div className="mic-indicator">
          <div className="mic-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <span>マイクに向かって話してください</span>
        </div>
        <button className="action-btn primary" onClick={handleStopRecording}>
          話し終わった
        </button>
      </div>
    );
  }

  return (
    <button
      className="action-btn success"
      onClick={handleStartRecording}
      disabled={disabled}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" x2="12" y1="19" y2="22" />
      </svg>
      音声で補足
    </button>
  );
}
