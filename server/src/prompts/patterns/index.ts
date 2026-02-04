// Pattern-based prompt configurations
// Export all pattern configs for easy import

// Pattern 1: 出席確認・自己紹介練習
export {
  createPattern1StudentConfig,
  type Pattern1Config,
} from "./pattern1.js";

// Pattern 2: 面接本番（営業主導）
export {
  createPattern2InterviewerConfig,
  createPattern2StudentConfig,
  type Pattern2Config,
} from "./pattern2.js";

// Pattern 3: ヒアリング・クロージング
export {
  createPattern3InterviewerConfig,
  type Pattern3Config,
} from "./pattern3.js";

// Re-export types for convenience
export type { InterviewPattern, JapaneseLevel, PatternConfig } from "../../types/roles.js";
export type { Scenario } from "../scenario.js";
