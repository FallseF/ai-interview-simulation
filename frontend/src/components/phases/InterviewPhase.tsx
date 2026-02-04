import { TranscriptPanel } from "../TranscriptPanel";
import { CoachPanel } from "../CoachPanel";
import { TextInput } from "../TextInput";
import { VoiceInput } from "../VoiceInput";
import { SessionControls } from "../SessionControls";
import type {
  Target,
  InterviewMode,
  InterviewState,
  TranscriptEntry,
} from "../../types/ws";

interface InterviewPhaseProps {
  state: InterviewState;
  transcripts: TranscriptEntry[];
  isConnected: boolean;
  isLoading: boolean;
  localMode: InterviewMode;
  fixedTarget: Target;
  canInput: boolean;
  onSendText: (target: Target, text: string) => void;
  onAudioChunk: (target: Target, audioBase64: string) => void;
  onCommitAudio: (target: Target) => void;
  onStartSpeaking: () => void;
  onStart: (mode: InterviewMode) => void;
  onModeChange: (mode: InterviewMode) => void;
  onNextTurn: () => void;
  onProceedToNext: () => void;
  onRestart: () => void;
}

export function InterviewPhase({
  state,
  transcripts,
  isConnected,
  isLoading,
  localMode,
  fixedTarget,
  canInput,
  onSendText,
  onAudioChunk,
  onCommitAudio,
  onStartSpeaking,
  onStart,
  onModeChange,
  onNextTurn,
  onProceedToNext,
  onRestart,
}: InterviewPhaseProps) {
  return (
    <div className="phase-content interview-phase">
      {/* Workspace */}
      <div className="workspace">
        <section className="chat-panel">
          <div className="panel-header">
            <div className="panel-title">会話ログ</div>
            <div className="panel-meta">{transcripts.length} entries</div>
          </div>
          <TranscriptPanel
            transcripts={transcripts}
            currentSpeaker={state.currentSpeaker}
          />
        </section>

        <aside className="control-panel">
          <div className="panel-header">
            <div className="panel-title">操作パネル</div>
            <div className="panel-meta">進行と補足</div>
          </div>

          <div className="panel-body">
            <CoachPanel state={state} />

            {canInput && state.phase !== "ended" && (
              <>
                {state.phase !== "user_speaking" && (
                  <TextInput
                    target={fixedTarget}
                    onSend={onSendText}
                    placeholder="補足を入力..."
                  />
                )}
                <div className="action-buttons visible">
                  <VoiceInput
                    target={fixedTarget}
                    onAudioChunk={onAudioChunk}
                    onCommit={onCommitAudio}
                    onStartSpeaking={onStartSpeaking}
                  />
                </div>
              </>
            )}

            <SessionControls
              state={{ ...state, mode: localMode }}
              isConnected={isConnected}
              isLoading={isLoading}
              onStart={onStart}
              onModeChange={onModeChange}
              onNextTurn={onNextTurn}
              onProceedToNext={onProceedToNext}
              onRestart={onRestart}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
