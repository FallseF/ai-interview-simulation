import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TranscriptPanel } from "./TranscriptPanel";
import type { TranscriptEntry } from "../types/ws";

describe("TranscriptPanel", () => {
  it("should show empty state when no transcripts", () => {
    render(<TranscriptPanel transcripts={[]} currentSpeaker={null} />);

    expect(screen.getByText(/「面接を開始」ボタンを押すと/)).toBeInTheDocument();
  });

  it("should render transcript entries", () => {
    const transcripts: TranscriptEntry[] = [
      {
        id: "1",
        speaker: "interviewer",
        name: "田中部長",
        text: "自己紹介をお願いします",
        timestamp: new Date(),
      },
      {
        id: "2",
        speaker: "candidate",
        name: "グエン・ミン",
        text: "私、ベトナムから来ました",
        timestamp: new Date(),
      },
    ];

    render(<TranscriptPanel transcripts={transcripts} currentSpeaker={null} />);

    expect(screen.getByText("田中部長")).toBeInTheDocument();
    expect(screen.getByText("自己紹介をお願いします")).toBeInTheDocument();
    expect(screen.getByText("グエン・ミン")).toBeInTheDocument();
    expect(screen.getByText("私、ベトナムから来ました")).toBeInTheDocument();
  });

  it("should render human messages correctly", () => {
    const transcripts: TranscriptEntry[] = [
      {
        id: "1",
        speaker: "human",
        name: "転職支援",
        text: "補足説明です",
        timestamp: new Date(),
      },
    ];

    render(<TranscriptPanel transcripts={transcripts} currentSpeaker={null} />);

    expect(screen.getByText("転職支援")).toBeInTheDocument();
    expect(screen.getByText("補足説明です")).toBeInTheDocument();
  });

  it("should render system messages", () => {
    const transcripts: TranscriptEntry[] = [
      {
        id: "1",
        speaker: "human",
        name: "システム",
        text: "面接を開始します",
        timestamp: new Date(),
      },
    ];

    render(<TranscriptPanel transcripts={transcripts} currentSpeaker={null} />);

    expect(screen.getByText("面接を開始します")).toBeInTheDocument();
  });

  it("should apply correct CSS classes to messages", () => {
    const transcripts: TranscriptEntry[] = [
      {
        id: "1",
        speaker: "interviewer",
        name: "田中部長",
        text: "質問",
        timestamp: new Date(),
      },
      {
        id: "2",
        speaker: "candidate",
        name: "グエン・ミン",
        text: "回答",
        timestamp: new Date(),
      },
      {
        id: "3",
        speaker: "human",
        name: "転職支援",
        text: "補足",
        timestamp: new Date(),
      },
    ];

    const { container } = render(
      <TranscriptPanel transcripts={transcripts} currentSpeaker={null} />
    );

    expect(container.querySelector(".message.interviewer")).toBeInTheDocument();
    expect(container.querySelector(".message.candidate")).toBeInTheDocument();
    expect(container.querySelector(".message.human")).toBeInTheDocument();
  });
});
