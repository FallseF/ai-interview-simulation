import { useEffect, useMemo, useState } from "react";
import type {
  EvaluationResult,
  SessionSummary,
  TranscriptRecord,
  PersonaConfig,
  InterviewPattern,
  InterviewMode,
} from "../types/ws";

// API base URL - use environment variable or relative path
const API_BASE = import.meta.env.VITE_API_URL || "";

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
}

const PATTERN_LABELS: Record<InterviewPattern, string> = {
  pattern1: "出席確認・自己紹介練習",
  pattern2: "面接本番",
  pattern3: "ヒアリング・クロージング",
};

const MODE_LABELS: Record<InterviewMode, string> = {
  step: "ステップ",
  auto: "オート",
};

const PERSONA_LABELS: Record<string, Record<string, string>> = {
  gender: { male: "男性", female: "女性" },
  industry: {
    manufacturing: "製造業",
    nursing: "介護",
    restaurant: "飲食",
    retail: "小売",
    logistics: "物流",
    construction: "建設",
    it: "IT",
    other: "その他",
  },
  personality: {
    detailed: "細かい",
    casual: "ガサツ",
    inquisitive: "質問が多い",
    friendly: "フレンドリー",
    strict: "厳格",
  },
  foreignHiringLiteracy: {
    high: "理解あり",
    low: "不慣れ",
  },
  dialect: {
    standard: "標準語",
    kansai: "関西弁",
    kyushu: "九州弁",
    tohoku: "東北弁",
  },
  difficulty: {
    beginner: "初心者",
    hard: "ハード",
  },
  japaneseLevel: {
    N5: "N5",
    N4: "N4",
    N3: "N3",
    N2: "N2",
    N1: "N1",
  },
};

export function HistoryModal({ open, onClose }: HistoryModalProps) {
  const [dbEnabled, setDbEnabled] = useState<boolean | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionSummary | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const statusRes = await fetch(`${API_BASE}/api/db/status`, { signal: controller.signal });
        const statusJson = await statusRes.json();
        setDbEnabled(Boolean(statusJson.enabled));

        const res = await fetch(`${API_BASE}/api/sessions/recent?limit=50`, { signal: controller.signal });
        const json = await res.json();
        const list = (json.sessions || []) as SessionSummary[];
        setSessions(list);
        if (list.length > 0) {
          setSelectedId((prev) => prev ?? list[0].id);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open || !selectedId) return;

    const controller = new AbortController();
    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const [sessionRes, transcriptRes] = await Promise.all([
          fetch(`${API_BASE}/api/sessions/${selectedId}`, { signal: controller.signal }),
          fetch(`${API_BASE}/api/sessions/${selectedId}/transcripts`, { signal: controller.signal }),
        ]);
        const sessionJson = await sessionRes.json();
        const transcriptJson = await transcriptRes.json();
        setDetail(sessionJson.session || null);
        setTranscripts(transcriptJson.transcripts || []);

        const evalRes = await fetch(`${API_BASE}/api/sessions/${selectedId}/evaluation`, {
          signal: controller.signal,
        });
        if (evalRes.ok) {
          const evalJson = await evalRes.json();
          setEvaluation(evalJson.evaluation || null);
        } else {
          setEvaluation(null);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setDetailLoading(false);
      }
    };

    loadDetail();
    return () => controller.abort();
  }, [open, selectedId]);

  const selectedSession = useMemo(() => {
    return detail || sessions.find((item) => item.id === selectedId) || null;
  }, [detail, sessions, selectedId]);

  if (!open) return null;

  return (
    <div className="history-overlay">
      <div className="history-modal">
        <aside className="history-sidebar">
          <div className="history-sidebar-header">
            <div>
              <h2>履歴</h2>
              <p>過去の面接ログと評価</p>
            </div>
            <button className="history-close" onClick={onClose}>
              ×
            </button>
          </div>

          {dbEnabled === false && (
            <div className="history-warning">DBが無効です（TURSO_DATABASE_URL未設定）</div>
          )}

          {loading ? (
            <div className="history-loading">読み込み中...</div>
          ) : sessions.length === 0 ? (
            <div className="history-empty">保存済みの面接がありません。</div>
          ) : (
            <div className="history-list">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className={`history-item ${session.id === selectedId ? "active" : ""}`}
                  onClick={() => setSelectedId(session.id)}
                >
                  <div className="history-item-title">
                    {PATTERN_LABELS[session.pattern]}
                  </div>
                  <div className="history-item-meta">
                    <span>{MODE_LABELS[session.mode]}</span>
                    <span>•</span>
                    <span>{formatDate(session.startedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="history-content">
          {selectedSession ? (
            detailLoading ? (
              <div className="history-loading">詳細を読み込み中...</div>
            ) : (
              <>
                <div className="history-title">
                  <h3>{PATTERN_LABELS[selectedSession.pattern]}</h3>
                  <span>{formatDate(selectedSession.startedAt)}</span>
                </div>

                <div className="history-properties">
                  {renderProperty("モード", MODE_LABELS[selectedSession.mode])}
                  {renderProperty("日本語レベル", selectedSession.japaneseLevel || "-")}
                  {renderProperty(
                    "所要時間",
                    selectedSession.durationSeconds != null
                      ? `${Math.floor(selectedSession.durationSeconds / 60)}分${
                          selectedSession.durationSeconds % 60
                        }秒`
                      : "-"
                  )}
                  {renderProperty("終了理由", selectedSession.endReason || "-")}
                  {evaluation
                    ? renderProperty("評価", `${evaluation.grade} (${evaluation.score.percentage}%)`)
                    : renderProperty("評価", "未実施")}
                </div>

                <div className="history-section">
                  <h4>ペルソナ</h4>
                  {selectedSession.persona ? (
                    <div className="history-tags">
                      {renderPersonaTags(selectedSession.persona)}
                    </div>
                  ) : (
                    <p className="history-muted">保存されたペルソナはありません。</p>
                  )}
                </div>

                <div className="history-section">
                  <h4>評価サマリー</h4>
                  {evaluation ? (
                    <>
                      <p className="history-summary">{evaluation.summary}</p>
                      <div className="history-eval-grid">
                        <div>
                          <h5>良かった点</h5>
                          <ul>
                            {evaluation.strengths.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5>改善点</h5>
                          <ul>
                            {evaluation.improvements.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="history-muted">評価結果はまだ保存されていません。</p>
                  )}
                </div>

                <div className="history-section">
                  <h4>会話ログ</h4>
                  {transcripts.length === 0 ? (
                    <p className="history-muted">ログがありません。</p>
                  ) : (
                    <div className="history-transcripts">
                      {transcripts.map((item, idx) => (
                        <div key={idx} className="history-transcript">
                          <span className={`history-speaker ${String(item.speaker)}`}>
                            {speakerLabel(String(item.speaker))}
                          </span>
                          <div>
                            <div className="history-text">{item.text}</div>
                            <div className="history-timestamp">{formatDate(item.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )
          ) : (
            <div className="history-empty">履歴を選択してください。</div>
          )}
        </section>
      </div>
    </div>
  );
}

function renderProperty(label: string, value: string) {
  return (
    <div className="history-property" key={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function renderPersonaTags(persona: PersonaConfig) {
  const tags: string[] = [];
  if (persona.interviewer) {
    const p = persona.interviewer;
    tags.push(`面接官: ${labelOf("gender", p.gender)} / ${labelOf("personality", p.personality)}`);
    tags.push(`業種: ${labelOf("industry", p.industry)}`);
    tags.push(`方言: ${labelOf("dialect", p.dialect)} / 難易度: ${labelOf("difficulty", p.difficulty)}`);
    tags.push(`外国人雇用: ${labelOf("foreignHiringLiteracy", p.foreignHiringLiteracy)}`);
  }
  if (persona.candidate) {
    const c = persona.candidate;
    tags.push(`候補者: 日本語${labelOf("japaneseLevel", c.japaneseLevel)}`);
    if (c.workExperience) tags.push("就労経験あり");
  }
  return tags.map((tag) => <span key={tag}>{tag}</span>);
}

function labelOf(group: string, key?: string) {
  if (!key) return "-";
  return PERSONA_LABELS[group]?.[key] ?? key;
}

function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function speakerLabel(speaker: string) {
  switch (speaker) {
    case "interviewer":
      return "面接官";
    case "candidate":
      return "求職者";
    case "human":
      return "転職支援";
    default:
      return speaker;
  }
}
