import type {
  RealtimeEvent,
  AudioDeltaEvent,
  AudioDoneEvent,
  TranscriptDeltaEvent,
  TranscriptDoneEvent,
  ResponseDoneEvent,
  SessionCreatedEvent,
  SessionUpdatedEvent,
  ErrorEvent,
  InputAudioTranscriptionDeltaEvent,
  InputAudioTranscriptionCompletedEvent,
} from "../types/ws.js";

// Normalized event types for consistent handling
export type NormalizedEventType =
  | "session_created"
  | "session_updated"
  | "audio_delta"
  | "audio_done"
  | "transcript_delta"
  | "transcript_done"
  | "response_done"
  | "input_transcript_delta"
  | "input_transcript_done"
  | "error"
  | "unknown";

export interface NormalizedEvent {
  type: NormalizedEventType;
  raw: RealtimeEvent;
  data?: {
    sessionId?: string;
    audioBase64?: string;
    textDelta?: string;
    fullText?: string;
    status?: string;
    errorMessage?: string;
    errorCode?: string;
  };
}

// Event type mapping for compatibility with different API versions
const EVENT_TYPE_MAP: Record<string, NormalizedEventType> = {
  // Session events
  "session.created": "session_created",
  "session.updated": "session_updated",

  // Audio output events
  "response.audio.delta": "audio_delta",
  "response.audio.done": "audio_done",

  // Transcript output events (AI speech)
  "response.audio_transcript.delta": "transcript_delta",
  "response.audio_transcript.done": "transcript_done",

  // Response completion
  "response.done": "response_done",

  // Input audio transcription (human speech)
  "conversation.item.input_audio_transcription.delta": "input_transcript_delta",
  "conversation.item.input_audio_transcription.completed": "input_transcript_done",

  // Error events
  "error": "error",
};

// Normalize OpenAI Realtime API events for consistent handling
export function normalizeEvent(event: RealtimeEvent): NormalizedEvent {
  const normalizedType = EVENT_TYPE_MAP[event.type] || "unknown";

  const normalized: NormalizedEvent = {
    type: normalizedType,
    raw: event,
  };

  switch (normalizedType) {
    case "session_created": {
      const e = event as SessionCreatedEvent;
      normalized.data = { sessionId: e.session.id };
      break;
    }

    case "audio_delta": {
      const e = event as AudioDeltaEvent;
      normalized.data = { audioBase64: e.delta };
      break;
    }

    case "transcript_delta": {
      const e = event as TranscriptDeltaEvent;
      normalized.data = { textDelta: e.delta };
      break;
    }

    case "transcript_done": {
      const e = event as TranscriptDoneEvent;
      normalized.data = { fullText: e.transcript };
      break;
    }

    case "response_done": {
      const e = event as ResponseDoneEvent;
      normalized.data = {
        status: e.response.status,
        errorMessage: e.response.status_details?.error?.message,
        errorCode: e.response.status_details?.error?.code,
      };
      break;
    }

    case "input_transcript_delta": {
      const e = event as InputAudioTranscriptionDeltaEvent;
      normalized.data = { textDelta: e.delta };
      break;
    }

    case "input_transcript_done": {
      const e = event as InputAudioTranscriptionCompletedEvent;
      normalized.data = { fullText: e.transcript };
      break;
    }

    case "error": {
      const e = event as ErrorEvent;
      normalized.data = {
        errorMessage: e.error.message,
        errorCode: e.error.code,
      };
      break;
    }
  }

  return normalized;
}

// Check if event should be logged (filter out noisy events)
export function shouldLogEvent(event: RealtimeEvent): boolean {
  const noisyEvents = [
    "response.audio.delta",
    "response.audio_transcript.delta",
    "rate_limits.updated",
    "input_audio_buffer.speech_started",
    "input_audio_buffer.speech_stopped",
  ];
  return !noisyEvents.includes(event.type);
}
