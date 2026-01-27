import { describe, it, expect, beforeEach } from "vitest";
import { TranscriptStore } from "../orchestrator/TranscriptStore.js";

describe("TranscriptStore", () => {
  let store: TranscriptStore;

  beforeEach(() => {
    store = new TranscriptStore();
  });

  describe("commit", () => {
    it("should add entry to store", () => {
      store.commit("interviewer", "Hello, please introduce yourself.");
      expect(store.count).toBe(1);
    });

    it("should return committed entry", () => {
      const entry = store.commit("interviewer", "Test message");
      expect(entry.speaker).toBe("interviewer");
      expect(entry.text).toBe("Test message");
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it("should store multiple entries", () => {
      store.commit("interviewer", "First");
      store.commit("candidate", "Second");
      store.commit("human", "Third");
      expect(store.count).toBe(3);
    });
  });

  describe("addDelta", () => {
    it("should accumulate deltas", () => {
      store.addDelta("interviewer", "Hello ");
      store.addDelta("interviewer", "world");
      expect(store.getPendingDelta("interviewer")).toBe("Hello world");
    });

    it("should clear pending delta on commit", () => {
      store.addDelta("interviewer", "Pending text");
      store.commit("interviewer", "Final text");
      expect(store.getPendingDelta("interviewer")).toBe("");
    });
  });

  describe("getAll", () => {
    it("should return all entries", () => {
      store.commit("interviewer", "First");
      store.commit("candidate", "Second");
      const all = store.getAll();
      expect(all.length).toBe(2);
      expect(all[0].text).toBe("First");
      expect(all[1].text).toBe("Second");
    });

    it("should return a copy", () => {
      store.commit("interviewer", "Test");
      const all = store.getAll();
      all.push({ speaker: "human", text: "Modified", timestamp: new Date() });
      expect(store.count).toBe(1);
    });
  });

  describe("getBySpeaker", () => {
    it("should filter by speaker", () => {
      store.commit("interviewer", "Q1");
      store.commit("candidate", "A1");
      store.commit("interviewer", "Q2");
      store.commit("candidate", "A2");

      const interviewerEntries = store.getBySpeaker("interviewer");
      expect(interviewerEntries.length).toBe(2);
      expect(interviewerEntries[0].text).toBe("Q1");
      expect(interviewerEntries[1].text).toBe("Q2");
    });
  });

  describe("getRecent", () => {
    it("should return last N entries", () => {
      store.commit("interviewer", "1");
      store.commit("candidate", "2");
      store.commit("interviewer", "3");
      store.commit("candidate", "4");

      const recent = store.getRecent(2);
      expect(recent.length).toBe(2);
      expect(recent[0].text).toBe("3");
      expect(recent[1].text).toBe("4");
    });
  });

  describe("getLastBySpeaker", () => {
    it("should return last entry by speaker", () => {
      store.commit("interviewer", "First question");
      store.commit("candidate", "Answer");
      store.commit("interviewer", "Second question");

      const last = store.getLastBySpeaker("interviewer");
      expect(last?.text).toBe("Second question");
    });

    it("should return null if no entries", () => {
      const last = store.getLastBySpeaker("human");
      expect(last).toBeNull();
    });
  });

  describe("getCountBySpeaker", () => {
    it("should count entries by speaker", () => {
      store.commit("interviewer", "1");
      store.commit("candidate", "2");
      store.commit("interviewer", "3");

      expect(store.getCountBySpeaker("interviewer")).toBe(2);
      expect(store.getCountBySpeaker("candidate")).toBe(1);
      expect(store.getCountBySpeaker("human")).toBe(0);
    });
  });

  describe("clear", () => {
    it("should clear all entries", () => {
      store.commit("interviewer", "Test");
      store.addDelta("candidate", "Pending");
      store.clear();
      expect(store.count).toBe(0);
      expect(store.getPendingDelta("candidate")).toBe("");
    });
  });

  describe("toFormattedText", () => {
    it("should format entries with timestamps", () => {
      store.commit("interviewer", "Hello");
      store.commit("candidate", "Hi");
      const formatted = store.toFormattedText();
      expect(formatted).toContain("interviewer: Hello");
      expect(formatted).toContain("candidate: Hi");
    });
  });

  describe("toContextString", () => {
    it("should format with Japanese labels", () => {
      store.commit("interviewer", "質問");
      store.commit("candidate", "回答");
      store.commit("human", "補足");
      const context = store.toContextString();
      expect(context).toContain("[面接官]: 質問");
      expect(context).toContain("[求職者]: 回答");
      expect(context).toContain("[転職支援]: 補足");
    });
  });
});
