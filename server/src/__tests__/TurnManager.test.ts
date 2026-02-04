import { describe, it, expect, beforeEach } from "vitest";
import { TurnManager } from "../orchestrator/TurnManager.js";

describe("TurnManager", () => {
  let turnManager: TurnManager;

  beforeEach(() => {
    turnManager = new TurnManager("step");
  });

  describe("initialization", () => {
    it("should start in waiting phase", () => {
      const state = turnManager.getState();
      expect(state.phase).toBe("waiting");
      expect(state.currentSpeaker).toBeNull();
      expect(state.waitingForNext).toBe(false);
      expect(state.turnCount).toBe(0);
    });

    it("should respect initial mode", () => {
      const autoManager = new TurnManager("auto");
      expect(autoManager.getMode()).toBe("auto");
    });
  });

  describe("start", () => {
    it("should set phase to interviewer when started", () => {
      turnManager.start();
      const state = turnManager.getState();
      expect(state.phase).toBe("interviewer");
      expect(state.currentSpeaker).toBe("interviewer");
      expect(state.turnCount).toBe(1);
    });

    it("should allow starting with candidate", () => {
      turnManager.start("candidate");
      const state = turnManager.getState();
      expect(state.phase).toBe("candidate");
      expect(state.currentSpeaker).toBe("candidate");
      expect(state.turnCount).toBe(1);
    });
  });

  describe("step mode", () => {
    beforeEach(() => {
      turnManager.start();
    });

    it("should wait for next turn after AI speaks", () => {
      turnManager.onAISpeakingDone("interviewer");
      const state = turnManager.getState();
      expect(state.waitingForNext).toBe(true);
      expect(state.phase).toBe("user_choice");
    });

    it("should proceed to next speaker on nextTurn", () => {
      turnManager.onAISpeakingDone("interviewer");
      turnManager.onNextTurn();
      const state = turnManager.getState();
      expect(state.waitingForNext).toBe(false);
    });
  });

  describe("auto mode", () => {
    beforeEach(() => {
      turnManager = new TurnManager("auto");
      turnManager.start();
    });

    it("should auto-proceed to candidate after interviewer", () => {
      turnManager.onAISpeakingDone("interviewer");
      const state = turnManager.getState();
      expect(state.phase).toBe("candidate");
      expect(state.currentSpeaker).toBe("candidate");
    });

    it("should go to user_choice after candidate speaks", () => {
      turnManager.onAISpeakingDone("interviewer");
      turnManager.onAISpeakingDone("candidate");
      const state = turnManager.getState();
      expect(state.phase).toBe("user_choice");
    });
  });

  describe("human speaking", () => {
    beforeEach(() => {
      turnManager.start();
    });

    it("should switch to user_speaking phase when human starts", () => {
      turnManager.onHumanSpeakStart();
      const state = turnManager.getState();
      expect(state.phase).toBe("user_speaking");
      expect(state.currentSpeaker).toBe("human");
    });

    it("should increment turn count when human finishes", () => {
      const initialTurns = turnManager.getState().turnCount;
      turnManager.onHumanSpeakStart();
      turnManager.onHumanSpeakDone();
      expect(turnManager.getState().turnCount).toBe(initialTurns + 1);
    });
  });

  describe("setSpeaker", () => {
    it("should directly set speaker and phase", () => {
      turnManager.setSpeaker("candidate");
      const state = turnManager.getState();
      expect(state.currentSpeaker).toBe("candidate");
      expect(state.phase).toBe("candidate");
      expect(state.waitingForNext).toBe(false);
    });
  });

  describe("end", () => {
    it("should set phase to ended", () => {
      turnManager.start();
      turnManager.end();
      const state = turnManager.getState();
      expect(state.phase).toBe("ended");
      expect(state.currentSpeaker).toBeNull();
    });
  });

  describe("reset", () => {
    it("should reset all state", () => {
      turnManager.start();
      turnManager.onAISpeakingDone("interviewer");
      turnManager.reset();
      const state = turnManager.getState();
      expect(state.phase).toBe("waiting");
      expect(state.turnCount).toBe(0);
      expect(state.waitingForNext).toBe(false);
    });
  });

  describe("mode switching", () => {
    it("should allow mode change", () => {
      turnManager.setMode("auto");
      expect(turnManager.getMode()).toBe("auto");
    });
  });
});
