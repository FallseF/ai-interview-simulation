import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";

const startSessionMock = vi.fn();
const connectMock = vi.fn();
const disconnectMock = vi.fn();

vi.mock("./hooks/useWebSocket", () => {
  return {
    useWebSocket: () => ({
      isConnected: true,
      isLoading: false,
      state: {
        phase: "waiting",
        currentSpeaker: null,
        waitingForNext: false,
        mode: "step",
      },
      transcripts: [],
      connect: connectMock,
      disconnect: disconnectMock,
      startSession: startSessionMock,
      setMode: vi.fn(),
      nextTurn: vi.fn(),
      sendText: vi.fn(),
      sendAudioChunk: vi.fn(),
      commitAudio: vi.fn(),
      proceedToNext: vi.fn(),
      userWillSpeak: vi.fn(),
      audioQueue: [],
      shiftAudioQueue: vi.fn(),
      audioDone: false,
      resetAudioDone: vi.fn(),
      notifyAudioPlaybackDone: vi.fn(),
      evaluationResult: null,
      clearEvaluationResult: vi.fn(),
    }),
  };
});

vi.mock("./hooks/useAudioRecorder", () => {
  return {
    useAudioPlayer: () => ({
      playAudio: vi.fn(),
    }),
  };
});

describe("App persona integration", () => {
  beforeEach(() => {
    startSessionMock.mockClear();
  });

  it("sends persona config with start_session", () => {
    render(<App />);

    fireEvent.click(screen.getByText("厳格な製造業"));
    fireEvent.click(screen.getByRole("button", { name: "設定を保存" }));

    const patternSection = screen.getByText("面接パターンを選択").closest(".pattern-selector");
    if (!patternSection) {
      throw new Error("Pattern selector not found");
    }
    const startButton = within(patternSection as HTMLElement).getByRole("button", { name: "面接を開始" });
    fireEvent.click(startButton);

    expect(startSessionMock).toHaveBeenCalledTimes(1);
    expect(startSessionMock).toHaveBeenCalledWith(
      "auto",
      "pattern2",
      "N4",
      {
        interviewer: {
          gender: "male",
          industry: "manufacturing",
          personality: "detailed",
          foreignHiringLiteracy: "high",
          dialect: "standard",
          difficulty: "hard",
        },
        candidate: {
          japaneseLevel: "N3",
          workExperience: true,
        },
      }
    );
  });
});
