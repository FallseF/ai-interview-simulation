/**
 * 評価システムの型定義
 *
 * ロープレ終了後のパフォーマンス評価に使用
 */

// ========================================
// 評価基準の定義
// ========================================

/**
 * 評価カテゴリ
 */
export interface EvaluationCategory {
  id: string;
  name: string;
  description: string;
  weight: number; // 全体スコアへの重み (0-1)
  criteria: EvaluationCriterion[];
}

/**
 * 個別の評価基準
 */
export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  checkType: "required" | "prohibited" | "quality";
  // required: 言うべきことを言ったか
  // prohibited: NGワード/行動を避けたか
  // quality: 品質評価（内容の正確さなど）
}

/**
 * NGワード/フレーズの定義
 */
export interface ProhibitedItem {
  id: string;
  pattern: string | RegExp;
  description: string;
  severity: "critical" | "major" | "minor";
  // critical: 即不合格レベル
  // major: 大きな減点
  // minor: 軽微な減点
  deduction: number; // 減点数
  feedback: string; // 指摘内容
}

/**
 * 必須発言項目の定義
 */
export interface RequiredItem {
  id: string;
  name: string;
  description: string;
  keywords: string[]; // この中の1つでも含まれていればOK
  points: number;
  feedback: {
    present: string; // 言えていた場合のコメント
    missing: string; // 言えていなかった場合のコメント
  };
}

/**
 * マニュアル項目の定義
 */
export interface ManualItem {
  id: string;
  topic: string;
  correctInfo: string;
  keywords: string[]; // 正しい情報に含まれるべきキーワード
  incorrectPatterns: Array<{
    pattern: string | RegExp;
    feedback: string;
  }>;
}

// ========================================
// 評価結果の型
// ========================================

/**
 * 個別項目の評価結果
 */
export interface CriterionResult {
  criterionId: string;
  criterionName: string;
  score: number;
  maxScore: number;
  passed: boolean;
  feedback: string;
  evidence?: string; // 該当する発言の引用
}

/**
 * カテゴリごとの評価結果
 */
export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  score: number;
  maxScore: number;
  percentage: number;
  criterionResults: CriterionResult[];
}

/**
 * 全体の評価結果
 */
export interface EvaluationResult {
  // 基本情報
  sessionId: string;
  evaluatedAt: Date;
  duration: number; // 面接時間（秒）

  // スコア
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: EvaluationGrade;

  // 詳細結果
  categoryResults: CategoryResult[];

  // 検出された問題
  prohibitedItemsFound: Array<{
    item: ProhibitedItem;
    occurrences: Array<{
      text: string;
      speaker: string;
    }>;
  }>;

  // 不足している必須項目
  missingRequiredItems: RequiredItem[];

  // マニュアル違反
  manualViolations: Array<{
    item: ManualItem;
    violation: string;
    feedback: string;
  }>;

  // フィードバック
  summary: string;
  strengths: string[];
  improvements: string[];
  actionItems: string[];
}

/**
 * 評価グレード
 */
export type EvaluationGrade = "S" | "A" | "B" | "C" | "D" | "F";

/**
 * グレード判定の閾値
 */
export const GRADE_THRESHOLDS: Record<EvaluationGrade, number> = {
  S: 95,
  A: 85,
  B: 75,
  C: 65,
  D: 50,
  F: 0,
};

/**
 * パーセンテージからグレードを判定
 */
export function getGrade(percentage: number): EvaluationGrade {
  if (percentage >= GRADE_THRESHOLDS.S) return "S";
  if (percentage >= GRADE_THRESHOLDS.A) return "A";
  if (percentage >= GRADE_THRESHOLDS.B) return "B";
  if (percentage >= GRADE_THRESHOLDS.C) return "C";
  if (percentage >= GRADE_THRESHOLDS.D) return "D";
  return "F";
}
