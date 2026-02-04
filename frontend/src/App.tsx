import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useAudioPlayer } from "./hooks/useAudioRecorder";
import { AudioTestPanel } from "./components/AudioTestPanel";
import { HistoryModal } from "./components/HistoryModal";
import { StepIndicator } from "./components/StepIndicator";
import { SetupPhase } from "./components/phases/SetupPhase";
import { InterviewPhase } from "./components/phases/InterviewPhase";
import { ResultPhase } from "./components/phases/ResultPhase";
import type {
  Target,
  InterviewMode,
  InterviewPattern,
  JapaneseLevel,
  PersonaConfig,
} from "./types/ws";
import { getUIPhase } from "./types/ws";

// Development mode check
const IS_DEV = import.meta.env.DEV;

function App() {
  const {
    isConnected,
    isLoading,
    state,
    transcripts,
    connect,
    disconnect,
    startSession,
    sendText,
    sendAudioChunk,
    commitAudio,
    userWillSpeak,
    audioQueue,
    shiftAudioQueue,
    audioDone,
    resetAudioDone,
    notifyAudioPlaybackDone,
    evaluationResult,
    autoProceed,
    pauseAutoProceed,
    resumeAutoProceed,
  } = useWebSocket();

  const { playAudio } = useAudioPlayer();
  const fixedTarget: Target = "interviewer";
  const fixedMode: InterviewMode = "auto";
  const [personaConfig, setPersonaConfig] = useState<PersonaConfig | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Get current UI phase
  const uiPhase = getUIPhase(state.phase);

  const statusLabel = isConnected
    ? state.phase === "waiting"
      ? "待機中"
      : "進行中"
    : "未接続";
  const statusTone = isConnected ? "ok" : "off";

  // Track if we're currently playing audio
  const isPlayingRef = useRef(false);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Process audio queue - play one item at a time
  useEffect(() => {
    if (audioQueue.length === 0 || isPlayingRef.current) return;

    const playNextItem = async () => {
      isPlayingRef.current = true;
      const item = audioQueue[0];

      try {
        await playAudio(item.data);
      } catch (error) {
        console.error("Failed to play audio:", error);
      }

      // Remove only the first item after playing
      shiftAudioQueue();
      isPlayingRef.current = false;
    };

    playNextItem();
  }, [audioQueue, playAudio, shiftAudioQueue]);

  // Notify server when audio playback is complete
  useEffect(() => {
    if (audioDone && audioQueue.length === 0 && !isPlayingRef.current) {
      notifyAudioPlaybackDone();
      resetAudioDone();
    }
  }, [audioDone, audioQueue.length, notifyAudioPlaybackDone, resetAudioDone]);

  // Handle start session (from PatternSelector)
  const handlePatternStart = useCallback(
    (pattern: InterviewPattern, japaneseLevel?: JapaneseLevel) => {
      startSession(fixedMode, pattern, japaneseLevel, personaConfig || undefined);
    },
    [startSession, fixedMode, personaConfig]
  );

  // Handle start session (legacy, for SessionControls - uses default pattern)
  const handleStart = useCallback(
    () => {
      startSession(fixedMode, "pattern2", "N4", personaConfig || undefined);
    },
    [startSession, fixedMode, personaConfig]
  );

  // Handle restart
  const handleRestart = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 500);
  }, [disconnect, connect]);

  // Handle human text input
  const handleSendText = useCallback(
    (target: Target, text: string) => {
      sendText(target, text);
    },
    [sendText]
  );

  // Handle human audio input
  const handleAudioChunk = useCallback(
    (target: Target, audioBase64: string) => {
      sendAudioChunk(target, audioBase64);
    },
    [sendAudioChunk]
  );

  const handleCommitAudio = useCallback(
    (target: Target) => {
      commitAudio(target);
    },
    [commitAudio]
  );

  const handleStartSpeaking = useCallback(() => {
    userWillSpeak();
  }, [userWillSpeak]);

  const handlePersonaSelect = useCallback((persona: PersonaConfig) => {
    setPersonaConfig(persona);
  }, []);

  // Determine if input should be enabled
  const canInput =
    state.phase === "user_choice" ||
    state.phase === "user_speaking" ||
    state.waitingForNext;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-mark">AI</div>
            <div className="brand-text">
              <h1 className="header-title">面接シミュレーション</h1>
              <p className="header-subtitle">2 AI + 1 Human orchestration</p>
            </div>
          </div>
          <div className="header-status">
            <span className={`status-pill ${statusTone}`}>{statusLabel}</span>
            <button className="history-btn" onClick={() => setHistoryOpen(true)}>
              履歴
            </button>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator currentPhase={uiPhase} />

      <div className="main-container">
        {/* Setup Phase */}
        {uiPhase === "setup" && (
          <SetupPhase
            isConnected={isConnected}
            isLoading={isLoading}
            onStart={handlePatternStart}
            onPersonaSelect={handlePersonaSelect}
          />
        )}

        {/* Interview Phase */}
        {uiPhase === "interview" && (
          <InterviewPhase
            state={state}
            transcripts={transcripts}
            isConnected={isConnected}
            isLoading={isLoading}
            fixedTarget={fixedTarget}
            canInput={canInput}
            onSendText={handleSendText}
            onAudioChunk={handleAudioChunk}
            onCommitAudio={handleCommitAudio}
            onStartSpeaking={handleStartSpeaking}
            onStart={handleStart}
            onRestart={handleRestart}
            autoProceed={autoProceed}
            onPauseAutoProceed={pauseAutoProceed}
            onResumeAutoProceed={resumeAutoProceed}
          />
        )}

        {/* Result Phase */}
        {uiPhase === "result" && (
          <ResultPhase
            evaluationResult={evaluationResult}
            endReason={state.endReason}
            onRestart={handleRestart}
          />
        )}
      </div>

      {/* Audio Test Panel (Dev mode only) */}
      {IS_DEV && (
        <AudioTestPanel
          target={fixedTarget}
          onAudioChunk={handleAudioChunk}
          onCommit={handleCommitAudio}
          onStartSpeaking={handleStartSpeaking}
          disabled={!canInput || state.phase === "ended"}
        />
      )}

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}

export default App;
