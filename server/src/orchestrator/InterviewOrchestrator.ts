import WebSocket from "ws";
import type { Speaker, Target, InterviewMode, EndReason } from "../types/roles.js";
import type { ClientMessage, ServerMessage } from "../types/ws.js";
import { INTERVIEW_CONFIG } from "../config.js";
import { OpenAIRealtimeConnection } from "../realtime/openaiWs.js";
import { createSessionConfigs } from "../realtime/sessionFactory.js";
import { TurnManager } from "./TurnManager.js";
import { TranscriptStore } from "./TranscriptStore.js";

export class InterviewOrchestrator {
  private clientSocket: WebSocket;
  private interviewerConnection: OpenAIRealtimeConnection | null = null;
  private candidateConnection: OpenAIRealtimeConnection | null = null;

  private turnManager: TurnManager;
  private transcriptStore: TranscriptStore;

  private interviewerReady = false;
  private candidateReady = false;
  private pendingStart = false;

  private interviewEnded = false;
  private endReason: EndReason = null;

  private currentTranscriptBuffer = "";

  constructor(clientSocket: WebSocket, mode: InterviewMode = "step") {
    this.clientSocket = clientSocket;
    this.turnManager = new TurnManager(mode);
    this.transcriptStore = new TranscriptStore();

    this.setupClientHandlers();
    this.setupAIConnections();
  }

  private setupClientHandlers(): void {
    this.clientSocket.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString()) as ClientMessage;
        this.handleClientMessage(data);
      } catch (error) {
        console.error("[Orchestrator] Failed to parse client message:", error);
      }
    });

    this.clientSocket.on("close", () => {
      console.log("[Orchestrator] Client disconnected");
      this.cleanup();
    });

    this.clientSocket.on("error", (error) => {
      console.error("[Orchestrator] Client socket error:", error);
    });
  }

  private setupAIConnections(): void {
    const configs = createSessionConfigs();

    // Setup interviewer connection
    this.interviewerConnection = new OpenAIRealtimeConnection(
      "Interviewer",
      configs.interviewer,
      {
        onSessionReady: () => {
          this.interviewerReady = true;
          console.log("[Orchestrator] Interviewer session ready");
          this.checkAndStartInterview();
        },
        onAudioDelta: (audio) => this.handleAudioDelta("interviewer", audio),
        onAudioDone: () => this.handleAudioDone("interviewer"),
        onTranscriptDelta: (delta) => this.handleTranscriptDelta("interviewer", delta),
        onTranscriptDone: (text) => this.handleTranscriptDone("interviewer", text),
        onInputTranscriptDone: (text) => this.handleHumanTranscript(text),
        onResponseDone: (status, error) => this.handleResponseDone("interviewer", status, error),
        onError: (error) => this.handleError(error),
        onClose: () => this.handleConnectionClose("interviewer"),
      }
    );

    // Setup candidate connection
    this.candidateConnection = new OpenAIRealtimeConnection(
      "Candidate",
      configs.candidate,
      {
        onSessionReady: () => {
          this.candidateReady = true;
          console.log("[Orchestrator] Candidate session ready");
          this.checkAndStartInterview();
        },
        onAudioDelta: (audio) => this.handleAudioDelta("candidate", audio),
        onAudioDone: () => this.handleAudioDone("candidate"),
        onTranscriptDelta: (delta) => this.handleTranscriptDelta("candidate", delta),
        onTranscriptDone: (text) => this.handleTranscriptDone("candidate", text),
        onResponseDone: (status, error) => this.handleResponseDone("candidate", status, error),
        onError: (error) => this.handleError(error),
        onClose: () => this.handleConnectionClose("candidate"),
      }
    );

    this.interviewerConnection.connect();
    this.candidateConnection.connect();
  }

  private handleClientMessage(data: ClientMessage): void {
    console.log("[Orchestrator] Client message:", data.type);

    switch (data.type) {
      // New protocol
      case "start_session":
        this.turnManager.setMode(data.mode);
        this.startInterview();
        break;

      case "set_mode":
        this.turnManager.setMode(data.mode);
        break;

      case "next_turn":
        this.handleNextTurn();
        break;

      case "human_text":
        this.handleHumanText(data.target, data.text);
        break;

      case "human_audio_chunk":
        this.handleHumanAudioChunk(data.target, data.audioBase64);
        break;

      case "human_audio_commit":
        this.handleHumanAudioCommit(data.target);
        break;

      case "end_session":
        this.endInterview("normal");
        break;

      // Legacy protocol support
      case "start_interview":
        this.startInterview();
        break;

      case "audio":
        // Legacy: send to both AIs
        this.handleHumanAudioChunk("both", data.data);
        break;

      case "audio_playback_done":
        this.handleAudioPlaybackDone();
        break;

      case "proceed_to_next":
        this.handleProceedToNext();
        break;

      case "user_will_speak":
        this.turnManager.onHumanSpeakStart();
        this.sendTurnState();
        // Legacy phase change
        this.sendLegacyPhaseChange("user_speaking", "転職支援");
        break;

      case "user_done_speaking":
        this.handleUserDoneSpeaking();
        break;
    }
  }

  private startInterview(): void {
    if (this.interviewerReady && this.candidateReady) {
      console.log("[Orchestrator] Both sessions ready, starting interview");
      this.sendToClient({ type: "session_ready" });
      this.sendToClient({ type: "sessions_ready" }); // Legacy

      this.turnManager.start();
      this.sendTurnState();

      // Legacy phase change
      this.sendLegacyPhaseChange("interviewer", "田中部長");

      // Trigger interviewer to start
      this.interviewerConnection?.requestResponse();
    } else {
      console.log("[Orchestrator] Waiting for sessions to be ready...");
      this.pendingStart = true;
      this.sendToClient({ type: "waiting_for_sessions" });
    }
  }

  private checkAndStartInterview(): void {
    if (this.pendingStart && this.interviewerReady && this.candidateReady) {
      this.pendingStart = false;
      this.startInterview();
    }
  }

  private handleNextTurn(): void {
    if (this.interviewEnded) return;

    this.turnManager.onNextTurn();
    const state = this.turnManager.getState();
    this.sendTurnState();

    if (state.currentSpeaker === "interviewer") {
      this.sendLegacyPhaseChange("interviewer", "田中部長");
      this.interviewerConnection?.requestResponse();
    } else if (state.currentSpeaker === "candidate") {
      this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
      this.candidateConnection?.requestResponse();
    }
  }

  private handleHumanText(target: Target, text: string): void {
    this.turnManager.onHumanSpeakStart();
    this.sendTurnState();

    const contextMessage = `[転職支援エージェント]: ${text}`;

    // Add to transcript
    this.transcriptStore.commit("human", text);
    this.sendToClient({
      type: "transcript_done",
      speaker: "human",
      text,
    });

    // Send to target AI(s)
    if (target === "interviewer" || target === "both") {
      this.interviewerConnection?.addTextMessage(contextMessage);
    }
    if (target === "candidate" || target === "both") {
      this.candidateConnection?.addTextMessage(contextMessage);
    }

    // Proceed after human input
    this.turnManager.onHumanSpeakDone();
    this.sendTurnState();

    // Auto trigger interviewer response after human text
    if (this.turnManager.getMode() === "auto") {
      this.sendLegacyPhaseChange("interviewer", "田中部長");
      this.interviewerConnection?.requestResponse();
    }
  }

  private handleHumanAudioChunk(target: Target, audioBase64: string): void {
    if (target === "interviewer" || target === "both") {
      this.interviewerConnection?.appendAudio(audioBase64);
    }
    if (target === "candidate" || target === "both") {
      this.candidateConnection?.appendAudio(audioBase64);
    }
  }

  private handleHumanAudioCommit(target: Target): void {
    if (target === "interviewer" || target === "both") {
      this.interviewerConnection?.commitAudio();
    }
    if (target === "candidate" || target === "both") {
      this.candidateConnection?.commitAudio();
    }

    this.turnManager.onHumanSpeakDone();
    this.sendTurnState();
  }

  private handleAudioDelta(speaker: Speaker, audioBase64: string): void {
    const state = this.turnManager.getState();

    // Only send audio if this speaker is currently active
    if (
      (speaker === "interviewer" && state.phase === "interviewer") ||
      (speaker === "candidate" && state.phase === "candidate")
    ) {
      this.sendToClient({
        type: "audio_delta",
        speaker,
        audioBase64,
      });

      // Legacy format
      this.sendToClient({
        type: "audio",
        source: speaker === "interviewer" ? "ai_a" : "ai_b",
        data: audioBase64,
      });
    }
  }

  private handleAudioDone(speaker: Speaker): void {
    console.log(`[Orchestrator] Audio done for ${speaker}`);

    this.sendToClient({
      type: "audio_done",
      speaker,
    });
  }

  private handleTranscriptDelta(speaker: Speaker, delta: string): void {
    this.transcriptStore.addDelta(speaker, delta);

    this.sendToClient({
      type: "transcript_delta",
      speaker,
      textDelta: delta,
    });
  }

  private handleTranscriptDone(speaker: Speaker, fullText: string): void {
    const entry = this.transcriptStore.commit(speaker, fullText);

    this.sendToClient({
      type: "transcript_done",
      speaker,
      text: fullText,
    });

    // Legacy format
    this.sendToClient({
      type: "transcript",
      source: speaker === "interviewer" ? "ai_a" : "ai_b",
      name: speaker === "interviewer" ? "田中部長" : "グエン・ミン",
      text: fullText,
    });

    // Share context with other AI
    this.shareContextWithOtherAI(speaker, fullText);

    // Check for interview end markers
    this.checkForEndMarkers(fullText);
  }

  private handleHumanTranscript(text: string): void {
    this.transcriptStore.commit("human", text);

    this.sendToClient({
      type: "transcript_done",
      speaker: "human",
      text,
    });
  }

  private handleResponseDone(speaker: Speaker, status: string, errorMessage?: string): void {
    console.log(`[Orchestrator] Response done for ${speaker}: ${status}`);

    if (status !== "completed" && errorMessage) {
      console.error(`[Orchestrator] Response error: ${errorMessage}`);
      this.sendToClient({
        type: "error",
        message: `${speaker} response failed: ${errorMessage}`,
      });
    }

    // In step mode, we wait for audio_playback_done from client
    // In auto mode, we can proceed after response is done
    if (this.turnManager.getMode() === "auto" && !this.interviewEnded) {
      this.turnManager.onAISpeakingDone(speaker as "interviewer" | "candidate");
      this.sendTurnState();
    }
  }

  private handleAudioPlaybackDone(): void {
    if (this.interviewEnded) {
      this.sendLegacyPhaseChange("ended", undefined, this.endReason || undefined);
      return;
    }

    const state = this.turnManager.getState();

    if (state.phase === "interviewer" || state.currentSpeaker === "interviewer") {
      // Interviewer finished, candidate responds
      this.turnManager.setSpeaker("candidate");
      this.sendTurnState();
      this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
      this.candidateConnection?.requestResponse();
    } else if (state.phase === "candidate" || state.currentSpeaker === "candidate") {
      // Candidate finished, go to user choice
      this.turnManager.toUserChoice();
      this.sendTurnState();
      this.sendLegacyPhaseChange("user_choice");
    } else if (state.phase === "user_speaking" || state.currentSpeaker === "human") {
      // After user speaking, interviewer responds
      this.turnManager.setSpeaker("interviewer");
      this.sendTurnState();
      this.sendLegacyPhaseChange("interviewer", "田中部長");
      this.interviewerConnection?.requestResponse();
    }
  }

  private handleProceedToNext(): void {
    if (this.interviewEnded) return;

    // User chose to proceed without commenting
    this.turnManager.setSpeaker("interviewer");
    this.sendTurnState();
    this.sendLegacyPhaseChange("interviewer", "田中部長");
    this.interviewerConnection?.requestResponse();
  }

  private handleUserDoneSpeaking(): void {
    // Commit audio to both AIs
    this.interviewerConnection?.commitAudio();
    this.candidateConnection?.commitAudio();

    this.turnManager.onHumanSpeakDone();
    this.sendTurnState();

    // Interviewer responds after user speaks
    this.sendLegacyPhaseChange("interviewer", "田中部長");
    this.interviewerConnection?.requestResponse();
  }

  private shareContextWithOtherAI(speaker: Speaker, text: string): void {
    const label = speaker === "interviewer" ? "面接官が言いました" : "求職者が言いました";
    const contextMessage = `[${label}]: ${text}`;

    if (speaker === "interviewer") {
      this.candidateConnection?.addTextMessage(contextMessage);
    } else if (speaker === "candidate") {
      this.interviewerConnection?.addTextMessage(contextMessage);
    }
  }

  private checkForEndMarkers(text: string): void {
    if (text.includes(INTERVIEW_CONFIG.END_MARKER)) {
      console.log("[Orchestrator] Interview end marker detected");
      this.endInterview("normal");
    } else if (text.includes(INTERVIEW_CONFIG.ABORT_MARKER)) {
      console.log("[Orchestrator] Interview abort marker detected");
      this.endInterview("aborted");
    }
  }

  private endInterview(reason: EndReason): void {
    this.interviewEnded = true;
    this.endReason = reason;
    this.turnManager.end();
    this.sendTurnState();
  }

  private handleError(error: Error): void {
    console.error("[Orchestrator] Error:", error.message);
    this.sendToClient({
      type: "error",
      message: error.message,
    });
  }

  private handleConnectionClose(which: "interviewer" | "candidate"): void {
    console.log(`[Orchestrator] ${which} connection closed`);
    if (which === "interviewer") {
      this.interviewerReady = false;
    } else {
      this.candidateReady = false;
    }
  }

  private sendTurnState(): void {
    const state = this.turnManager.getState();

    this.sendToClient({
      type: "turn_state",
      currentSpeaker: state.currentSpeaker || "interviewer",
      waitingForNext: state.waitingForNext,
    });
  }

  private sendLegacyPhaseChange(phase: string, speaker?: string, reason?: string): void {
    const message: ServerMessage = {
      type: "phase_change",
      phase,
    };
    if (speaker) message.speaker = speaker;
    if (reason) message.reason = reason;
    this.sendToClient(message);
  }

  private sendToClient(message: ServerMessage): void {
    if (this.clientSocket.readyState === WebSocket.OPEN) {
      this.clientSocket.send(JSON.stringify(message));
    }
  }

  private cleanup(): void {
    this.interviewerConnection?.close();
    this.candidateConnection?.close();
    this.interviewerConnection = null;
    this.candidateConnection = null;
  }
}
