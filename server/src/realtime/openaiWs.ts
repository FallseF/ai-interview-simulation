import WebSocket from "ws";
import { OPENAI_API_KEY, OPENAI_REALTIME_URL } from "../config.js";
import type { RealtimeEvent } from "../types/ws.js";
import type { AIPersonaConfig } from "../types/roles.js";
import { normalizeEvent, shouldLogEvent, type NormalizedEvent } from "./events.js";

export interface OpenAIConnectionCallbacks {
  onSessionReady: () => void;
  onAudioDelta: (audioBase64: string) => void;
  onAudioDone: () => void;
  onTranscriptDelta: (textDelta: string) => void;
  onTranscriptDone: (fullText: string) => void;
  onInputTranscriptDelta?: (textDelta: string) => void;
  onInputTranscriptDone?: (fullText: string) => void;
  onResponseDone: (status: string, errorMessage?: string) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

export class OpenAIRealtimeConnection {
  private ws: WebSocket | null = null;
  private name: string;
  private config: AIPersonaConfig;
  private callbacks: OpenAIConnectionCallbacks;
  private isReady = false;

  constructor(
    name: string,
    config: AIPersonaConfig,
    callbacks: OpenAIConnectionCallbacks
  ) {
    this.name = name;
    this.config = config;
    this.callbacks = callbacks;
  }

  connect(): void {
    console.log(`[${this.name}] Connecting to OpenAI Realtime API...`);

    this.ws = new WebSocket(OPENAI_REALTIME_URL, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    this.ws.on("open", () => {
      console.log(`[${this.name}] Connected to OpenAI Realtime API`);
      this.sendSessionUpdate();
    });

    this.ws.on("message", (data) => {
      this.handleMessage(data.toString());
    });

    this.ws.on("error", (error) => {
      console.error(`[${this.name}] WebSocket error:`, error);
      this.callbacks.onError(error);
    });

    this.ws.on("close", (code, reason) => {
      console.log(`[${this.name}] Connection closed: ${code} - ${reason.toString()}`);
      this.isReady = false;
      this.callbacks.onClose();
    });
  }

  private sendSessionUpdate(): void {
    const sessionUpdate = {
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: this.config.instructions,
        voice: this.config.voice,
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: null, // Disable VAD - we control turns manually
      },
    };

    this.send(sessionUpdate);
    console.log(`[${this.name}] Session update sent`);
  }

  private handleMessage(data: string): void {
    try {
      const event: RealtimeEvent = JSON.parse(data);
      const normalized = normalizeEvent(event);

      if (shouldLogEvent(event)) {
        console.log(`[${this.name}] Event: ${event.type}`);
      }

      this.handleNormalizedEvent(normalized);
    } catch (error) {
      console.error(`[${this.name}] Failed to parse message:`, error);
    }
  }

  private handleNormalizedEvent(event: NormalizedEvent): void {
    switch (event.type) {
      case "session_created":
        console.log(`[${this.name}] Session created: ${event.data?.sessionId}`);
        break;

      case "session_updated":
        console.log(`[${this.name}] Session updated and ready`);
        this.isReady = true;
        this.callbacks.onSessionReady();
        break;

      case "audio_delta":
        if (event.data?.audioBase64) {
          this.callbacks.onAudioDelta(event.data.audioBase64);
        }
        break;

      case "audio_done":
        this.callbacks.onAudioDone();
        break;

      case "transcript_delta":
        if (event.data?.textDelta) {
          this.callbacks.onTranscriptDelta(event.data.textDelta);
        }
        break;

      case "transcript_done":
        if (event.data?.fullText) {
          console.log(`[${this.name}] Transcript: ${event.data.fullText}`);
          this.callbacks.onTranscriptDone(event.data.fullText);
        }
        break;

      case "input_transcript_delta":
        if (event.data?.textDelta && this.callbacks.onInputTranscriptDelta) {
          this.callbacks.onInputTranscriptDelta(event.data.textDelta);
        }
        break;

      case "input_transcript_done":
        if (event.data?.fullText && this.callbacks.onInputTranscriptDone) {
          console.log(`[${this.name}] Input transcript: ${event.data.fullText}`);
          this.callbacks.onInputTranscriptDone(event.data.fullText);
        }
        break;

      case "response_done":
        console.log(`[${this.name}] Response done: ${event.data?.status}`);
        this.callbacks.onResponseDone(
          event.data?.status || "unknown",
          event.data?.errorMessage
        );
        break;

      case "error":
        console.error(`[${this.name}] Error:`, event.data?.errorMessage);
        this.callbacks.onError(new Error(event.data?.errorMessage || "Unknown error"));
        break;
    }
  }

  send(message: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // Send audio data to the session
  appendAudio(audioBase64: string): void {
    this.send({
      type: "input_audio_buffer.append",
      audio: audioBase64,
    });
  }

  // Commit the audio buffer
  commitAudio(): void {
    this.send({
      type: "input_audio_buffer.commit",
    });
  }

  // Clear the audio buffer
  clearAudio(): void {
    this.send({
      type: "input_audio_buffer.clear",
    });
  }

  // Add a text message to the conversation
  addTextMessage(text: string, role: "user" | "assistant" = "user"): void {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "message",
        role,
        content: [
          {
            type: "input_text",
            text,
          },
        ],
      },
    });
  }

  // Request a response from the AI
  requestResponse(): void {
    this.send({
      type: "response.create",
      response: {
        modalities: ["text", "audio"],
      },
    });
  }

  // Cancel ongoing response
  cancelResponse(): void {
    this.send({
      type: "response.cancel",
    });
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isReady = false;
  }

  get ready(): boolean {
    return this.isReady;
  }

  get connected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
