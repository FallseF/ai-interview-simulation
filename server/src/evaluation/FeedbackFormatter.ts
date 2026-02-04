/**
 * フィードバックフォーマッター
 *
 * 評価結果を見やすい形式に整形する
 */

import type { EvaluationResult, EvaluationGrade } from "./types.js";
import { EVALUATION_CONFIG } from "./criteria.js";

/**
 * グレードに応じた絵文字
 */
const GRADE_EMOJI: Record<EvaluationGrade, string> = {
  S: "🌟",
  A: "✨",
  B: "👍",
  C: "📝",
  D: "⚠️",
  F: "❌",
};

/**
 * グレードに応じたメッセージ
 */
const GRADE_MESSAGE: Record<EvaluationGrade, string> = {
  S: "素晴らしい！完璧な対応でした",
  A: "とても良い対応でした",
  B: "良い対応でした",
  C: "合格ですが改善の余地があります",
  D: "改善が必要です",
  F: "不合格です。再度練習しましょう",
};

export class FeedbackFormatter {
  /**
   * コンソール用のテキスト形式でフォーマット
   */
  static toText(result: EvaluationResult): string {
    const lines: string[] = [];

    // ヘッダー
    lines.push("═".repeat(50));
    lines.push("📋 評価レポート");
    lines.push("═".repeat(50));
    lines.push("");

    // 総合評価
    lines.push("【総合評価】");
    lines.push(`  グレード: ${GRADE_EMOJI[result.grade]} ${result.grade}`);
    lines.push(`  スコア: ${result.totalScore}/${result.maxScore} (${result.percentage}%)`);
    lines.push(`  ${GRADE_MESSAGE[result.grade]}`);
    lines.push("");

    // 合否判定
    const passed = result.percentage >= EVALUATION_CONFIG.passingScore;
    const criticalViolations = result.prohibitedItemsFound.filter(
      (f) => f.item.severity === "critical"
    );
    const hasCritical = criticalViolations.length > 0;

    if (passed && !hasCritical) {
      lines.push("✅ 判定: 合格");
    } else {
      lines.push("❌ 判定: 不合格");
      if (hasCritical) {
        lines.push("   ※ 重大な問題が検出されました");
      }
    }
    lines.push("");

    // サマリー
    lines.push("【サマリー】");
    lines.push(`  ${result.summary}`);
    lines.push("");

    // カテゴリ別評価
    lines.push("【カテゴリ別評価】");
    for (const category of result.categoryResults) {
      const bar = this.createProgressBar(category.percentage);
      lines.push(`  ${category.categoryName}: ${bar} ${category.percentage}%`);
    }
    lines.push("");

    // 良かった点
    if (result.strengths.length > 0) {
      lines.push("【良かった点】");
      for (const strength of result.strengths) {
        lines.push(`  ✓ ${strength}`);
      }
      lines.push("");
    }

    // 改善点
    if (result.improvements.length > 0) {
      lines.push("【改善点】");
      for (const improvement of result.improvements) {
        lines.push(`  • ${improvement}`);
      }
      lines.push("");
    }

    // 重大な問題
    if (criticalViolations.length > 0) {
      lines.push("【⚠️ 重大な問題】");
      for (const violation of criticalViolations) {
        lines.push(`  ❌ ${violation.item.description}`);
        lines.push(`     ${violation.item.feedback}`);
        if (violation.occurrences.length > 0) {
          lines.push(`     発言: "${violation.occurrences[0].text.slice(0, 50)}..."`);
        }
      }
      lines.push("");
    }

    // 必須項目の不足
    if (result.missingRequiredItems.length > 0) {
      lines.push("【不足している必須項目】");
      for (const item of result.missingRequiredItems) {
        lines.push(`  ⚠ ${item.name}`);
        lines.push(`    ${item.feedback.missing}`);
      }
      lines.push("");
    }

    // アクションアイテム
    if (result.actionItems.length > 0) {
      lines.push("【次のステップ】");
      for (let i = 0; i < result.actionItems.length; i++) {
        lines.push(`  ${i + 1}. ${result.actionItems[i]}`);
      }
      lines.push("");
    }

    // フッター
    lines.push("─".repeat(50));
    lines.push(`評価日時: ${result.evaluatedAt.toLocaleString("ja-JP")}`);
    lines.push(`面接時間: ${Math.floor(result.duration / 60)}分${result.duration % 60}秒`);
    lines.push("═".repeat(50));

    return lines.join("\n");
  }

  /**
   * WebSocket送信用のJSON形式
   */
  static toJSON(result: EvaluationResult): object {
    const passed =
      result.percentage >= EVALUATION_CONFIG.passingScore &&
      result.prohibitedItemsFound.filter((f) => f.item.severity === "critical")
        .length === 0;

    return {
      passed,
      grade: result.grade,
      gradeEmoji: GRADE_EMOJI[result.grade],
      gradeMessage: GRADE_MESSAGE[result.grade],
      score: {
        total: result.totalScore,
        max: result.maxScore,
        percentage: result.percentage,
      },
      summary: result.summary,
      categories: result.categoryResults.map((cat) => ({
        name: cat.categoryName,
        score: cat.score,
        maxScore: cat.maxScore,
        percentage: cat.percentage,
      })),
      strengths: result.strengths,
      improvements: result.improvements,
      actionItems: result.actionItems,
      criticalIssues: result.prohibitedItemsFound
        .filter((f) => f.item.severity === "critical")
        .map((f) => ({
          description: f.item.description,
          feedback: f.item.feedback,
        })),
      missingItems: result.missingRequiredItems.map((item) => ({
        name: item.name,
        feedback: item.feedback.missing,
      })),
      duration: result.duration,
      evaluatedAt: result.evaluatedAt.toISOString(),
    };
  }

  /**
   * 簡易版のフィードバック（チャット表示用）
   */
  static toChat(result: EvaluationResult): string {
    const passed =
      result.percentage >= EVALUATION_CONFIG.passingScore &&
      result.prohibitedItemsFound.filter((f) => f.item.severity === "critical")
        .length === 0;

    const lines: string[] = [];

    lines.push(`${GRADE_EMOJI[result.grade]} **評価: ${result.grade}** (${result.percentage}%)`);
    lines.push("");
    lines.push(passed ? "✅ **合格**" : "❌ **不合格**");
    lines.push("");
    lines.push(result.summary);

    if (result.improvements.length > 0) {
      lines.push("");
      lines.push("**改善点:**");
      for (const improvement of result.improvements.slice(0, 3)) {
        lines.push(`• ${improvement}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * プログレスバーを生成
   */
  private static createProgressBar(percentage: number): string {
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  }
}
