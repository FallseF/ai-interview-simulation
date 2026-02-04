import { useState, useEffect, useCallback, useRef } from "react";
import type {
  ClientMessage,
  ServerMessage,
  TranscriptEntry,
  InterviewState,
  Target,
  InterviewMode,
  InterviewPattern,
  JapaneseLevel,
  EvaluationResult,
  PersonaConfig,
} from "../types/ws";

interface UseWebSocketReturn {
  // Connection state
  isConnected: boolean;
  isLoading: boolean;

  // Interview state
  state: InterviewState;
  transcripts: TranscriptEntry[];

  // Actions
  connect: () => void;
  disconnect: () => void;
  startSession: (
    mode: InterviewMode,
    pattern: InterviewPattern,
    japaneseLevel?: JapaneseLevel,
    persona?: PersonaConfig
  ) => void;
  setMode: (mode: InterviewMode) => void;
  nextTurn: () => void;
  sendText: (target: Target, text: string) => void;
  sendAudioChunk: (target: Target, audioBase64: string) => void;
  commitAudio: (target: Target) => void;
  endSession: () => void;

  // Legacy actions (for backward compatibility)
  proceedToNext: () => void;
  userWillSpeak: () => void;
  userDoneSpeaking: () => void;
  sendAudio: (audioBase64: string) => void;
  notifyAudioPlaybackDone: () => void;

  // Audio playback
  audioQueue: { speaker: string; data: string }[];
  clearAudioQueue: () => void;
  shiftAudioQueue: () => void;
  audioDone: boolean;
  resetAudioDone: () => void;

  // Evaluation
  evaluationResult: EvaluationResult | null;
  clearEvaluationResult: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [audioQueue, setAudioQueue] = useState<{ speaker: string; data: string }[]>([]);
  const [audioDone, setAudioDone] = useState(false);

  const [state, setState] = useState<InterviewState>({
    phase: "waiting",
    currentSpeaker: null,
    waitingForNext: false,
    mode: "step",
  });
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // Generate unique ID for transcript entries
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle incoming messages
  const handleMessage = useCallback((data: ServerMessage) => {
    switch (data.type) {
      case "session_ready":
      case "sessions_ready":
        setIsLoading(false);
        break;

      case "turn_state":
        setState((prev) => ({
          ...prev,
          currentSpeaker: data.currentSpeaker,
          waitingForNext: data.waitingForNext,
          phase: (data.phase as InterviewState["phase"]) || prev.phase,
          mode: data.mode || prev.mode,
        }));
        break;

      case "transcript_delta":
        // Update last transcript with delta (if exists)
        // For simplicity, we wait for transcript_done
        break;

      case "transcript_done":
        setTranscripts((prev) => [
          ...prev,
          {
            id: generateId(),
            speaker: data.speaker,
            name: getSpeakerName(data.speaker),
            text: data.text,
            timestamp: new Date(),
          },
        ]);
        break;

      case "transcript":
        // Legacy format
        setTranscripts((prev) => [
          ...prev,
          {
            id: generateId(),
            speaker: data.source === "ai_a" ? "interviewer" : "candidate",
            name: data.name,
            text: data.text,
            timestamp: new Date(),
          },
        ]);
        break;

      case "audio_delta":
        setAudioQueue((prev) => [...prev, { speaker: data.speaker, data: data.audioBase64 }]);
        break;

      case "audio":
        // Legacy format
        const speaker = data.source === "ai_a" ? "interviewer" : "candidate";
        setAudioQueue((prev) => [...prev, { speaker, data: data.data }]);
        break;

      case "audio_done":
        // Audio generation complete for this speaker
        setAudioDone(true);
        break;

      case "phase_change":
        setState((prev) => ({
          ...prev,
          phase: data.phase as InterviewState["phase"],
          endReason: data.reason as InterviewState["endReason"],
        }));
        break;

      case "waiting_for_sessions":
        setIsLoading(true);
        break;

      case "evaluation_result":
        console.log("[WebSocket] Evaluation result received");
        setEvaluationResult(data.result);
        break;

      case "error":
        console.error("[WebSocket] Error:", data.message);
        break;
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ServerMessage;
        handleMessage(data);
      } catch (error) {
        console.error("[WebSocket] Failed to parse message:", error);
      }
    };

    ws.onclose = () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
      setState({
        phase: "waiting",
        currentSpeaker: null,
        waitingForNext: false,
        mode: "step",
      });
    };

    ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    wsRef.current = ws;
  }, [handleMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  // Send message helper
  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Actions
  const startSession = useCallback(
    (
      mode: InterviewMode,
      pattern: InterviewPattern,
      japaneseLevel?: JapaneseLevel,
      persona?: PersonaConfig
    ) => {
      setIsLoading(true);
      setState((prev) => ({ ...prev, mode }));
      send({ type: "start_session", mode, pattern, japaneseLevel, persona });
    },
    [send]
  );

  const setMode = useCallback(
    (mode: InterviewMode) => {
      setState((prev) => ({ ...prev, mode }));
      send({ type: "set_mode", mode });
    },
    [send]
  );

  const nextTurn = useCallback(() => {
    send({ type: "next_turn" });
  }, [send]);

  const sendText = useCallback(
    (target: Target, text: string) => {
      send({ type: "human_text", target, text });
    },
    [send]
  );

  const sendAudioChunk = useCallback(
    (target: Target, audioBase64: string) => {
      send({ type: "human_audio_chunk", target, audioBase64 });
    },
    [send]
  );

  const commitAudio = useCallback(
    (target: Target) => {
      send({ type: "human_audio_commit", target });
    },
    [send]
  );

  const endSession = useCallback(() => {
    send({ type: "end_session" });
  }, [send]);

  // Legacy actions
  const proceedToNext = useCallback(() => {
    send({ type: "proceed_to_next" });
    setTranscripts((prev) => [
      ...prev,
      {
        id: generateId(),
        speaker: "human",
        name: "システム",
        text: "次の質問へ",
        timestamp: new Date(),
      },
    ]);
  }, [send]);

  const userWillSpeak = useCallback(() => {
    send({ type: "user_will_speak" });
  }, [send]);

  const userDoneSpeaking = useCallback(() => {
    send({ type: "user_done_speaking" });
  }, [send]);

  const sendAudio = useCallback(
    (audioBase64: string) => {
      send({ type: "audio", data: audioBase64 });
    },
    [send]
  );

  const notifyAudioPlaybackDone = useCallback(() => {
    send({ type: "audio_playback_done" });
  }, [send]);

  const clearAudioQueue = useCallback(() => {
    setAudioQueue([]);
  }, []);

  // Remove only the first item from the queue
  const shiftAudioQueue = useCallback(() => {
    setAudioQueue((prev) => prev.slice(1));
  }, []);

  // Reset audio done flag
  const resetAudioDone = useCallback(() => {
    setAudioDone(false);
  }, []);

  // Clear evaluation result
  const clearEvaluationResult = useCallback(() => {
    setEvaluationResult(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isLoading,
    state,
    transcripts,
    connect,
    disconnect,
    startSession,
    setMode,
    nextTurn,
    sendText,
    sendAudioChunk,
    commitAudio,
    endSession,
    proceedToNext,
    userWillSpeak,
    userDoneSpeaking,
    sendAudio,
    notifyAudioPlaybackDone,
    audioQueue,
    clearAudioQueue,
    shiftAudioQueue,
    audioDone,
    resetAudioDone,
    evaluationResult,
    clearEvaluationResult,
  };
}

function getSpeakerName(speaker: string): string {
  switch (speaker) {
    case "interviewer":
      return "田中部長";
    case "candidate":
      return "グエン・ミン";
    case "human":
      return "転職支援";
    default:
      return speaker;
  }
}
