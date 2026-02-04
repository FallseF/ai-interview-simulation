/**
 * 評価エンジン
 *
 * トランスクリプトを分析してパフォーマンスを評価する
 */

import type { TranscriptEntry } from "../orchestrator/TranscriptStore.js";
import type {
  EvaluationResult,
  CategoryResult,
  CriterionResult,
  ProhibitedItem,
  RequiredItem,
  ManualItem,
} from "./types.js";
import { getGrade } from "./types.js";
import { EVALUATION_CONFIG } from "./criteria.js";

export class Evaluator {
  private sessionId: string;
  private startTime: Date;

  constructor(sessionId?: string, startTime?: Date) {
    this.sessionId = sessionId || Date.now().toString();
    this.startTime = startTime || new Date();
  }

  /**
   * トランスクリプトを評価してフィードバックを生成
   */
  evaluate(transcripts: TranscriptEntry[]): EvaluationResult {
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);

    // ヒューマン（転職支援エージェント）の発言のみを抽出
    const humanTranscripts = transcripts.filter((t) => t.speaker === "human");
    const humanText = humanTranscripts.map((t) => t.text).join("\n");

    // 全発言（コンテキスト用）
    const allText = transcripts.map((t) => `[${t.speaker}]: ${t.text}`).join("\n");

    // 各チェックを実行
    const prohibitedItemsFound = this.checkProhibitedItems(humanText, transcripts);
    const missingRequiredItems = this.checkRequiredItems(humanText);
    const manualViolations = this.checkManualItems(humanText);

    // カテゴリごとの評価
    const categoryResults = this.evaluateCategories(
      humanText,
      prohibitedItemsFound,
      missingRequiredItems
    );

    // 全体スコアの計算
    const { totalScore, maxScore } = this.calculateTotalScore(categoryResults);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const grade = getGrade(percentage);

    // フィードバックの生成
    const { summary, strengths, improvements, actionItems } = this.generateFeedback(
      categoryResults,
      prohibitedItemsFound,
      missingRequiredItems,
      manualViolations,
      percentage
    );

    return {
      sessionId: this.sessionId,
      evaluatedAt: endTime,
      duration,
      totalScore,
      maxScore,
      percentage,
      grade,
      categoryResults,
      prohibitedItemsFound,
      missingRequiredItems,
      manualViolations,
      summary,
      strengths,
      improvements,
      actionItems,
    };
  }

  /**
   * NGワード・禁止事項のチェック
   */
  private checkProhibitedItems(
    humanText: string,
    transcripts: TranscriptEntry[]
  ): EvaluationResult["prohibitedItemsFound"] {
    const found: EvaluationResult["prohibitedItemsFound"] = [];

    for (const item of EVALUATION_CONFIG.prohibitedItems) {
      const pattern =
        typeof item.pattern === "string"
          ? new RegExp(item.pattern, "gi")
          : item.pattern;

      const occurrences: Array<{ text: string; speaker: string }> = [];

      // ヒューマンの発言をチェック
      for (const transcript of transcripts.filter((t) => t.speaker === "human")) {
        if (pattern.test(transcript.text)) {
          occurrences.push({
            text: transcript.text,
            speaker: "human",
          });
        }
        // RegExpの場合はlastIndexをリセット
        if (pattern instanceof RegExp) {
          pattern.lastIndex = 0;
        }
      }

      if (occurrences.length > 0) {
        found.push({ item, occurrences });
      }
    }

    return found;
  }

  /**
   * 必須発言項目のチェック
   */
  private checkRequiredItems(humanText: string): RequiredItem[] {
    const missing: RequiredItem[] = [];

    for (const item of EVALUATION_CONFIG.requiredItems) {
      const hasKeyword = item.keywords.some((keyword) =>
        humanText.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasKeyword) {
        missing.push(item);
      }
    }

    return missing;
  }

  /**
   * マニュアル項目のチェック（誤った情報の検出）
   */
  private checkManualItems(
    humanText: string
  ): EvaluationResult["manualViolations"] {
    const violations: EvaluationResult["manualViolations"] = [];

    for (const item of EVALUATION_CONFIG.manualItems) {
      for (const incorrect of item.incorrectPatterns) {
        const pattern =
          typeof incorrect.pattern === "string"
            ? new RegExp(incorrect.pattern, "gi")
            : incorrect.pattern;

        if (pattern.test(humanText)) {
          violations.push({
            item,
            violation: humanText.match(pattern)?.[0] || "",
            feedback: incorrect.feedback,
          });
        }
      }
    }

    return violations;
  }

  /**
   * カテゴリごとの評価
   */
  private evaluateCategories(
    humanText: string,
    prohibitedItemsFound: EvaluationResult["prohibitedItemsFound"],
    missingRequiredItems: RequiredItem[]
  ): CategoryResult[] {
    const results: CategoryResult[] = [];

    for (const category of EVALUATION_CONFIG.categories) {
      const criterionResults: CriterionResult[] = [];

      for (const criterion of category.criteria) {
        let score = criterion.maxPoints;
        let feedback = "";
        let passed = true;

        if (criterion.checkType === "required") {
          // 必須項目チェック
          const relatedMissing = missingRequiredItems.filter(
            (item) =>
              item.id.includes(criterion.id) ||
              criterion.id.includes(item.id.split("-")[1] || "")
          );
          if (relatedMissing.length > 0) {
            score = 0;
            passed = false;
            feedback = relatedMissing.map((item) => item.feedback.missing).join(" ");
          } else {
            feedback = "必要な情報を適切に伝えています。";
          }
        } else if (criterion.checkType === "prohibited") {
          // 禁止事項チェック
          const violations = prohibitedItemsFound.filter(
            (found) => found.item.id.includes(criterion.id)
          );
          if (violations.length > 0) {
            score = 0;
            passed = false;
            feedback = violations.map((v) => v.item.feedback).join(" ");
          } else {
            feedback = "不適切な表現はありませんでした。";
          }
        } else {
          // 品質評価（簡易版：発言の長さと内容で評価）
          const hasContent = humanText.length > 50;
          if (!hasContent) {
            score = Math.floor(criterion.maxPoints * 0.5);
            feedback = "より詳細な説明があると良いでしょう。";
          } else {
            score = criterion.maxPoints;
            feedback = "適切な対応ができています。";
          }
        }

        criterionResults.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          score,
          maxScore: criterion.maxPoints,
          passed,
          feedback,
        });
      }

      const categoryScore = criterionResults.reduce((sum, r) => sum + r.score, 0);
      const categoryMaxScore = criterionResults.reduce(
        (sum, r) => sum + r.maxScore,
        0
      );

      results.push({
        categoryId: category.id,
        categoryName: category.name,
        score: categoryScore,
        maxScore: categoryMaxScore,
        percentage:
          categoryMaxScore > 0
            ? Math.round((categoryScore / categoryMaxScore) * 100)
            : 0,
        criterionResults,
      });
    }

    return results;
  }

  /**
   * 全体スコアの計算
   */
  private calculateTotalScore(categoryResults: CategoryResult[]): {
    totalScore: number;
    maxScore: number;
  } {
    let totalScore = 0;
    let maxScore = 0;

    for (let i = 0; i < categoryResults.length; i++) {
      const category = EVALUATION_CONFIG.categories[i];
      const result = categoryResults[i];

      totalScore += result.score * category.weight;
      maxScore += result.maxScore * category.weight;
    }

    return {
      totalScore: Math.round(totalScore),
      maxScore: Math.round(maxScore),
    };
  }

  /**
   * フィードバックの生成
   */
  private generateFeedback(
    categoryResults: CategoryResult[],
    prohibitedItemsFound: EvaluationResult["prohibitedItemsFound"],
    missingRequiredItems: RequiredItem[],
    manualViolations: EvaluationResult["manualViolations"],
    percentage: number
  ): {
    summary: string;
    strengths: string[];
    improvements: string[];
    actionItems: string[];
  } {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const actionItems: string[] = [];

    // カテゴリごとの評価からフィードバック生成
    for (const result of categoryResults) {
      if (result.percentage >= 80) {
        strengths.push(`${result.categoryName}：優れた対応ができています。`);
      } else if (result.percentage < 60) {
        improvements.push(
          `${result.categoryName}：改善が必要です（${result.percentage}%）。`
        );
      }
    }

    // 禁止事項違反のフィードバック
    for (const found of prohibitedItemsFound) {
      if (found.item.severity === "critical") {
        improvements.push(`【重大】${found.item.feedback}`);
        actionItems.push(
          `${found.item.description}について、正しい知識を確認してください。`
        );
      } else if (found.item.severity === "major") {
        improvements.push(found.item.feedback);
      }
    }

    // 必須項目の不足
    for (const item of missingRequiredItems) {
      improvements.push(item.feedback.missing);
      actionItems.push(`「${item.name}」について必ず言及するようにしましょう。`);
    }

    // マニュアル違反
    for (const violation of manualViolations) {
      improvements.push(violation.feedback);
      actionItems.push(
        `${violation.item.topic}について、マニュアルを再確認してください。`
      );
    }

    // サマリー生成
    let summary: string;
    if (percentage >= EVALUATION_CONFIG.passingScore) {
      if (prohibitedItemsFound.some((f) => f.item.severity === "critical")) {
        summary =
          "基本的な対応はできていますが、重大な問題がありました。指摘事項を確認し、改善してください。";
      } else if (percentage >= 90) {
        summary = "素晴らしい対応でした！細かい点を意識すればさらに良くなります。";
      } else {
        summary = "合格ラインに達しています。改善点を意識して次回に活かしましょう。";
      }
    } else {
      summary = `合格ライン（${EVALUATION_CONFIG.passingScore}%）に達していません。指摘事項を確認し、再度練習しましょう。`;
    }

    // デフォルトの強み（何もない場合）
    if (strengths.length === 0) {
      strengths.push("面接への参加姿勢は良好です。");
    }

    // デフォルトの改善点（何もない場合）
    if (improvements.length === 0 && percentage < 100) {
      improvements.push("より積極的にサポートの提案をしましょう。");
    }

    return { summary, strengths, improvements, actionItems };
  }
}
