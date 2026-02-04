import { useState, useEffect, useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useAudioPlayer } from "./hooks/useAudioRecorder";
import { SessionControls } from "./components/SessionControls";
import { TargetSelector } from "./components/TargetSelector";
import { VoiceInput } from "./components/VoiceInput";
import { TextInput } from "./components/TextInput";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { CoachPanel, ParticipantsBar } from "./components/CoachPanel";
import { AudioTestPanel } from "./components/AudioTestPanel";
import { EvaluationPanel } from "./components/EvaluationPanel";
import type { Target, InterviewMode, InterviewPattern, JapaneseLevel } from "./types/ws";
import { PatternSelector } from "./components/PatternSelector";

// 開発モードかどうか
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
    setMode,
    nextTurn,
    sendText,
    sendAudioChunk,
    commitAudio,
    proceedToNext,
    userWillSpeak,
    audioQueue,
    shiftAudioQueue,
    audioDone,
    resetAudioDone,
    notifyAudioPlaybackDone,
    evaluationResult,
    clearEvaluationResult,
  } = useWebSocket();

  const { playAudio } = useAudioPlayer();
  const [selectedTarget, setSelectedTarget] = useState<Target>("both");
  const [localMode, setLocalMode] = useState<InterviewMode>("step");

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
      startSession(localMode, pattern, japaneseLevel);
    },
    [startSession, localMode]
  );

  // Handle start session (legacy, for SessionControls - uses default pattern)
  const handleStart = useCallback(
    (mode: InterviewMode) => {
      startSession(mode, "pattern2", "N4");
    },
    [startSession]
  );

  // Handle mode change
  const handleModeChange = useCallback(
    (mode: InterviewMode) => {
      setLocalMode(mode);
      if (state.phase !== "waiting") {
        setMode(mode);
      }
    },
    [setMode, state.phase]
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
          <h1 className="header-title">面接シミュレーション</h1>
        </div>
      </header>

      <div className="main-container">
        {/* Instructions */}
        {state.phase === "waiting" && (
          <div className="instructions-card">
            <div className="instructions-header">
              <div className="instructions-icon-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="16" y2="12" />
                  <line x1="12" x2="12.01" y1="8" y2="8" />
                </svg>
              </div>
              <span className="instructions-title">使い方</span>
            </div>
            <p className="instructions-text">
              あなたは<strong>転職支援エージェント</strong>として、外国人求職者の面接をサポートします。
            </p>
            <div className="instructions-list">
              <div className="instruction-item">
                <span className="instruction-number">1</span>
                <span>面接パターンと日本語レベルを選択して開始</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">2</span>
                <span>求職者の回答後、テキストまたは音声で補足できます</span>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">3</span>
                <span>補足の送り先（面接官のみ/求職者のみ/両方）を選択できます</span>
              </div>
            </div>
          </div>
        )}

        {/* Pattern Selector (waiting state only) */}
        {state.phase === "waiting" && !isLoading && (
          <PatternSelector
            onStart={handlePatternStart}
            disabled={!isConnected || isLoading}
          />
        )}

        {/* Participants */}
        <ParticipantsBar currentSpeaker={state.currentSpeaker} />

        {/* Chat Container */}
        <div className="chat-container">
          {/* Transcript */}
          <TranscriptPanel
            transcripts={transcripts}
            currentSpeaker={state.currentSpeaker}
          />

          {/* Phase Indicator */}
          <CoachPanel state={state} />

          {/* Target Selector (when input is enabled) */}
          {canInput && state.phase !== "ended" && (
            <TargetSelector
              selectedTarget={selectedTarget}
              onTargetChange={setSelectedTarget}
              disabled={state.phase === "user_speaking"}
            />
          )}

          {/* Input Controls */}
          {canInput && state.phase !== "ended" && (
            <>
              {state.phase !== "user_speaking" && (
                <TextInput
                  target={selectedTarget}
                  onSend={handleSendText}
                  placeholder="補足を入力..."
                />
              )}
              <div className="action-buttons visible">
                <VoiceInput
                  target={selectedTarget}
                  onAudioChunk={handleAudioChunk}
                  onCommit={handleCommitAudio}
                  onStartSpeaking={handleStartSpeaking}
                />
              </div>
            </>
          )}

          {/* Session Controls */}
          <SessionControls
            state={{ ...state, mode: localMode }}
            isConnected={isConnected}
            isLoading={isLoading}
            onStart={handleStart}
            onModeChange={handleModeChange}
            onNextTurn={nextTurn}
            onProceedToNext={proceedToNext}
            onRestart={handleRestart}
          />
        </div>
      </div>

      {/* 音声テストパネル（開発モードのみ） */}
      {IS_DEV && (
        <AudioTestPanel
          target={selectedTarget}
          onAudioChunk={handleAudioChunk}
          onCommit={handleCommitAudio}
          onStartSpeaking={handleStartSpeaking}
          disabled={!canInput || state.phase === "ended"}
        />
      )}

      {/* 評価結果パネル */}
      {evaluationResult && (
        <EvaluationPanel
          result={evaluationResult}
          onClose={clearEvaluationResult}
        />
      )}
    </div>
  );
}

export default App;
