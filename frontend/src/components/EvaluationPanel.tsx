/**
 * 評価結果パネル
 *
 * 面接終了後に表示される評価・フィードバック
 */

import type { EvaluationResult } from "../types/ws";

interface EvaluationPanelProps {
  result: EvaluationResult;
  onClose?: () => void;
}

export function EvaluationPanel({ result, onClose }: EvaluationPanelProps) {
  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}分${sec}秒`;
  };

  return (
    <div className="evaluation-overlay">
      <div className="evaluation-panel">
        {/* ヘッダー */}
        <div className="evaluation-header">
          <h2>評価レポート</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        {/* 総合評価 */}
        <div className="evaluation-summary">
          <div className="grade-section">
            <span className="grade-emoji">{result.gradeEmoji}</span>
            <span className="grade-letter">{result.grade}</span>
            <span className="grade-message">{result.gradeMessage}</span>
          </div>

          <div className="score-section">
            <div className="score-bar-container">
              <div
                className="score-bar"
                style={{ width: `${result.score.percentage}%` }}
              />
            </div>
            <span className="score-text">
              {result.score.total}/{result.score.max} ({result.score.percentage}%)
            </span>
          </div>

          <div className={`pass-status ${result.passed ? "passed" : "failed"}`}>
            {result.passed ? "✅ 合格" : "❌ 不合格"}
          </div>
        </div>

        {/* サマリー */}
        <div className="evaluation-section">
          <p className="summary-text">{result.summary}</p>
        </div>

        {/* カテゴリ別評価 */}
        <div className="evaluation-section">
          <h3>カテゴリ別評価</h3>
          <div className="category-list">
            {result.categories.map((cat, i) => (
              <div key={i} className="category-item">
                <span className="category-name">{cat.name}</span>
                <div className="category-bar-container">
                  <div
                    className="category-bar"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor:
                        cat.percentage >= 80
                          ? "#4ade80"
                          : cat.percentage >= 60
                          ? "#fbbf24"
                          : "#f87171",
                    }}
                  />
                </div>
                <span className="category-percentage">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 良かった点 */}
        {result.strengths.length > 0 && (
          <div className="evaluation-section">
            <h3>良かった点</h3>
            <ul className="feedback-list strengths">
              {result.strengths.map((item, i) => (
                <li key={i}>✓ {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 改善点 */}
        {result.improvements.length > 0 && (
          <div className="evaluation-section">
            <h3>改善点</h3>
            <ul className="feedback-list improvements">
              {result.improvements.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 重大な問題 */}
        {result.criticalIssues.length > 0 && (
          <div className="evaluation-section critical">
            <h3>⚠️ 重大な問題</h3>
            <ul className="feedback-list critical-list">
              {result.criticalIssues.map((issue, i) => (
                <li key={i}>
                  <strong>{issue.description}</strong>
                  <p>{issue.feedback}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 不足項目 */}
        {result.missingItems.length > 0 && (
          <div className="evaluation-section">
            <h3>不足している必須項目</h3>
            <ul className="feedback-list missing-list">
              {result.missingItems.map((item, i) => (
                <li key={i}>
                  <strong>{item.name}</strong>
                  <p>{item.feedback}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* アクションアイテム */}
        {result.actionItems.length > 0 && (
          <div className="evaluation-section">
            <h3>次のステップ</h3>
            <ol className="action-list">
              {result.actionItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>
        )}

        {/* フッター */}
        <div className="evaluation-footer">
          <span>面接時間: {formatDuration(result.duration)}</span>
          <span>評価日時: {new Date(result.evaluatedAt).toLocaleString("ja-JP")}</span>
        </div>
      </div>

      <style>{`
        .evaluation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          overflow-y: auto;
          padding: 20px;
        }

        .evaluation-panel {
          background: #1a1a1a;
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          color: #fff;
        }

        .evaluation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .evaluation-header h2 {
          margin: 0;
          font-size: 20px;
        }

        .close-btn {
          background: none;
          border: none;
          color: #888;
          font-size: 24px;
          cursor: pointer;
        }

        .close-btn:hover {
          color: #fff;
        }

        .evaluation-summary {
          padding: 20px;
          text-align: center;
          border-bottom: 1px solid #333;
        }

        .grade-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .grade-emoji {
          font-size: 48px;
        }

        .grade-letter {
          font-size: 48px;
          font-weight: bold;
        }

        .grade-message {
          font-size: 14px;
          color: #888;
        }

        .score-section {
          margin-bottom: 16px;
        }

        .score-bar-container {
          background: #333;
          border-radius: 8px;
          height: 12px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .score-bar {
          height: 100%;
          background: linear-gradient(90deg, #4ade80, #22c55e);
          border-radius: 8px;
          transition: width 0.5s ease;
        }

        .score-text {
          font-size: 18px;
          font-weight: bold;
        }

        .pass-status {
          font-size: 24px;
          font-weight: bold;
          padding: 8px 16px;
          border-radius: 8px;
          display: inline-block;
        }

        .pass-status.passed {
          background: rgba(74, 222, 128, 0.2);
          color: #4ade80;
        }

        .pass-status.failed {
          background: rgba(248, 113, 113, 0.2);
          color: #f87171;
        }

        .evaluation-section {
          padding: 16px 20px;
          border-bottom: 1px solid #333;
        }

        .evaluation-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          color: #888;
        }

        .evaluation-section.critical {
          background: rgba(248, 113, 113, 0.1);
        }

        .summary-text {
          margin: 0;
          line-height: 1.6;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .category-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-name {
          width: 120px;
          font-size: 14px;
        }

        .category-bar-container {
          flex: 1;
          background: #333;
          border-radius: 4px;
          height: 8px;
          overflow: hidden;
        }

        .category-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .category-percentage {
          width: 40px;
          text-align: right;
          font-size: 14px;
        }

        .feedback-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .feedback-list li {
          padding: 8px 0;
          line-height: 1.5;
        }

        .feedback-list.strengths li {
          color: #4ade80;
        }

        .feedback-list.improvements li {
          color: #fbbf24;
        }

        .feedback-list.critical-list li {
          color: #f87171;
        }

        .feedback-list li strong {
          display: block;
          margin-bottom: 4px;
        }

        .feedback-list li p {
          margin: 0;
          font-size: 14px;
          color: #888;
        }

        .action-list {
          margin: 0;
          padding-left: 20px;
        }

        .action-list li {
          padding: 6px 0;
          line-height: 1.5;
        }

        .evaluation-footer {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </div>
  );
}
