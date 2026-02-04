import { describe, it, expect } from "vitest";
import type { InterviewPattern, JapaneseLevel, PatternConfig } from "../types/roles.js";
import { createPattern1StudentConfig, type Pattern1Config } from "../prompts/patterns/pattern1.js";
import {
  createPattern2InterviewerConfig,
  createPattern2StudentConfig,
  type Pattern2Config,
} from "../prompts/patterns/pattern2.js";
import { createPattern3InterviewerConfig, type Pattern3Config } from "../prompts/patterns/pattern3.js";
import {
  getJapaneseLevelInstructions,
  getJapaneseLevelExamples,
  getJapaneseLevelDescription,
} from "../prompts/japaneseLevels.js";

// =============================================================================
// Type Definition Tests
// =============================================================================

describe("Type Definitions", () => {
  describe("InterviewPattern type", () => {
    it("should accept valid pattern values", () => {
      const validPatterns: InterviewPattern[] = ["pattern1", "pattern2", "pattern3"];
      expect(validPatterns).toHaveLength(3);
      expect(validPatterns).toContain("pattern1");
      expect(validPatterns).toContain("pattern2");
      expect(validPatterns).toContain("pattern3");
    });
  });

  describe("JapaneseLevel type", () => {
    it("should accept valid JLPT levels", () => {
      const validLevels: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];
      expect(validLevels).toHaveLength(5);
      expect(validLevels).toContain("N5");
      expect(validLevels).toContain("N4");
      expect(validLevels).toContain("N3");
      expect(validLevels).toContain("N2");
      expect(validLevels).toContain("N1");
    });
  });

  describe("PatternConfig type", () => {
    it("should accept valid pattern configuration", () => {
      const config: PatternConfig = {
        pattern: "pattern1",
        japaneseLevel: "N4",
        participants: ["candidate", "human"],
      };
      expect(config.pattern).toBe("pattern1");
      expect(config.japaneseLevel).toBe("N4");
      expect(config.participants).toContain("candidate");
    });

    it("should allow japaneseLevel to be optional", () => {
      const config: PatternConfig = {
        pattern: "pattern3",
        participants: ["interviewer", "human"],
      };
      expect(config.pattern).toBe("pattern3");
      expect(config.japaneseLevel).toBeUndefined();
    });
  });
});

// =============================================================================
// Prompt Generation Tests - Pattern 1
// =============================================================================

describe("Pattern 1: Attendance Check / Self-Introduction Practice", () => {
  describe("createPattern1StudentConfig", () => {
    it("should create student config with correct role", () => {
      const config = createPattern1StudentConfig();
      expect(config.role).toBe("candidate");
    });

    it("should have a name from scenario", () => {
      const config = createPattern1StudentConfig();
      expect(config.name).toBeTruthy();
      expect(typeof config.name).toBe("string");
    });

    it("should have voice configuration", () => {
      const config = createPattern1StudentConfig();
      expect(config.voice).toBe("shimmer");
    });

    it("should have instructions for practice session", () => {
      const config = createPattern1StudentConfig();
      expect(config.instructions).toContain("練習");
      expect(config.instructions).toContain("自己紹介");
    });

    it("should include candidate background", () => {
      const config = createPattern1StudentConfig();
      expect(config.instructions).toContain("出身");
      expect(config.instructions).toContain("経験");
    });

    it("should default to N4 Japanese level", () => {
      const config = createPattern1StudentConfig();
      expect(config.instructions).toContain("日本語レベル: N4");
    });

    it("should apply specified Japanese level", () => {
      const levels: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];
      for (const level of levels) {
        const config = createPattern1StudentConfig({ japaneseLevel: level });
        expect(config.instructions).toContain(`日本語レベル: ${level}`);
      }
    });

    it("should include speech pattern based on Japanese level", () => {
      // N5 - very basic
      const n5Config = createPattern1StudentConfig({ japaneseLevel: "N5" });
      expect(n5Config.instructions).toContain("単語");

      // N1 - advanced
      const n1Config = createPattern1StudentConfig({ japaneseLevel: "N1" });
      expect(n1Config.instructions).toContain("ネイティブ");
    });
  });
});

// =============================================================================
// Prompt Generation Tests - Pattern 2
// =============================================================================

describe("Pattern 2: Interview Main Session (Sales-led)", () => {
  describe("createPattern2InterviewerConfig", () => {
    it("should create interviewer config with correct role", () => {
      const config = createPattern2InterviewerConfig();
      expect(config.role).toBe("interviewer");
    });

    it("should have interviewer name", () => {
      const config = createPattern2InterviewerConfig();
      expect(config.name).toBe("田中部長");
    });

    it("should have voice configuration", () => {
      const config = createPattern2InterviewerConfig();
      expect(config.voice).toBe("cedar");
    });

    it("should include interview topics", () => {
      const config = createPattern2InterviewerConfig();
      expect(config.instructions).toContain("介護経験");
      expect(config.instructions).toContain("志望動機");
      expect(config.instructions).toContain("勤務条件");
    });

    it("should include end marker instruction", () => {
      const config = createPattern2InterviewerConfig();
      expect(config.instructions).toContain("【面接終了】");
    });

    it("should include scenario context", () => {
      const config = createPattern2InterviewerConfig();
      expect(config.instructions).toContain("施設");
    });
  });

  describe("createPattern2StudentConfig", () => {
    it("should create student config with correct role", () => {
      const config = createPattern2StudentConfig();
      expect(config.role).toBe("candidate");
    });

    it("should have voice configuration", () => {
      const config = createPattern2StudentConfig();
      expect(config.voice).toBe("shimmer");
    });

    it("should have instructions for interview behavior", () => {
      const config = createPattern2StudentConfig();
      expect(config.instructions).toContain("面接官");
      expect(config.instructions).toContain("転職支援");
    });

    it("should default to N4 Japanese level", () => {
      const config = createPattern2StudentConfig();
      expect(config.instructions).toContain("日本語レベル: N4");
    });

    it("should apply specified Japanese level", () => {
      const levels: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];
      for (const level of levels) {
        const config = createPattern2StudentConfig({ japaneseLevel: level });
        expect(config.instructions).toContain(`日本語レベル: ${level}`);
      }
    });

    it("should include speaking rules that change by level", () => {
      const n5Config = createPattern2StudentConfig({ japaneseLevel: "N5" });
      const n1Config = createPattern2StudentConfig({ japaneseLevel: "N1" });

      // N5 and N1 should have different speech patterns
      expect(n5Config.instructions).not.toBe(n1Config.instructions);
    });
  });
});

// =============================================================================
// Prompt Generation Tests - Pattern 3
// =============================================================================

describe("Pattern 3: Hearing / Closing (Post-Interview)", () => {
  describe("createPattern3InterviewerConfig", () => {
    it("should create interviewer config with correct role", () => {
      const config = createPattern3InterviewerConfig();
      expect(config.role).toBe("interviewer");
    });

    it("should have interviewer name", () => {
      const config = createPattern3InterviewerConfig();
      expect(config.name).toBe("田中部長");
    });

    it("should have voice configuration", () => {
      const config = createPattern3InterviewerConfig();
      expect(config.voice).toBe("cedar");
    });

    it("should include closing session topics", () => {
      const config = createPattern3InterviewerConfig();
      expect(config.instructions).toContain("第一印象");
      expect(config.instructions).toContain("良かった点");
      expect(config.instructions).toContain("懸念点");
      expect(config.instructions).toContain("採用可否");
    });

    it("should include session end marker", () => {
      const config = createPattern3InterviewerConfig();
      expect(config.instructions).toContain("【セッション終了】");
    });

    it("should indicate candidate has left", () => {
      const config = createPattern3InterviewerConfig();
      expect(config.instructions).toContain("候補者が退席");
    });

    it("should include interview summary when provided", () => {
      const config = createPattern3InterviewerConfig({
        interviewSummary: {
          studentPerformance: "積極的に回答していた",
          communicationLevel: "基本的な会話は問題なし",
          technicalSkills: "2年の介護経験あり",
        },
      });
      expect(config.instructions).toContain("積極的に回答していた");
      expect(config.instructions).toContain("基本的な会話は問題なし");
      expect(config.instructions).toContain("2年の介護経験あり");
    });

    it("should work without interview summary", () => {
      const config = createPattern3InterviewerConfig();
      expect(config.instructions).toBeTruthy();
      expect(config.instructions.length).toBeGreaterThan(100);
    });
  });
});

// =============================================================================
// Japanese Level Instruction Tests
// =============================================================================

describe("Japanese Level Functions", () => {
  const allLevels: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];

  describe("getJapaneseLevelInstructions", () => {
    it("should return different instructions for each level", () => {
      const instructions = allLevels.map((level) => getJapaneseLevelInstructions(level));

      // All should be unique
      const uniqueInstructions = new Set(instructions);
      expect(uniqueInstructions.size).toBe(5);
    });

    it("should return instructions containing level-specific rules", () => {
      for (const level of allLevels) {
        const instructions = getJapaneseLevelInstructions(level);
        expect(instructions).toContain("話し方のルール");
        expect(instructions).toContain("話し方の例");
      }
    });

    it("should return N5 instructions with basic vocabulary focus", () => {
      const instructions = getJapaneseLevelInstructions("N5");
      expect(instructions).toContain("単語");
      expect(instructions).toContain("助詞");
      expect(instructions).toContain("N5");
    });

    it("should return N4 instructions with short sentence focus", () => {
      const instructions = getJapaneseLevelInstructions("N4");
      expect(instructions).toContain("短い");
      expect(instructions).toContain("語順ミス");
      expect(instructions).toContain("N4");
    });

    it("should return N3 instructions with intermediate grammar", () => {
      const instructions = getJapaneseLevelInstructions("N3");
      expect(instructions).toContain("基本的な文法");
      expect(instructions).toContain("N3");
    });

    it("should return N2 instructions with business Japanese", () => {
      const instructions = getJapaneseLevelInstructions("N2");
      expect(instructions).toContain("敬語");
      expect(instructions).toContain("ビジネス");
      expect(instructions).toContain("N2");
    });

    it("should return N1 instructions with near-native ability", () => {
      const instructions = getJapaneseLevelInstructions("N1");
      expect(instructions).toContain("日本人と同等");
      expect(instructions).toContain("N1");
    });
  });

  describe("getJapaneseLevelExamples", () => {
    it("should return different examples for each level", () => {
      for (const level of allLevels) {
        const examples = getJapaneseLevelExamples(level);
        expect(Array.isArray(examples)).toBe(true);
        expect(examples.length).toBeGreaterThan(0);
      }
    });

    it("should return unique examples for each level", () => {
      const exampleSets = allLevels.map((level) => getJapaneseLevelExamples(level));

      // Check that first example of each level is different
      const firstExamples = exampleSets.map((set) => set[0]);
      const uniqueFirstExamples = new Set(firstExamples);
      expect(uniqueFirstExamples.size).toBe(5);
    });

    it("should return N5 examples with word fragments", () => {
      const examples = getJapaneseLevelExamples("N5");
      // N5 examples should contain broken phrases with "..."
      const hasBrokenPhrases = examples.some((ex) => ex.includes("..."));
      expect(hasBrokenPhrases).toBe(true);
    });

    it("should return N4 examples with short sentences", () => {
      const examples = getJapaneseLevelExamples("N4");
      expect(examples.length).toBeGreaterThan(3);
    });

    it("should return N3 examples with complete sentences", () => {
      const examples = getJapaneseLevelExamples("N3");
      // N3 examples should have more complete sentences
      const hasCompleteSentences = examples.some((ex) => ex.includes("ました") || ex.includes("います"));
      expect(hasCompleteSentences).toBe(true);
    });

    it("should return N2 examples with polite/business Japanese", () => {
      const examples = getJapaneseLevelExamples("N2");
      // N2 should have polite forms
      const hasPoliteForm = examples.some((ex) => ex.includes("おりました") || ex.includes("ございます"));
      expect(hasPoliteForm).toBe(true);
    });

    it("should return N1 examples with formal expressions", () => {
      const examples = getJapaneseLevelExamples("N1");
      // N1 should have very formal expressions
      const hasFormalExpressions = examples.some(
        (ex) => ex.includes("まいりました") || ex.includes("存じます") || ex.includes("ございます")
      );
      expect(hasFormalExpressions).toBe(true);
    });
  });

  describe("getJapaneseLevelDescription", () => {
    it("should return different descriptions for each level", () => {
      const descriptions = allLevels.map((level) => getJapaneseLevelDescription(level));

      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(5);
    });

    it("should return concise descriptions", () => {
      for (const level of allLevels) {
        const description = getJapaneseLevelDescription(level);
        expect(typeof description).toBe("string");
        expect(description.length).toBeLessThan(50);
      }
    });

    it("should describe N5 as beginner level", () => {
      const description = getJapaneseLevelDescription("N5");
      expect(description).toContain("初級");
    });

    it("should describe N4 as elementary-intermediate level", () => {
      const description = getJapaneseLevelDescription("N4");
      expect(description).toContain("初中級");
    });

    it("should describe N3 as intermediate level", () => {
      const description = getJapaneseLevelDescription("N3");
      expect(description).toContain("中級");
    });

    it("should describe N2 as upper-intermediate level", () => {
      const description = getJapaneseLevelDescription("N2");
      expect(description).toContain("中上級");
    });

    it("should describe N1 as advanced level", () => {
      const description = getJapaneseLevelDescription("N1");
      expect(description).toContain("上級");
    });
  });
});

// =============================================================================
// Integration Tests - Japanese Level affects Prompt Generation
// =============================================================================

describe("Integration: Japanese Level affects Prompt Generation", () => {
  const levels: JapaneseLevel[] = ["N5", "N4", "N3", "N2", "N1"];

  describe("Pattern 1 with different Japanese levels", () => {
    it("should generate different prompts for each level", () => {
      const configs = levels.map((level) => createPattern1StudentConfig({ japaneseLevel: level }));

      // All instructions should be different
      const uniqueInstructions = new Set(configs.map((c) => c.instructions));
      expect(uniqueInstructions.size).toBe(5);
    });

    it("should include level-appropriate speech patterns", () => {
      const n5Config = createPattern1StudentConfig({ japaneseLevel: "N5" });
      const n1Config = createPattern1StudentConfig({ japaneseLevel: "N1" });

      // N5 should mention word-only speech
      expect(n5Config.instructions).toContain("単語");

      // N1 should mention near-native ability
      expect(n1Config.instructions).toContain("ネイティブ");
    });
  });

  describe("Pattern 2 with different Japanese levels", () => {
    it("should generate different student prompts for each level", () => {
      const configs = levels.map((level) => createPattern2StudentConfig({ japaneseLevel: level }));

      const uniqueInstructions = new Set(configs.map((c) => c.instructions));
      expect(uniqueInstructions.size).toBe(5);
    });

    it("interviewer config should not change with Japanese level", () => {
      // Interviewer doesn't have japaneseLevel in their config
      const config1 = createPattern2InterviewerConfig();
      const config2 = createPattern2InterviewerConfig();

      expect(config1.instructions).toBe(config2.instructions);
    });
  });
});
