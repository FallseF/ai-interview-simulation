import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CoachPanel, ParticipantsBar } from "./CoachPanel";
import type { InterviewState } from "../types/ws";

describe("CoachPanel", () => {
  it("should not render in waiting phase", () => {
    const state: InterviewState = {
      phase: "waiting",
      currentSpeaker: null,
      waitingForNext: false,
      mode: "step",
    };

    const { container } = render(<CoachPanel state={state} />);
    expect(container.firstChild).toBeNull();
  });

  it("should not render in ended phase", () => {
    const state: InterviewState = {
      phase: "ended",
      currentSpeaker: null,
      waitingForNext: false,
      mode: "step",
      endReason: "normal",
    };

    const { container } = render(<CoachPanel state={state} />);
    expect(container.firstChild).toBeNull();
  });

  it("should show interviewer speaking text", () => {
    const state: InterviewState = {
      phase: "interviewer",
      currentSpeaker: "interviewer",
      waitingForNext: false,
      mode: "step",
    };

    render(<CoachPanel state={state} />);
    expect(screen.getByText("面接官が話しています...")).toBeInTheDocument();
  });

  it("should show candidate speaking text", () => {
    const state: InterviewState = {
      phase: "candidate",
      currentSpeaker: "candidate",
      waitingForNext: false,
      mode: "step",
    };

    render(<CoachPanel state={state} />);
    expect(screen.getByText("求職者が答えています...")).toBeInTheDocument();
  });

  it("should show user choice text", () => {
    const state: InterviewState = {
      phase: "user_choice",
      currentSpeaker: null,
      waitingForNext: true,
      mode: "step",
    };

    render(<CoachPanel state={state} />);
    expect(screen.getByText("補足しますか？")).toBeInTheDocument();
  });

  it("should show user speaking text", () => {
    const state: InterviewState = {
      phase: "user_speaking",
      currentSpeaker: "human",
      waitingForNext: false,
      mode: "step",
    };

    render(<CoachPanel state={state} />);
    expect(screen.getByText("あなたのターンです")).toBeInTheDocument();
  });
});

describe("ParticipantsBar", () => {
  it("should render all three participants", () => {
    render(<ParticipantsBar currentSpeaker={null} />);

    expect(screen.getByText("面接官")).toBeInTheDocument();
    expect(screen.getByText("田中部長")).toBeInTheDocument();
    expect(screen.getByText("あなた")).toBeInTheDocument();
    expect(screen.getByText("転職支援")).toBeInTheDocument();
    expect(screen.getByText("グエン・ミン")).toBeInTheDocument();
    expect(screen.getByText("求職者")).toBeInTheDocument();
  });

  it("should highlight interviewer when speaking", () => {
    const { container } = render(<ParticipantsBar currentSpeaker="interviewer" />);
    const interviewerChip = container.querySelector(".participant-chip.interviewer");
    expect(interviewerChip).toHaveClass("speaking");
  });

  it("should highlight candidate when speaking", () => {
    const { container } = render(<ParticipantsBar currentSpeaker="candidate" />);
    const candidateChip = container.querySelector(".participant-chip.candidate");
    expect(candidateChip).toHaveClass("speaking");
  });

  it("should highlight human when speaking", () => {
    const { container } = render(<ParticipantsBar currentSpeaker="human" />);
    const humanChip = container.querySelector(".participant-chip.human");
    expect(humanChip).toHaveClass("speaking");
  });
});
