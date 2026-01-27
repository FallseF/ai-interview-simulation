import { useState, useCallback, KeyboardEvent } from "react";
import type { Target } from "../types/ws";

interface TextInputProps {
  target: Target;
  onSend: (target: Target, text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TextInput({
  target,
  onSend,
  disabled = false,
  placeholder = "補足を入力...",
}: TextInputProps) {
  const [text, setText] = useState("");

  const handleSend = useCallback(() => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    onSend(target, trimmedText);
    setText("");
  }, [text, target, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="text-input-container">
      <input
        type="text"
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        className="send-btn"
        onClick={handleSend}
        disabled={disabled || !text.trim()}
      >
        送信
      </button>
    </div>
  );
}
