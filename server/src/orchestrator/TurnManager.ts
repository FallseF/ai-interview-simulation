import type { InterviewMode, Speaker, Phase } from "../types/roles.js";
import { INTERVIEW_CONFIG } from "../config.js";

export interface TurnState {
  phase: Phase;
  currentSpeaker: Speaker | null;
  waitingForNext: boolean;
  turnCount: number;
  interviewerTurns: number;
  candidateTurns: number;
}

export class TurnManager {
  private mode: InterviewMode;
  private phase: Phase = "waiting";
  private currentSpeaker: Speaker | null = null;
  private waitingForNext = false;
  private turnCount = 0;
  private interviewerTurns = 0;
  private candidateTurns = 0;

  constructor(mode: InterviewMode = "step") {
    this.mode = mode;
  }

  // Get current state
  getState(): TurnState {
    return {
      phase: this.phase,
      currentSpeaker: this.currentSpeaker,
      waitingForNext: this.waitingForNext,
      turnCount: this.turnCount,
      interviewerTurns: this.interviewerTurns,
      candidateTurns: this.candidateTurns,
    };
  }

  // Set mode
  setMode(mode: InterviewMode): void {
    this.mode = mode;
  }

  // Get current mode
  getMode(): InterviewMode {
    return this.mode;
  }

  // Start the interview
  start(): void {
    this.phase = "interviewer";
    this.currentSpeaker = "interviewer";
    this.waitingForNext = false;
    this.turnCount = 1;
    this.interviewerTurns = 1;
  }

  // Called when AI finishes speaking
  onAISpeakingDone(speaker: "interviewer" | "candidate"): void {
    if (speaker === "interviewer") {
      this.interviewerTurns++;
    } else {
      this.candidateTurns++;
    }

    if (this.mode === "step") {
      // In step mode, wait for user to trigger next turn
      this.waitingForNext = true;
      this.phase = "user_choice";
      this.currentSpeaker = null;
    } else {
      // In auto mode, automatically proceed
      this.proceedToNextSpeaker(speaker);
    }

    this.turnCount++;
  }

  // Called when user triggers next turn (step mode)
  onNextTurn(): void {
    if (!this.waitingForNext) return;

    this.waitingForNext = false;

    // Determine next speaker based on current phase
    if (this.phase === "user_choice" || this.currentSpeaker === "candidate") {
      this.phase = "interviewer";
      this.currentSpeaker = "interviewer";
    } else if (this.currentSpeaker === "interviewer") {
      this.phase = "candidate";
      this.currentSpeaker = "candidate";
    }
  }

  // Called when human starts speaking
  onHumanSpeakStart(): void {
    this.phase = "user_speaking";
    this.currentSpeaker = "human";
    this.waitingForNext = false;
  }

  // Called when human finishes speaking
  onHumanSpeakDone(): void {
    this.turnCount++;

    if (this.mode === "step") {
      this.waitingForNext = true;
      this.phase = "user_choice";
      this.currentSpeaker = null;
    } else {
      // In auto mode, proceed to interviewer after human speaks
      this.phase = "interviewer";
      this.currentSpeaker = "interviewer";
    }
  }

  // Proceed to user choice phase (after candidate speaks)
  toUserChoice(): void {
    this.phase = "user_choice";
    this.currentSpeaker = null;
    this.waitingForNext = true;
  }

  // Proceed to next speaker (auto mode)
  private proceedToNextSpeaker(lastSpeaker: "interviewer" | "candidate"): void {
    if (lastSpeaker === "interviewer") {
      // After interviewer, candidate speaks
      this.phase = "candidate";
      this.currentSpeaker = "candidate";
    } else {
      // After candidate, go to user choice (even in auto mode for potential intervention)
      this.phase = "user_choice";
      this.currentSpeaker = null;
      this.waitingForNext = true;
    }
  }

  // Force set speaker (for direct control)
  setSpeaker(speaker: Speaker): void {
    this.currentSpeaker = speaker;
    this.waitingForNext = false;

    switch (speaker) {
      case "interviewer":
        this.phase = "interviewer";
        break;
      case "candidate":
        this.phase = "candidate";
        break;
      case "human":
        this.phase = "user_speaking";
        break;
    }
  }

  // End the interview
  end(): void {
    this.phase = "ended";
    this.currentSpeaker = null;
    this.waitingForNext = false;
  }

  // Check if interview should end based on turn count
  shouldEndByTurnLimit(): boolean {
    return this.turnCount >= INTERVIEW_CONFIG.MAX_TURNS;
  }

  // Check if minimum turns reached
  hasReachedMinTurns(): boolean {
    return this.turnCount >= INTERVIEW_CONFIG.MIN_TURNS;
  }

  // Reset state
  reset(): void {
    this.phase = "waiting";
    this.currentSpeaker = null;
    this.waitingForNext = false;
    this.turnCount = 0;
    this.interviewerTurns = 0;
    this.candidateTurns = 0;
  }
}
