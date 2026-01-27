import { describe, it, expect } from "vitest";
import { INTERVIEW_CONFIG } from "../config.js";

describe("config", () => {
  describe("INTERVIEW_CONFIG", () => {
    it("should have MIN_TURNS", () => {
      expect(INTERVIEW_CONFIG.MIN_TURNS).toBeDefined();
      expect(typeof INTERVIEW_CONFIG.MIN_TURNS).toBe("number");
      expect(INTERVIEW_CONFIG.MIN_TURNS).toBeGreaterThan(0);
    });

    it("should have MAX_TURNS", () => {
      expect(INTERVIEW_CONFIG.MAX_TURNS).toBeDefined();
      expect(typeof INTERVIEW_CONFIG.MAX_TURNS).toBe("number");
      expect(INTERVIEW_CONFIG.MAX_TURNS).toBeGreaterThan(INTERVIEW_CONFIG.MIN_TURNS);
    });

    it("should have END_MARKER", () => {
      expect(INTERVIEW_CONFIG.END_MARKER).toBe("【面接終了】");
    });

    it("should have ABORT_MARKER", () => {
      expect(INTERVIEW_CONFIG.ABORT_MARKER).toBe("【面接中止】");
    });
  });
});
