import type { EvaluationResult, InterviewState } from "../../types/ws";

interface ResultPhaseProps {
  evaluationResult: EvaluationResult | null;
  endReason?: InterviewState["endReason"];
  onRestart: () => void;
}

export function ResultPhase({
  evaluationResult,
  endReason,
  onRestart,
}: ResultPhaseProps) {
  const isAborted = endReason === "aborted";

  return (
    <div className="phase-content result-phase">
      <div className="result-container">
        {/* Header */}
        <div className="result-header">
          <div className={`result-icon ${isAborted ? "aborted" : ""}`}>
            {isAborted ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            ) : (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            )}
          </div>
          <h2 className="result-title">
            {isAborted ? "面接が中断されました" : "面接が終了しました"}
          </h2>
        </div>

        {/* Evaluation Content */}
        {evaluationResult && !isAborted ? (
          <div className="result-evaluation">
            {/* Grade Section */}
            <div className="result-grade-section">
              <div className="result-grade-badge">
                <span className="grade-emoji">{evaluationResult.gradeEmoji}</span>
                <span className="grade-letter">{evaluationResult.grade}</span>
              </div>
              <div className="result-grade-info">
                <div className="grade-message">{evaluationResult.gradeMessage}</div>
                <div className="grade-score">
                  スコア: {evaluationResult.score.total} / {evaluationResult.score.max}
                  <span className="grade-percentage">
                    ({evaluationResult.score.percentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="result-summary">
              <p>{evaluationResult.summary}</p>
            </div>

            {/* Categories */}
            <div className="result-categories">
              <h3>評価カテゴリ</h3>
              <div className="category-grid">
                {evaluationResult.categories.map((cat) => (
                  <div key={cat.name} className="category-item">
                    <div className="category-header">
                      <span className="category-name">{cat.name}</span>
                      <span className="category-score">
                        {cat.score}/{cat.maxScore}
                      </span>
                    </div>
                    <div className="category-bar">
                      <div
                        className="category-fill"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="result-feedback-grid">
              <div className="feedback-section strengths">
                <h4>良かった点</h4>
                <ul>
                  {evaluationResult.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="feedback-section improvements">
                <h4>改善点</h4>
                <ul>
                  {evaluationResult.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Items */}
            {evaluationResult.actionItems.length > 0 && (
              <div className="result-actions">
                <h4>アクションアイテム</h4>
                <ul>
                  {evaluationResult.actionItems.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Issues */}
            {evaluationResult.criticalIssues.length > 0 && (
              <div className="result-critical">
                <h4>重要な課題</h4>
                {evaluationResult.criticalIssues.map((issue, i) => (
                  <div key={i} className="critical-item">
                    <strong>{issue.description}</strong>
                    <p>{issue.feedback}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="result-empty">
            <p>
              {isAborted
                ? "面接は中断されたため、評価結果はありません。"
                : "評価結果を読み込み中..."}
            </p>
          </div>
        )}

        {/* Restart Button */}
        <div className="result-actions-bar">
          <button className="action-btn primary" onClick={onRestart}>
            もう一度
          </button>
        </div>
      </div>
    </div>
  );
}
