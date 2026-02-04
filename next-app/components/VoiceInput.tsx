"use client";

import { useState, useCallback } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import type { Target } from "@/types";

interface VoiceInputProps {
  target: Target;
  onSend: (target: Target, text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function VoiceInput({
  target,
  onSend,
  placeholder = "補足を入力...",
  disabled = false,
}: VoiceInputProps) {
  const [inputText, setInputText] = useState("");
  const { isRecording, isProcessing, startRecording, stopRecording, error } =
    useAudioRecorder();

  const handleSend = useCallback(() => {
    if (inputText.trim()) {
      onSend(target, inputText.trim());
      setInputText("");
    }
  }, [inputText, target, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleMicClick = useCallback(async () => {
    if (isRecording) {
      const text = await stopRecording();
      if (text) {
        // Send transcribed text directly
        onSend(target, text);
      }
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording, target, onSend]);

  const isDisabled = disabled || isProcessing;

  return (
    <div className="voice-input">
      <div className="voice-input-row">
        {/* Microphone button */}
        <button
          className={`mic-btn ${isRecording ? "recording" : ""} ${
            isProcessing ? "processing" : ""
          }`}
          onClick={handleMicClick}
          disabled={isDisabled}
          title={isRecording ? "録音を停止" : "音声で入力"}
        >
          {isProcessing ? (
            <svg
              className="spinner"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
          placeholder={isRecording ? "録音中..." : placeholder}
          disabled={isDisabled || isRecording}
        />

        {/* Send button */}
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={isDisabled || !inputText.trim() || isRecording}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
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
      {error && <div className="voice-input-error">{error}</div>}
    </div>
  );
}
