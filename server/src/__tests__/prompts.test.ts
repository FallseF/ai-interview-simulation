import { describe, it, expect } from "vitest";
import { createInterviewerConfig } from "../prompts/interviewer.js";
import { createCandidateConfig } from "../prompts/candidate.js";
import { DEFAULT_SCENARIO, getScenarioContext } from "../prompts/scenario.js";

describe("prompts", () => {
  describe("createInterviewerConfig", () => {
    it("should create interviewer config with correct role", () => {
      const config = createInterviewerConfig();
      expect(config.role).toBe("interviewer");
    });

    it("should have a name", () => {
      const config = createInterviewerConfig();
      expect(config.name).toBeTruthy();
      expect(typeof config.name).toBe("string");
    });

    it("should have a voice", () => {
      const config = createInterviewerConfig();
      expect(config.voice).toBeTruthy();
    });

    it("should have instructions", () => {
      const config = createInterviewerConfig();
      expect(config.instructions).toBeTruthy();
      expect(config.instructions.length).toBeGreaterThan(100);
    });

    it("should include interview topics in instructions", () => {
      const config = createInterviewerConfig();
      expect(config.instructions).toContain("介護経験");
      expect(config.instructions).toContain("志望動機");
      expect(config.instructions).toContain("面接終了");
    });

    it("should include scenario context", () => {
      const config = createInterviewerConfig();
      expect(config.instructions).toContain("さくら苑");
    });
  });

  describe("createCandidateConfig", () => {
    it("should create candidate config with correct role", () => {
      const config = createCandidateConfig();
      expect(config.role).toBe("candidate");
    });

    it("should have a name", () => {
      const config = createCandidateConfig();
      expect(config.name).toBeTruthy();
    });

    it("should have a voice", () => {
      const config = createCandidateConfig();
      expect(config.voice).toBeTruthy();
    });

    it("should have instructions for broken Japanese", () => {
      const config = createCandidateConfig();
      expect(config.instructions).toContain("短い");
      expect(config.instructions).toContain("簡単");
    });

    it("should mention Vietnamese background", () => {
      const config = createCandidateConfig();
      expect(config.instructions).toContain("ベトナム");
    });
  });

  describe("getScenarioContext", () => {
    it("should return formatted scenario context", () => {
      const context = getScenarioContext();
      expect(context).toContain("施設名");
      expect(context).toContain("さくら苑");
    });

    it("should include position info", () => {
      const context = getScenarioContext();
      expect(context).toContain("職種");
      expect(context).toContain("介護職員");
    });

    it("should include candidate info", () => {
      const context = getScenarioContext();
      expect(context).toContain("応募者情報");
      expect(context).toContain("グエン・ミン");
    });
  });

  describe("DEFAULT_SCENARIO", () => {
    it("should have facility info", () => {
      expect(DEFAULT_SCENARIO.facility.name).toBe("さくら苑");
      expect(DEFAULT_SCENARIO.facility.type).toContain("特別養護老人ホーム");
    });

    it("should have position info", () => {
      expect(DEFAULT_SCENARIO.position.title).toBe("介護職員");
      expect(DEFAULT_SCENARIO.position.requirements.length).toBeGreaterThan(0);
    });

    it("should have candidate profile", () => {
      expect(DEFAULT_SCENARIO.candidate.name).toBe("グエン・ミン");
      expect(DEFAULT_SCENARIO.candidate.nationality).toBe("ベトナム");
      expect(DEFAULT_SCENARIO.candidate.japaneseLevel).toContain("N4");
    });
  });
});
