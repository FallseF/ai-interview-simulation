import { PatternSelector } from "../PatternSelector";
import { PersonaSelector } from "../PersonaSelector";
import type { InterviewPattern, JapaneseLevel, PersonaConfig } from "../../types/ws";

interface SetupPhaseProps {
  isConnected: boolean;
  isLoading: boolean;
  onPatternStart: (pattern: InterviewPattern, japaneseLevel?: JapaneseLevel) => void;
  onPersonaSelect: (persona: PersonaConfig) => void;
}

export function SetupPhase({
  isConnected,
  isLoading,
  onPatternStart,
  onPersonaSelect,
}: SetupPhaseProps) {
  return (
    <div className="phase-content setup-phase">
      <div className="setup-grid">
        <div className="setup-card">
          <div className="instructions-card">
            <div className="instructions-header">
              <div className="instructions-icon-wrapper">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" x2="12" y1="16" y2="12" />
                  <line x1="12" x2="12.01" y1="8" y2="8" />
                </svg>
              </div>
              <span className="instructions-title">使い方</span>
            </div>
            <p className="instructions-text">
              あなたは<strong>転職支援エージェント</strong>
              として、外国人求職者の面接をサポートします。
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
                <span>補足は面接官に送信されます</span>
              </div>
            </div>
          </div>

          {!isLoading && (
            <PatternSelector
              onStart={onPatternStart}
              disabled={!isConnected || isLoading}
            />
          )}
        </div>

        <div className="setup-card">
          <PersonaSelector onSelect={onPersonaSelect} />
        </div>
      </div>
    </div>
  );
}
