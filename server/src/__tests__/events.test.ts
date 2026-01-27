import { describe, it, expect } from "vitest";
import { normalizeEvent, shouldLogEvent } from "../realtime/events.js";

describe("events", () => {
  describe("normalizeEvent", () => {
    it("should normalize session.created event", () => {
      const event = {
        type: "session.created",
        session: { id: "sess_123" },
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("session_created");
      expect(normalized.data?.sessionId).toBe("sess_123");
    });

    it("should normalize session.updated event", () => {
      const event = { type: "session.updated" };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("session_updated");
    });

    it("should normalize response.audio.delta event", () => {
      const event = {
        type: "response.audio.delta",
        delta: "base64audiodata",
        item_id: "item_1",
        response_id: "resp_1",
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("audio_delta");
      expect(normalized.data?.audioBase64).toBe("base64audiodata");
    });

    it("should normalize response.audio.done event", () => {
      const event = { type: "response.audio.done" };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("audio_done");
    });

    it("should normalize response.audio_transcript.delta event", () => {
      const event = {
        type: "response.audio_transcript.delta",
        delta: "Hello ",
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("transcript_delta");
      expect(normalized.data?.textDelta).toBe("Hello ");
    });

    it("should normalize response.audio_transcript.done event", () => {
      const event = {
        type: "response.audio_transcript.done",
        transcript: "Hello world",
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("transcript_done");
      expect(normalized.data?.fullText).toBe("Hello world");
    });

    it("should normalize response.done event", () => {
      const event = {
        type: "response.done",
        response: {
          status: "completed",
        },
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("response_done");
      expect(normalized.data?.status).toBe("completed");
    });

    it("should normalize response.done event with error", () => {
      const event = {
        type: "response.done",
        response: {
          status: "failed",
          status_details: {
            error: {
              message: "Rate limit exceeded",
              code: "rate_limit_exceeded",
            },
          },
        },
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("response_done");
      expect(normalized.data?.status).toBe("failed");
      expect(normalized.data?.errorMessage).toBe("Rate limit exceeded");
      expect(normalized.data?.errorCode).toBe("rate_limit_exceeded");
    });

    it("should normalize input audio transcription delta", () => {
      const event = {
        type: "conversation.item.input_audio_transcription.delta",
        delta: "Hello",
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("input_transcript_delta");
      expect(normalized.data?.textDelta).toBe("Hello");
    });

    it("should normalize input audio transcription completed", () => {
      const event = {
        type: "conversation.item.input_audio_transcription.completed",
        transcript: "Hello world",
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("input_transcript_done");
      expect(normalized.data?.fullText).toBe("Hello world");
    });

    it("should normalize error event", () => {
      const event = {
        type: "error",
        error: {
          message: "Something went wrong",
          code: "internal_error",
        },
      };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("error");
      expect(normalized.data?.errorMessage).toBe("Something went wrong");
      expect(normalized.data?.errorCode).toBe("internal_error");
    });

    it("should return unknown for unrecognized events", () => {
      const event = { type: "some.unknown.event" };
      const normalized = normalizeEvent(event);
      expect(normalized.type).toBe("unknown");
    });

    it("should preserve raw event", () => {
      const event = {
        type: "session.created",
        session: { id: "sess_123" },
        extra: "data",
      };
      const normalized = normalizeEvent(event);
      expect(normalized.raw).toBe(event);
    });
  });

  describe("shouldLogEvent", () => {
    it("should filter out noisy events", () => {
      expect(shouldLogEvent({ type: "response.audio.delta" })).toBe(false);
      expect(shouldLogEvent({ type: "response.audio_transcript.delta" })).toBe(false);
      expect(shouldLogEvent({ type: "rate_limits.updated" })).toBe(false);
      expect(shouldLogEvent({ type: "input_audio_buffer.speech_started" })).toBe(false);
      expect(shouldLogEvent({ type: "input_audio_buffer.speech_stopped" })).toBe(false);
    });

    it("should allow important events", () => {
      expect(shouldLogEvent({ type: "session.created" })).toBe(true);
      expect(shouldLogEvent({ type: "session.updated" })).toBe(true);
      expect(shouldLogEvent({ type: "response.done" })).toBe(true);
      expect(shouldLogEvent({ type: "error" })).toBe(true);
    });
  });
});
