/**
 * 評価基準の設定
 *
 * ここで定義した基準に基づいてパフォーマンスを評価する
 * 実際のマニュアル・NGワードリストが共有されたら更新する
 */

import type {
  EvaluationCategory,
  ProhibitedItem,
  RequiredItem,
  ManualItem,
} from "./types.js";

// ========================================
// 評価カテゴリ
// ========================================

export const EVALUATION_CATEGORIES: EvaluationCategory[] = [
  {
    id: "communication",
    name: "コミュニケーション",
    description: "面接官・求職者への対応の適切さ",
    weight: 0.3,
    criteria: [
      {
        id: "comm-clarity",
        name: "説明の明確さ",
        description: "わかりやすく説明できているか",
        maxPoints: 10,
        checkType: "quality",
      },
      {
        id: "comm-timing",
        name: "介入タイミング",
        description: "適切なタイミングで発言しているか",
        maxPoints: 10,
        checkType: "quality",
      },
      {
        id: "comm-tone",
        name: "トーン・態度",
        description: "丁寧で適切な言葉遣いができているか",
        maxPoints: 10,
        checkType: "quality",
      },
    ],
  },
  {
    id: "knowledge",
    name: "専門知識",
    description: "ビザ・雇用に関する正確な知識",
    weight: 0.4,
    criteria: [
      {
        id: "know-visa",
        name: "ビザに関する知識",
        description: "在留資格について正確に説明できているか",
        maxPoints: 15,
        checkType: "quality",
      },
      {
        id: "know-labor",
        name: "労働法に関する知識",
        description: "労働条件について正確に説明できているか",
        maxPoints: 15,
        checkType: "quality",
      },
      {
        id: "know-procedure",
        name: "手続きに関する知識",
        description: "入社・在留手続きについて正確に説明できているか",
        maxPoints: 10,
        checkType: "quality",
      },
    ],
  },
  {
    id: "support",
    name: "サポート対応",
    description: "求職者への適切なサポート",
    weight: 0.3,
    criteria: [
      {
        id: "sup-follow",
        name: "フォローアップ",
        description: "必要なフォローを提示できているか",
        maxPoints: 10,
        checkType: "required",
      },
      {
        id: "sup-advice",
        name: "アドバイス",
        description: "有用なアドバイスができているか",
        maxPoints: 10,
        checkType: "quality",
      },
      {
        id: "sup-empathy",
        name: "共感・理解",
        description: "求職者の状況を理解し共感を示せているか",
        maxPoints: 10,
        checkType: "quality",
      },
    ],
  },
];

// ========================================
// NGワード・禁止事項
// ========================================

export const PROHIBITED_ITEMS: ProhibitedItem[] = [
  // ビザに関する誤った説明
  {
    id: "ng-visa-tourist",
    pattern: /観光ビザで(働|仕事|就労)/,
    description: "観光ビザでの就労に関する誤った説明",
    severity: "critical",
    deduction: 20,
    feedback:
      "観光ビザ（短期滞在）での就労は違法です。正確な在留資格について説明してください。",
  },
  {
    id: "ng-visa-guarantee",
    pattern: /ビザ.*(絶対|必ず|確実に).*(取れ|通る|許可)/,
    description: "ビザ取得の確約",
    severity: "major",
    deduction: 10,
    feedback:
      "ビザの許可は入管が判断するものです。確約することはできません。",
  },

  // 労働条件に関する誤った説明
  {
    id: "ng-labor-overtime",
    pattern: /残業.*(上限.*(な|無)|いくらでも)/,
    description: "残業時間上限に関する誤った説明",
    severity: "major",
    deduction: 10,
    feedback:
      "労働基準法により残業時間には上限があります。正確な情報を伝えてください。",
  },

  // 不適切な表現
  {
    id: "ng-discriminatory",
    pattern: /(外人|ガイジン|外国人だから)/,
    description: "差別的な表現",
    severity: "critical",
    deduction: 15,
    feedback: "差別的な表現は避けてください。「外国籍の方」などの表現を使用してください。",
  },

  // プレースホルダー: 実際のNGワードリストが共有されたら追加
  // {
  //   id: "ng-xxx",
  //   pattern: /パターン/,
  //   description: "説明",
  //   severity: "major",
  //   deduction: 10,
  //   feedback: "フィードバック",
  // },
];

// ========================================
// 必須発言項目
// ========================================

export const REQUIRED_ITEMS: RequiredItem[] = [
  {
    id: "req-introduction",
    name: "自己紹介・役割説明",
    description: "転職支援エージェントとしての役割を説明する",
    keywords: ["転職支援", "エージェント", "サポート", "お手伝い"],
    points: 5,
    feedback: {
      present: "役割説明ができています。",
      missing: "自己紹介と役割説明を行い、信頼関係を構築しましょう。",
    },
  },
  {
    id: "req-visa-status",
    name: "在留資格の確認",
    description: "現在の在留資格を確認する",
    keywords: ["在留資格", "ビザ", "在留カード", "資格外活動"],
    points: 10,
    feedback: {
      present: "在留資格について適切に言及しています。",
      missing:
        "外国籍の方の就職支援では、在留資格の確認が必須です。必ず確認しましょう。",
    },
  },
  {
    id: "req-work-permit",
    name: "就労可能範囲の説明",
    description: "在留資格に応じた就労可能範囲を説明する",
    keywords: ["就労", "許可", "制限", "技術・人文知識・国際業務", "特定技能"],
    points: 10,
    feedback: {
      present: "就労可能範囲について言及しています。",
      missing: "在留資格によって就労可能な範囲が異なります。説明を追加しましょう。",
    },
  },
  {
    id: "req-next-steps",
    name: "今後の流れの説明",
    description: "面接後のステップを説明する",
    keywords: ["次のステップ", "今後の流れ", "ご連絡", "結果", "内定"],
    points: 5,
    feedback: {
      present: "今後の流れを説明しています。",
      missing: "面接後の流れ（結果連絡、次のステップなど）を説明しましょう。",
    },
  },

  // プレースホルダー: 実際の必須項目が共有されたら追加
];

// ========================================
// マニュアル項目（正確性チェック用）
// ========================================

export const MANUAL_ITEMS: ManualItem[] = [
  {
    id: "manual-visa-types",
    topic: "在留資格の種類",
    correctInfo:
      "技術・人文知識・国際業務、特定技能、技能実習、永住者、定住者など、目的に応じた在留資格がある",
    keywords: ["技術・人文知識・国際業務", "特定技能", "在留資格"],
    incorrectPatterns: [
      {
        pattern: /就労ビザ.*(一種類|1種類|同じ)/,
        feedback: "就労可能な在留資格は複数種類あります。正確に説明してください。",
      },
      {
        pattern: /どの(ビザ|在留資格)でも.*(同じ|変わらない)/,
        feedback: "在留資格によって就労条件が異なります。",
      },
    ],
  },
  {
    id: "manual-work-hours",
    topic: "労働時間の上限",
    correctInfo:
      "法定労働時間は1日8時間、週40時間。36協定による時間外労働の上限は月45時間、年360時間（特別条項あり）",
    keywords: ["8時間", "40時間", "36協定", "残業"],
    incorrectPatterns: [
      {
        pattern: /残業.*(上限|制限).*(な|無)い/,
        feedback: "残業時間には法的な上限があります。36協定について説明してください。",
      },
    ],
  },
  {
    id: "manual-minimum-wage",
    topic: "最低賃金",
    correctInfo: "最低賃金は都道府県ごとに定められており、外国人労働者にも適用される",
    keywords: ["最低賃金", "都道府県", "地域"],
    incorrectPatterns: [
      {
        pattern: /外国人.*(最低賃金|給料).*(適用.*(され|しな)|違う)/,
        feedback: "最低賃金は国籍に関係なく適用されます。",
      },
    ],
  },

  // プレースホルダー: 実際のマニュアルが共有されたら追加
];

// ========================================
// 設定のエクスポート
// ========================================

export const EVALUATION_CONFIG = {
  categories: EVALUATION_CATEGORIES,
  prohibitedItems: PROHIBITED_ITEMS,
  requiredItems: REQUIRED_ITEMS,
  manualItems: MANUAL_ITEMS,

  // 合格ライン
  passingScore: 70,

  // 即不合格となるcritical違反の数
  maxCriticalViolations: 0,
};
