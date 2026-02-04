import { describe, it, expect } from "vitest";
import { createInterviewerConfig } from "../prompts/interviewer.js";
import { createCandidateConfig } from "../prompts/candidate.js";
import {
  GENDER_LABELS,
  INDUSTRY_LABELS,
  PERSONALITY_LABELS,
  DIALECT_LABELS,
  DIFFICULTY_LABELS,
  PERSONALITY_PROMPTS,
  DIALECT_PROMPTS,
  FOREIGN_HIRING_LITERACY_PROMPTS,
  DIFFICULTY_PROMPTS,
  DEFAULT_INTERVIEWER_PERSONA,
  DEFAULT_CANDIDATE_PERSONA,
  PERSONA_PRESETS,
} from "../prompts/persona/index.js";
import type {
  InterviewerPersona,
  CandidatePersona,
  Gender,
  Industry,
  InterviewerPersonality,
  Dialect,
  DifficultyMode,
  JapaneseLevel,
} from "../types/roles.js";

describe("Persona System", () => {
  describe("Labels", () => {
    it("should have all gender labels", () => {
      expect(GENDER_LABELS.male).toBe("男性");
      expect(GENDER_LABELS.female).toBe("女性");
    });

    it("should have all industry labels", () => {
      expect(INDUSTRY_LABELS.nursing).toBe("介護");
      expect(INDUSTRY_LABELS.manufacturing).toBe("製造業");
      expect(INDUSTRY_LABELS.restaurant).toBe("飲食");
      expect(INDUSTRY_LABELS.it).toBe("IT");
    });

    it("should have all personality labels", () => {
      expect(PERSONALITY_LABELS.detailed).toContain("細かい");
      expect(PERSONALITY_LABELS.casual).toContain("ガサツ");
      expect(PERSONALITY_LABELS.inquisitive).toContain("質問");
      expect(PERSONALITY_LABELS.friendly).toContain("フレンドリー");
      expect(PERSONALITY_LABELS.strict).toContain("厳格");
    });

    it("should have all dialect labels", () => {
      expect(DIALECT_LABELS.standard).toBe("標準語");
      expect(DIALECT_LABELS.kansai).toBe("関西弁");
      expect(DIALECT_LABELS.kyushu).toBe("九州弁");
      expect(DIALECT_LABELS.tohoku).toBe("東北弁");
    });

    it("should have all difficulty labels", () => {
      expect(DIFFICULTY_LABELS.beginner).toContain("初心者");
      expect(DIFFICULTY_LABELS.hard).toContain("ハード");
    });
  });

  describe("Prompt Templates", () => {
    it("should have personality prompts for all types", () => {
      const personalities: InterviewerPersonality[] = ["detailed", "casual", "inquisitive", "friendly", "strict"];
      for (const personality of personalities) {
        expect(PERSONALITY_PROMPTS[personality]).toBeTruthy();
        expect(PERSONALITY_PROMPTS[personality].length).toBeGreaterThan(50);
      }
    });

    it("should have dialect prompts for all types", () => {
      const dialects: Dialect[] = ["standard", "kansai", "kyushu", "tohoku"];
      for (const dialect of dialects) {
        expect(DIALECT_PROMPTS[dialect]).toBeTruthy();
      }
    });

    it("should include kansai dialect specific phrases", () => {
      expect(DIALECT_PROMPTS.kansai).toContain("やねん");
      expect(DIALECT_PROMPTS.kansai).toContain("やで");
    });

    it("should have difficulty prompts", () => {
      expect(DIFFICULTY_PROMPTS.beginner).toContain("初心者モード");
      expect(DIFFICULTY_PROMPTS.hard).toContain("ハードモード");
      expect(DIFFICULTY_PROMPTS.hard).toContain("ツッコミ");
    });

    it("should have foreign hiring literacy prompts", () => {
      expect(FOREIGN_HIRING_LITERACY_PROMPTS.high).toContain("理解");
      expect(FOREIGN_HIRING_LITERACY_PROMPTS.low).toContain("不慣れ");
    });
  });

  describe("Default Personas", () => {
    it("should have valid default interviewer persona", () => {
      expect(DEFAULT_INTERVIEWER_PERSONA.gender).toBe("male");
      expect(DEFAULT_INTERVIEWER_PERSONA.industry).toBe("nursing");
      expect(DEFAULT_INTERVIEWER_PERSONA.personality).toBe("friendly");
      expect(DEFAULT_INTERVIEWER_PERSONA.foreignHiringLiteracy).toBe("low");
      expect(DEFAULT_INTERVIEWER_PERSONA.dialect).toBe("standard");
      expect(DEFAULT_INTERVIEWER_PERSONA.difficulty).toBe("beginner");
    });

    it("should have valid default candidate persona", () => {
      expect(DEFAULT_CANDIDATE_PERSONA.japaneseLevel).toBe("N4");
      expect(DEFAULT_CANDIDATE_PERSONA.workExperience).toBe(false);
    });
  });

  describe("Persona Presets", () => {
    it("should have at least 3 presets", () => {
      expect(PERSONA_PRESETS.length).toBeGreaterThanOrEqual(3);
    });

    it("should have standard preset", () => {
      const standard = PERSONA_PRESETS.find(p => p.id === "standard");
      expect(standard).toBeTruthy();
      expect(standard?.name).toBe("標準");
    });

    it("should have kansai preset with kansai dialect", () => {
      const kansai = PERSONA_PRESETS.find(p => p.id === "kansai-casual");
      expect(kansai).toBeTruthy();
      expect(kansai?.interviewer.dialect).toBe("kansai");
    });

    it("should have hard mode preset", () => {
      const hardPreset = PERSONA_PRESETS.find(p => p.interviewer.difficulty === "hard");
      expect(hardPreset).toBeTruthy();
    });

    it("all presets should have valid structure", () => {
      for (const preset of PERSONA_PRESETS) {
        expect(preset.id).toBeTruthy();
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.interviewer).toBeTruthy();
        expect(preset.candidate).toBeTruthy();
        expect(preset.interviewer.gender).toBeTruthy();
        expect(preset.interviewer.industry).toBeTruthy();
        expect(preset.candidate.japaneseLevel).toBeTruthy();
      }
    });
  });

  describe("createInterviewerConfig with Persona", () => {
    it("should create config with default persona", () => {
      const config = createInterviewerConfig();
      expect(config.role).toBe("interviewer");
      expect(config.instructions).toBeTruthy();
    });

    it("should reflect personality in instructions", () => {
      const detailedPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        personality: "detailed",
      };
      const config = createInterviewerConfig(undefined, detailedPersona);
      expect(config.instructions).toContain("細かく");
    });

    it("should reflect kansai dialect in instructions", () => {
      const kansaiPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        dialect: "kansai",
      };
      const config = createInterviewerConfig(undefined, kansaiPersona);
      expect(config.instructions).toContain("関西弁");
      expect(config.instructions).toContain("やねん");
    });

    it("should reflect industry in instructions", () => {
      const manufacturingPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        industry: "manufacturing",
      };
      const config = createInterviewerConfig(undefined, manufacturingPersona);
      expect(config.instructions).toContain("製造業");
    });

    it("should use female voice for female persona", () => {
      const femalePersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        gender: "female",
      };
      const config = createInterviewerConfig(undefined, femalePersona);
      expect(config.voice).toBe("maple");
    });

    it("should use male voice for male persona", () => {
      const malePersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        gender: "male",
      };
      const config = createInterviewerConfig(undefined, malePersona);
      expect(config.voice).toBe("cedar");
    });

    it("should reflect hard mode in instructions", () => {
      const hardPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        difficulty: "hard",
      };
      const config = createInterviewerConfig(undefined, hardPersona);
      expect(config.instructions).toContain("ハードモード");
      expect(config.instructions).toContain("ツッコミ");
    });

    it("should reflect foreign hiring literacy in instructions", () => {
      const lowLiteracyPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        foreignHiringLiteracy: "low",
      };
      const config = createInterviewerConfig(undefined, lowLiteracyPersona);
      expect(config.instructions).toContain("不慣れ");
    });

    it("should use custom name if provided", () => {
      const customNamePersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        customName: "山田課長",
      };
      const config = createInterviewerConfig(undefined, customNamePersona);
      expect(config.name).toBe("山田課長");
    });
  });

  describe("createCandidateConfig with Persona", () => {
    it("should create config with default persona", () => {
      const config = createCandidateConfig();
      expect(config.role).toBe("candidate");
      expect(config.instructions).toBeTruthy();
    });

    it("should reflect N5 level in instructions", () => {
      const n5Persona: CandidatePersona = {
        japaneseLevel: "N5",
      };
      const config = createCandidateConfig(undefined, n5Persona);
      expect(config.instructions).toContain("N5");
      expect(config.instructions).toContain("初級");
    });

    it("should reflect N3 level in instructions", () => {
      const n3Persona: CandidatePersona = {
        japaneseLevel: "N3",
      };
      const config = createCandidateConfig(undefined, n3Persona);
      expect(config.instructions).toContain("N3");
      expect(config.instructions).toContain("中級");
    });

    it("should reflect N1 level in instructions", () => {
      const n1Persona: CandidatePersona = {
        japaneseLevel: "N1",
      };
      const config = createCandidateConfig(undefined, n1Persona);
      expect(config.instructions).toContain("N1");
      expect(config.instructions).toContain("上級");
    });

    it("should reflect work experience in instructions", () => {
      const experiencedPersona: CandidatePersona = {
        japaneseLevel: "N3",
        workExperience: true,
      };
      const config = createCandidateConfig(undefined, experiencedPersona);
      expect(config.instructions).toContain("日本での就労経験");
    });

    it("should have shorter speak time for lower levels", () => {
      const n5Config = createCandidateConfig(undefined, { japaneseLevel: "N5" });
      const n1Config = createCandidateConfig(undefined, { japaneseLevel: "N1" });

      expect(n5Config.instructions).toContain("15秒以内");
      expect(n1Config.instructions).toContain("60秒以内");
    });

    it("should use custom name if provided", () => {
      const customNamePersona: CandidatePersona = {
        japaneseLevel: "N4",
        customName: "リー・ウェイ",
      };
      const config = createCandidateConfig(undefined, customNamePersona);
      expect(config.name).toBe("リー・ウェイ");
    });
  });

  describe("Industry-specific Topics", () => {
    it("should have nursing-specific topics for nursing industry", () => {
      const nursingPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        industry: "nursing",
      };
      const config = createInterviewerConfig(undefined, nursingPersona);
      expect(config.instructions).toContain("介護経験");
      expect(config.instructions).toContain("夜勤");
      expect(config.instructions).toContain("腰痛");
    });

    it("should have manufacturing-specific topics for manufacturing industry", () => {
      const manufacturingPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        industry: "manufacturing",
      };
      const config = createInterviewerConfig(undefined, manufacturingPersona);
      expect(config.instructions).toContain("製造業経験");
      expect(config.instructions).toContain("機械");
      expect(config.instructions).toContain("安全");
    });

    it("should have restaurant-specific topics for restaurant industry", () => {
      const restaurantPersona: InterviewerPersona = {
        ...DEFAULT_INTERVIEWER_PERSONA,
        industry: "restaurant",
      };
      const config = createInterviewerConfig(undefined, restaurantPersona);
      expect(config.instructions).toContain("飲食業経験");
      expect(config.instructions).toContain("衛生");
    });
  });
});
