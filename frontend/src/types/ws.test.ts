import { describe, it, expect } from "vitest";
import type {
  Speaker,
  Target,
  InterviewMode,
  ClientMessage,
  ServerMessage,
  TranscriptEntry,
  InterviewState,
} from "./ws";

describe("WebSocket types", () => {
  describe("Speaker type", () => {
    it("should accept valid speaker values", () => {
      const interviewer: Speaker = "interviewer";
      const candidate: Speaker = "candidate";
      const human: Speaker = "human";

      expect(interviewer).toBe("interviewer");
      expect(candidate).toBe("candidate");
      expect(human).toBe("human");
    });
  });

  describe("Target type", () => {
    it("should accept valid target values", () => {
      const toInterviewer: Target = "interviewer";
      const toCandidate: Target = "candidate";
      const toBoth: Target = "both";

      expect(toInterviewer).toBe("interviewer");
      expect(toCandidate).toBe("candidate");
      expect(toBoth).toBe("both");
    });
  });

  describe("InterviewMode type", () => {
    it("should accept valid mode values", () => {
      const step: InterviewMode = "step";
      const auto: InterviewMode = "auto";

      expect(step).toBe("step");
      expect(auto).toBe("auto");
    });
  });

  describe("ClientMessage type", () => {
    it("should create valid start_session message", () => {
      const msg: ClientMessage = { type: "start_session", mode: "step", pattern: "pattern1" };
      expect(msg.type).toBe("start_session");
      if (msg.type === "start_session") {
        expect(msg.mode).toBe("step");
        expect(msg.pattern).toBe("pattern1");
      }
    });

    it("should create valid human_text message", () => {
      const msg: ClientMessage = {
        type: "human_text",
        target: "interviewer",
        text: "補足説明",
      };
      expect(msg.type).toBe("human_text");
      expect(msg.target).toBe("interviewer");
      expect(msg.text).toBe("補足説明");
    });

    it("should create valid next_turn message", () => {
      const msg: ClientMessage = { type: "next_turn" };
      expect(msg.type).toBe("next_turn");
    });
  });

  describe("ServerMessage type", () => {
    it("should create valid session_ready message", () => {
      const msg: ServerMessage = {
        type: "session_ready",
        pattern: "pattern1",
        participants: ["interviewer", "candidate", "human"],
      };
      expect(msg.type).toBe("session_ready");
      if (msg.type === "session_ready") {
        expect(msg.pattern).toBe("pattern1");
        expect(msg.participants).toContain("interviewer");
      }
    });

    it("should create valid turn_state message", () => {
      const msg: ServerMessage = {
        type: "turn_state",
        currentSpeaker: "interviewer",
        waitingForNext: false,
      };
      expect(msg.type).toBe("turn_state");
      expect(msg.currentSpeaker).toBe("interviewer");
    });

    it("should create valid transcript_done message", () => {
      const msg: ServerMessage = {
        type: "transcript_done",
        speaker: "candidate",
        text: "回答テキスト",
      };
      expect(msg.type).toBe("transcript_done");
      expect(msg.speaker).toBe("candidate");
      expect(msg.text).toBe("回答テキスト");
    });
  });

  describe("TranscriptEntry interface", () => {
    it("should create valid transcript entry", () => {
      const entry: TranscriptEntry = {
        id: "entry-1",
        speaker: "interviewer",
        name: "田中部長",
        text: "質問です",
        timestamp: new Date(),
      };

      expect(entry.id).toBe("entry-1");
      expect(entry.speaker).toBe("interviewer");
      expect(entry.name).toBe("田中部長");
      expect(entry.text).toBe("質問です");
      expect(entry.timestamp).toBeInstanceOf(Date);
    });
  });

  describe("InterviewState interface", () => {
    it("should create valid interview state", () => {
      const state: InterviewState = {
        phase: "interviewer",
        currentSpeaker: "interviewer",
        waitingForNext: false,
        mode: "step",
      };

      expect(state.phase).toBe("interviewer");
      expect(state.currentSpeaker).toBe("interviewer");
      expect(state.waitingForNext).toBe(false);
      expect(state.mode).toBe("step");
    });

    it("should accept ended state with reason", () => {
      const state: InterviewState = {
        phase: "ended",
        currentSpeaker: null,
        waitingForNext: false,
        mode: "auto",
        endReason: "normal",
      };

      expect(state.phase).toBe("ended");
      expect(state.endReason).toBe("normal");
    });
  });
});
