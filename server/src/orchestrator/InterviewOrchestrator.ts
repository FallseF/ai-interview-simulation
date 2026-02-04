import WebSocket from "ws";
import type { Speaker, Target, InterviewMode, EndReason, PatternConfig, AIPersonaConfig } from "../types/roles.js";
import type { ClientMessage, ServerMessage, EvaluationResultMessage } from "../types/ws.js";
import { INTERVIEW_CONFIG, MOCK_MODE } from "../config.js";
import { OpenAIRealtimeConnection, type OpenAIConnectionCallbacks } from "../realtime/openaiWs.js";
import { MockOpenAIRealtimeConnection, type MockScenario } from "../realtime/mockOpenaiWs.js";
import { TurnManager } from "./TurnManager.js";
import { TranscriptStore } from "./TranscriptStore.js";
import { Evaluator } from "../evaluation/Evaluator.js";
import { FeedbackFormatter } from "../evaluation/FeedbackFormatter.js";
// Pattern-specific configurations
import { createPattern1StudentConfig } from "../prompts/patterns/pattern1.js";
import { createPattern2InterviewerConfig, createPattern2StudentConfig } from "../prompts/patterns/pattern2.js";
import { createPattern3InterviewerConfig } from "../prompts/patterns/pattern3.js";

// 接続のインターフェース型（本物とモックで共通）
type AIConnection = OpenAIRealtimeConnection | MockOpenAIRealtimeConnection;

export class InterviewOrchestrator {
  private clientSocket: WebSocket;
  private interviewerConnection: AIConnection | null = null;
  private candidateConnection: AIConnection | null = null;

  private turnManager: TurnManager;
  private transcriptStore: TranscriptStore;

  private interviewerReady = false;
  private candidateReady = false;
  private pendingStart = false;

  private interviewEnded = false;
  private endReason: EndReason = null;

  private currentTranscriptBuffer = "";

  // パターン設定
  private patternConfig: PatternConfig;

  // モックモード時のカスタムシナリオ（オプション）
  private mockScenario?: MockScenario;

  constructor(
    clientSocket: WebSocket,
    patternConfig: PatternConfig,
    mode: InterviewMode = "step",
    mockScenario?: MockScenario
  ) {
    this.clientSocket = clientSocket;
    this.patternConfig = patternConfig;
    this.turnManager = new TurnManager(mode);
    this.transcriptStore = new TranscriptStore();
    this.mockScenario = mockScenario;

    this.setupClientHandlers();
    this.setupAIConnections();

    // Automatically start interview when AI connections are ready
    // startInterview() will set pendingStart=true if connections aren't ready yet
    this.startInterview();
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

  /**
   * Get AI configurations based on the current pattern
   */
  private getPatternConfigs(): { interviewerConfig: AIPersonaConfig | null; candidateConfig: AIPersonaConfig | null } {
    const { pattern, japaneseLevel } = this.patternConfig;
    console.log(`[Orchestrator] Getting configs for pattern: ${pattern}, japaneseLevel: ${japaneseLevel}`);

    switch (pattern) {
      case "pattern1":
        // 営業(human) vs 学生(AI) - 出席確認・自己紹介練習
        return {
          interviewerConfig: null,
          candidateConfig: createPattern1StudentConfig({ japaneseLevel }),
        };
      case "pattern2":
        // 営業(human) vs 学生(AI) vs 面接官(AI) - 面接本番
        const candidateConfig = createPattern2StudentConfig({ japaneseLevel });
        console.log(`[Orchestrator] Candidate instructions preview (first 500 chars):`);
        console.log(candidateConfig.instructions.substring(0, 500));
        return {
          interviewerConfig: createPattern2InterviewerConfig(),
          candidateConfig,
        };
      case "pattern3":
        // 営業(human) vs 面接官(AI) - 学生退席後のヒアリング
        return {
          interviewerConfig: createPattern3InterviewerConfig(),
          candidateConfig: null,
        };
      default:
        // Fallback to pattern2
        return {
          interviewerConfig: createPattern2InterviewerConfig(),
          candidateConfig: createPattern2StudentConfig({ japaneseLevel }),
        };
    }
  }

  private setupAIConnections(): void {
    const { interviewerConfig, candidateConfig } = this.getPatternConfigs();
    const { participants } = this.patternConfig;

    // パターンに応じて必要な接続を判定
    const needsInterviewer = participants.includes("interviewer");
    const needsCandidate = participants.includes("candidate");

    console.log(`[Orchestrator] Pattern: ${this.patternConfig.pattern}, Participants: ${participants.join(", ")}`);

    // 面接官接続が不要な場合は即座にready扱い
    if (!needsInterviewer) {
      this.interviewerReady = true;
    }
    // 候補者接続が不要な場合は即座にready扱い
    if (!needsCandidate) {
      this.candidateReady = true;
    }

    // 面接官コールバック
    const interviewerCallbacks: OpenAIConnectionCallbacks = {
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
    };

    // 候補者コールバック
    const candidateCallbacks: OpenAIConnectionCallbacks = {
      onSessionReady: () => {
        this.candidateReady = true;
        console.log("[Orchestrator] Candidate session ready");
        this.checkAndStartInterview();
      },
      onAudioDelta: (audio) => this.handleAudioDelta("candidate", audio),
      onAudioDone: () => this.handleAudioDone("candidate"),
      onTranscriptDelta: (delta) => this.handleTranscriptDelta("candidate", delta),
      onTranscriptDone: (text) => this.handleTranscriptDone("candidate", text),
      onInputTranscriptDone: (text) => this.handleHumanTranscript(text),
      onResponseDone: (status, error) => this.handleResponseDone("candidate", status, error),
      onError: (error) => this.handleError(error),
      onClose: () => this.handleConnectionClose("candidate"),
    };

    if (MOCK_MODE) {
      // モックモード: 本物のAPIに繋がない
      console.log("[Orchestrator] 🧪 Using mock connections");

      if (needsInterviewer && interviewerConfig) {
        this.interviewerConnection = new MockOpenAIRealtimeConnection(
          "Interviewer",
          interviewerConfig,
          interviewerCallbacks,
          this.mockScenario
        );
        this.interviewerConnection.connect();
      }

      if (needsCandidate && candidateConfig) {
        this.candidateConnection = new MockOpenAIRealtimeConnection(
          "Candidate",
          candidateConfig,
          candidateCallbacks,
          this.mockScenario
        );
        this.candidateConnection.connect();
      }
    } else {
      // 本番モード: 本物のOpenAI APIに接続
      if (needsInterviewer && interviewerConfig) {
        this.interviewerConnection = new OpenAIRealtimeConnection(
          "Interviewer",
          interviewerConfig,
          interviewerCallbacks
        );
        this.interviewerConnection.connect();
      }

      if (needsCandidate && candidateConfig) {
        this.candidateConnection = new OpenAIRealtimeConnection(
          "Candidate",
          candidateConfig,
          candidateCallbacks
        );
        this.candidateConnection.connect();
      }
    }
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
      console.log(`[Orchestrator] Sessions ready, starting interview (pattern: ${this.patternConfig.pattern})`);
      this.sendToClient({
        type: "session_ready",
        pattern: this.patternConfig.pattern,
        japaneseLevel: this.patternConfig.japaneseLevel,
        participants: this.patternConfig.participants,
      });
      this.sendToClient({ type: "sessions_ready" }); // Legacy

      this.turnManager.start();
      this.sendTurnState();

      // パターンに応じた開始処理
      const { pattern } = this.patternConfig;

      if (pattern === "pattern1") {
        // pattern1: 候補者（外国人学生）のみ - 候補者から開始
        this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
        this.candidateConnection?.requestResponse();
      } else if (pattern === "pattern2") {
        // pattern2: 両方 - 面接官から開始（従来通り）
        this.sendLegacyPhaseChange("interviewer", "田中部長");
        this.interviewerConnection?.requestResponse();
      } else if (pattern === "pattern3") {
        // pattern3: 面接官のみ - 面接官から開始
        this.sendLegacyPhaseChange("interviewer", "田中部長");
        this.interviewerConnection?.requestResponse();
      }
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

    // 待機中でなければ無視（多重送信防止）
    const stateBefore = this.turnManager.getState();
    if (!stateBefore.waitingForNext) return;

    this.turnManager.onNextTurn();
    const state = this.turnManager.getState();
    this.sendTurnState();

    if (state.currentSpeaker === "interviewer" && this.interviewerConnection) {
      this.sendLegacyPhaseChange("interviewer", "田中部長");
      this.interviewerConnection.requestResponse();
    } else if (state.currentSpeaker === "candidate" && this.candidateConnection) {
      this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
      this.candidateConnection.requestResponse();
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

    // Auto trigger response after human text based on pattern
    if (this.turnManager.getMode() === "auto") {
      const { pattern } = this.patternConfig;
      if (pattern === "pattern1" && this.candidateConnection) {
        this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
        this.candidateConnection.requestResponse();
      } else if (this.interviewerConnection) {
        this.sendLegacyPhaseChange("interviewer", "田中部長");
        this.interviewerConnection.requestResponse();
      }
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

    // autoモード時にパターンに応じた応答要求
    if (this.turnManager.getMode() === "auto") {
      const { pattern } = this.patternConfig;
      if (pattern === "pattern1" && this.candidateConnection) {
        this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
        this.candidateConnection.requestResponse();
      } else if (this.interviewerConnection) {
        this.sendLegacyPhaseChange("interviewer", "田中部長");
        this.interviewerConnection.requestResponse();
      }
    }
  }

  private handleAudioDelta(speaker: Speaker, audioBase64: string): void {
    // Send audio to client (only new format, no legacy duplicate)
    this.sendToClient({
      type: "audio_delta",
      speaker,
      audioBase64,
    });
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
    this.transcriptStore.commit(speaker, fullText);

    this.sendToClient({
      type: "transcript_done",
      speaker,
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
    // Turn progression is handled in handleAudioPlaybackDone to prevent double triggers
  }

  private handleAudioPlaybackDone(): void {
    if (this.interviewEnded) {
      this.sendLegacyPhaseChange("ended", undefined, this.endReason || undefined);
      return;
    }

    const state = this.turnManager.getState();
    const isStepMode = this.turnManager.getMode() === "step";
    const { pattern } = this.patternConfig;

    if (state.phase === "interviewer" || state.currentSpeaker === "interviewer") {
      if (isStepMode) {
        // Step mode: wait for user to proceed
        this.turnManager.onAISpeakingDone("interviewer");
        this.sendTurnState();
        this.sendLegacyPhaseChange("user_choice");
      } else {
        // Auto mode: パターンに応じた次のスピーカー
        if (pattern === "pattern2" && this.candidateConnection) {
          // pattern2: 候補者が応答
          this.turnManager.setSpeaker("candidate");
          this.sendTurnState();
          this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
          this.candidateConnection.requestResponse();
        } else {
          // pattern3 or no candidate: user choice
          this.turnManager.onAISpeakingDone("interviewer");
          this.sendTurnState();
          this.sendLegacyPhaseChange("user_choice");
        }
      }
    } else if (state.phase === "candidate" || state.currentSpeaker === "candidate") {
      if (isStepMode) {
        // Step mode: wait for user to proceed
        this.turnManager.onAISpeakingDone("candidate");
        this.sendTurnState();
        this.sendLegacyPhaseChange("user_choice");
      } else {
        // Auto mode: パターンに応じた次のスピーカー
        if (pattern === "pattern2" && this.interviewerConnection) {
          // pattern2: 面接官が応答
          this.turnManager.setSpeaker("interviewer");
          this.sendTurnState();
          this.sendLegacyPhaseChange("interviewer", "田中部長");
          this.interviewerConnection.requestResponse();
        } else {
          // pattern1 or no interviewer: user choice
          this.turnManager.onAISpeakingDone("candidate");
          this.sendTurnState();
          this.sendLegacyPhaseChange("user_choice");
        }
      }
    } else if (state.phase === "user_speaking" || state.currentSpeaker === "human") {
      if (isStepMode) {
        // Step mode: wait for user to proceed
        this.turnManager.onHumanSpeakDone();
        this.sendTurnState();
        this.sendLegacyPhaseChange("user_choice");
      } else {
        // Auto mode: パターンに応じた次のスピーカー
        if (pattern === "pattern1" && this.candidateConnection) {
          // pattern1: 候補者が応答
          this.turnManager.setSpeaker("candidate");
          this.sendTurnState();
          this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
          this.candidateConnection.requestResponse();
        } else if (this.interviewerConnection) {
          // pattern2, pattern3: 面接官が応答
          this.turnManager.setSpeaker("interviewer");
          this.sendTurnState();
          this.sendLegacyPhaseChange("interviewer", "田中部長");
          this.interviewerConnection.requestResponse();
        } else {
          this.turnManager.onHumanSpeakDone();
          this.sendTurnState();
          this.sendLegacyPhaseChange("user_choice");
        }
      }
    }
  }

  private handleProceedToNext(): void {
    if (this.interviewEnded) return;

    const { pattern } = this.patternConfig;

    // User chose to proceed without commenting
    // パターンに応じた次のスピーカーを決定
    if (pattern === "pattern1" && this.candidateConnection) {
      // pattern1: 候補者のみ
      this.turnManager.setSpeaker("candidate");
      this.sendTurnState();
      this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
      this.candidateConnection.requestResponse();
    } else if (this.interviewerConnection) {
      // pattern2, pattern3: 面接官優先
      this.turnManager.setSpeaker("interviewer");
      this.sendTurnState();
      this.sendLegacyPhaseChange("interviewer", "田中部長");
      this.interviewerConnection.requestResponse();
    }
  }

  private handleUserDoneSpeaking(): void {
    const { pattern } = this.patternConfig;

    // Commit audio to connected AIs only
    this.interviewerConnection?.commitAudio();
    this.candidateConnection?.commitAudio();

    this.turnManager.onHumanSpeakDone();
    this.sendTurnState();

    // パターンに応じた次のスピーカー
    if (pattern === "pattern1" && this.candidateConnection) {
      // pattern1: 候補者が応答
      this.sendLegacyPhaseChange("maria_speaking", "グエン・ミン");
      this.candidateConnection.requestResponse();
    } else if (this.interviewerConnection) {
      // pattern2, pattern3: 面接官が応答
      this.sendLegacyPhaseChange("interviewer", "田中部長");
      this.interviewerConnection.requestResponse();
    }
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

    // 評価を実行してフィードバックを送信
    this.performEvaluation();
  }

  /**
   * 面接終了後の評価を実行
   */
  private performEvaluation(): void {
    console.log("[Orchestrator] Starting evaluation...");

    try {
      const evaluator = new Evaluator();
      const transcripts = this.transcriptStore.getAll();
      const result = evaluator.evaluate(transcripts);

      // コンソールにテキスト形式で出力
      console.log("\n" + FeedbackFormatter.toText(result));

      // クライアントにJSON形式で送信
      const resultJson = FeedbackFormatter.toJSON(result) as EvaluationResultMessage;
      this.sendToClient({
        type: "evaluation_result",
        result: resultJson,
      });

      console.log("[Orchestrator] Evaluation completed and sent to client");
    } catch (error) {
      console.error("[Orchestrator] Evaluation error:", error);
      this.sendToClient({
        type: "error",
        message: `評価中にエラーが発生しました: ${error}`,
      });
    }
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
      currentSpeaker: state.currentSpeaker,
      waitingForNext: state.waitingForNext,
      phase: state.phase,
      mode: this.turnManager.getMode(),
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
