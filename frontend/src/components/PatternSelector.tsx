import { useState } from "react";
import type { InterviewPattern, JapaneseLevel } from "../types/ws";

interface PatternSelectorProps {
  onStart: (pattern: InterviewPattern, japaneseLevel?: JapaneseLevel) => void;
  disabled?: boolean;
}

interface PatternInfo {
  id: InterviewPattern;
  title: string;
  description: string;
  recommended?: boolean;
}

const patterns: PatternInfo[] = [
  {
    id: "pattern1",
    title: "パターン1: 出席確認・自己紹介練習",
    description: "営業担当と外国人学生の練習",
  },
  {
    id: "pattern2",
    title: "パターン2: 面接本番",
    description: "営業担当・外国人学生・面接官の3者面接",
    recommended: true,
  },
  {
    id: "pattern3",
    title: "パターン3: ヒアリング・クロージング",
    description: "学生退席後、面接官とのヒアリング",
  },
];

const japaneseLevels: { value: JapaneseLevel; label: string }[] = [
  { value: "N5", label: "N5: 初級（ほぼ片言）" },
  { value: "N4", label: "N4: 初中級" },
  { value: "N3", label: "N3: 中級" },
  { value: "N2", label: "N2: 中上級" },
  { value: "N1", label: "N1: 上級" },
];

export function PatternSelector({
  onStart,
  disabled = false,
}: PatternSelectorProps) {
  const [selectedPattern, setSelectedPattern] = useState<InterviewPattern>("pattern2");
  const [japaneseLevel, setJapaneseLevel] = useState<JapaneseLevel>("N4");

  const showJapaneseLevel = selectedPattern === "pattern1" || selectedPattern === "pattern2";

  const handleStart = () => {
    if (showJapaneseLevel) {
      onStart(selectedPattern, japaneseLevel);
    } else {
      onStart(selectedPattern);
    }
  };

  return (
    <div className="pattern-selector">
      <div className="pattern-selector-title">面接パターンを選択</div>

      <div className="pattern-cards">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            className={`pattern-card ${selectedPattern === pattern.id ? "active" : ""}`}
            onClick={() => setSelectedPattern(pattern.id)}
            disabled={disabled}
            type="button"
          >
            <div className="pattern-card-header">
              <span className="pattern-card-title">{pattern.title}</span>
              {pattern.recommended && (
                <span className="pattern-card-badge">推奨</span>
              )}
            </div>
            <div className="pattern-card-description">{pattern.description}</div>
          </button>
        ))}
      </div>

      {showJapaneseLevel && (
        <div className="japanese-level-selector">
          <label htmlFor="japanese-level" className="japanese-level-label">
            日本語レベル
          </label>
          <select
            id="japanese-level"
            className="japanese-level-select"
            value={japaneseLevel}
            onChange={(e) => setJapaneseLevel(e.target.value as JapaneseLevel)}
            disabled={disabled}
          >
            {japaneseLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        className="control-btn start"
        onClick={handleStart}
        disabled={disabled}
        type="button"
      >
        面接を開始
      </button>
    </div>
  );
}
