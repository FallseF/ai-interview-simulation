/**
 * ペルソナ選択コンポーネント
 *
 * 面接開始前に面接官・候補者のペルソナを設定する
 */

import { useState } from "react";
import type {
  PersonaConfig,
  InterviewerPersona,
  CandidatePersona,
  Gender,
  Industry,
  InterviewerPersonality,
  ForeignHiringLiteracy,
  Dialect,
  DifficultyMode,
  JapaneseLevel,
} from "../types/ws";

// ラベル定義
const GENDER_LABELS: Record<Gender, string> = {
  male: "男性",
  female: "女性",
};

const INDUSTRY_LABELS: Record<Industry, string> = {
  manufacturing: "製造業",
  nursing: "介護",
  restaurant: "飲食",
  retail: "小売",
  logistics: "物流",
  construction: "建設",
  it: "IT",
  other: "その他",
};

const PERSONALITY_LABELS: Record<InterviewerPersonality, string> = {
  detailed: "細かい（書類重視）",
  casual: "ガサツ（大まかに判断）",
  inquisitive: "質問が多い（深掘り型）",
  friendly: "フレンドリー（和やか）",
  strict: "厳格（ルール重視）",
};

const FOREIGN_HIRING_LITERACY_LABELS: Record<ForeignHiringLiteracy, string> = {
  high: "高い（外国人雇用に理解あり）",
  low: "低い（初めて・不慣れ）",
};

const DIALECT_LABELS: Record<Dialect, string> = {
  standard: "標準語",
  kansai: "関西弁",
  kyushu: "九州弁",
  tohoku: "東北弁",
};

const DIFFICULTY_LABELS: Record<DifficultyMode, string> = {
  beginner: "初心者モード（流れ重視）",
  hard: "ハードモード（ツッコミ・割り込み）",
};

const JAPANESE_LEVEL_LABELS: Record<JapaneseLevel, string> = {
  N5: "N5（初級・片言）",
  N4: "N4（初中級）",
  N3: "N3（中級・日常会話OK）",
  N2: "N2（中上級・ビジネス可）",
  N1: "N1（上級・ネイティブ級）",
};

// プリセット
interface PersonaPreset {
  id: string;
  name: string;
  description: string;
  interviewer: InterviewerPersona;
  candidate: CandidatePersona;
}

const PRESETS: PersonaPreset[] = [
  {
    id: "standard",
    name: "標準",
    description: "一般的な介護施設の面接シーン",
    interviewer: {
      gender: "male",
      industry: "nursing",
      personality: "friendly",
      foreignHiringLiteracy: "low",
      dialect: "standard",
      difficulty: "beginner",
    },
    candidate: {
      japaneseLevel: "N4",
      workExperience: false,
    },
  },
  {
    id: "strict-manufacturing",
    name: "厳格な製造業",
    description: "細かい製造業の面接官、ハードモード",
    interviewer: {
      gender: "male",
      industry: "manufacturing",
      personality: "detailed",
      foreignHiringLiteracy: "high",
      dialect: "standard",
      difficulty: "hard",
    },
    candidate: {
      japaneseLevel: "N3",
      workExperience: true,
    },
  },
  {
    id: "kansai-casual",
    name: "関西のフランクな面接",
    description: "関西弁でガサツだけどフレンドリー",
    interviewer: {
      gender: "male",
      industry: "restaurant",
      personality: "casual",
      foreignHiringLiteracy: "low",
      dialect: "kansai",
      difficulty: "beginner",
    },
    candidate: {
      japaneseLevel: "N4",
      workExperience: false,
    },
  },
  {
    id: "inquisitive-it",
    name: "質問多めのIT企業",
    description: "深掘り質問が多いIT企業の面接",
    interviewer: {
      gender: "female",
      industry: "it",
      personality: "inquisitive",
      foreignHiringLiteracy: "high",
      dialect: "standard",
      difficulty: "hard",
    },
    candidate: {
      japaneseLevel: "N2",
      workExperience: true,
    },
  },
];

interface PersonaSelectorProps {
  onSelect: (persona: PersonaConfig) => void;
  showInterviewer?: boolean;
  showCandidate?: boolean;
}

export function PersonaSelector({
  onSelect,
  showInterviewer = true,
  showCandidate = true,
}: PersonaSelectorProps) {
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [selectedPreset, setSelectedPreset] = useState<string>("standard");

  // カスタム設定の状態
  const [interviewer, setInterviewer] = useState<InterviewerPersona>({
    gender: "male",
    industry: "nursing",
    personality: "friendly",
    foreignHiringLiteracy: "low",
    dialect: "standard",
    difficulty: "beginner",
  });

  const [candidate, setCandidate] = useState<CandidatePersona>({
    japaneseLevel: "N4",
    workExperience: false,
  });

  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setInterviewer(preset.interviewer);
      setCandidate(preset.candidate);
    }
  };

  const handleApply = () => {
    const persona: PersonaConfig = {};
    if (showInterviewer) persona.interviewer = interviewer;
    if (showCandidate) persona.candidate = candidate;
    onSelect(persona);
  };

  return (
    <div className="persona-selector">
      <h3>ペルソナ設定</h3>

      {/* モード切り替え */}
      <div className="mode-toggle">
        <button
          className={mode === "preset" ? "active" : ""}
          onClick={() => setMode("preset")}
        >
          プリセット
        </button>
        <button
          className={mode === "custom" ? "active" : ""}
          onClick={() => setMode("custom")}
        >
          カスタム
        </button>
      </div>

      {mode === "preset" ? (
        /* プリセット選択 */
        <div className="preset-section">
          <div className="preset-list">
            {PRESETS.map((preset) => (
              <div
                key={preset.id}
                className={`preset-card ${selectedPreset === preset.id ? "selected" : ""}`}
                onClick={() => handlePresetChange(preset.id)}
              >
                <div className="preset-name">{preset.name}</div>
                <div className="preset-description">{preset.description}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* カスタム設定 */
        <div className="custom-section">
          {showInterviewer && (
            <div className="persona-group">
              <h4>面接官AI</h4>

              <label>
                性別
                <select
                  value={interviewer.gender}
                  onChange={(e) =>
                    setInterviewer({ ...interviewer, gender: e.target.value as Gender })
                  }
                >
                  {Object.entries(GENDER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                業種
                <select
                  value={interviewer.industry}
                  onChange={(e) =>
                    setInterviewer({ ...interviewer, industry: e.target.value as Industry })
                  }
                >
                  {Object.entries(INDUSTRY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                性格
                <select
                  value={interviewer.personality}
                  onChange={(e) =>
                    setInterviewer({
                      ...interviewer,
                      personality: e.target.value as InterviewerPersonality,
                    })
                  }
                >
                  {Object.entries(PERSONALITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                外国人雇用の理解度
                <select
                  value={interviewer.foreignHiringLiteracy}
                  onChange={(e) =>
                    setInterviewer({
                      ...interviewer,
                      foreignHiringLiteracy: e.target.value as ForeignHiringLiteracy,
                    })
                  }
                >
                  {Object.entries(FOREIGN_HIRING_LITERACY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                方言
                <select
                  value={interviewer.dialect}
                  onChange={(e) =>
                    setInterviewer({ ...interviewer, dialect: e.target.value as Dialect })
                  }
                >
                  {Object.entries(DIALECT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                難易度
                <select
                  value={interviewer.difficulty}
                  onChange={(e) =>
                    setInterviewer({
                      ...interviewer,
                      difficulty: e.target.value as DifficultyMode,
                    })
                  }
                >
                  {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {showCandidate && (
            <div className="persona-group">
              <h4>外国人候補者AI</h4>

              <label>
                日本語レベル
                <select
                  value={candidate.japaneseLevel}
                  onChange={(e) =>
                    setCandidate({
                      ...candidate,
                      japaneseLevel: e.target.value as JapaneseLevel,
                    })
                  }
                >
                  {Object.entries(JAPANESE_LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={candidate.workExperience ?? false}
                  onChange={(e) =>
                    setCandidate({ ...candidate, workExperience: e.target.checked })
                  }
                />
                日本での就労経験あり
              </label>
            </div>
          )}
        </div>
      )}

      <button className="apply-btn" onClick={handleApply}>
        この設定で開始
      </button>

      <style>{`
        .persona-selector {
          background: #1a1a1a;
          border-radius: 12px;
          padding: 20px;
          color: #fff;
        }

        .persona-selector h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
        }

        .mode-toggle {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .mode-toggle button {
          flex: 1;
          padding: 8px 16px;
          border: 1px solid #333;
          background: transparent;
          color: #888;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mode-toggle button.active {
          background: #333;
          color: #fff;
          border-color: #4ade80;
        }

        .preset-list {
          display: grid;
          gap: 12px;
        }

        .preset-card {
          padding: 12px 16px;
          border: 1px solid #333;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .preset-card:hover {
          border-color: #666;
        }

        .preset-card.selected {
          border-color: #4ade80;
          background: rgba(74, 222, 128, 0.1);
        }

        .preset-name {
          font-weight: bold;
          margin-bottom: 4px;
        }

        .preset-description {
          font-size: 12px;
          color: #888;
        }

        .custom-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .persona-group {
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
        }

        .persona-group h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #4ade80;
        }

        .persona-group label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #888;
        }

        .persona-group select {
          padding: 8px 12px;
          border: 1px solid #333;
          border-radius: 6px;
          background: #222;
          color: #fff;
          font-size: 14px;
        }

        .checkbox-label {
          flex-direction: row !important;
          align-items: center;
          gap: 8px !important;
        }

        .checkbox-label input {
          width: 16px;
          height: 16px;
        }

        .apply-btn {
          width: 100%;
          padding: 12px;
          margin-top: 16px;
          border: none;
          border-radius: 8px;
          background: #4ade80;
          color: #000;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }

        .apply-btn:hover {
          background: #22c55e;
        }
      `}</style>
    </div>
  );
}
