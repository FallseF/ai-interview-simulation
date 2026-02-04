"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  InterviewState,
  TranscriptEntry,
  Speaker,
  EndReason,
  EvaluationResult,
  EvaluateResponse,
} from "@/types";
import { saveInterviewRecord, updateRecordEvaluation } from "@/lib/storage";
import { getChatClient } from "@/lib/ai/chat-client";
import { getTTSClient, getAudioPlayer } from "@/lib/ai/tts-client";
import {
  buildInterviewerMessages,
  buildCandidateMessages,
  getSpeakerDisplayName,
  getSpeakerVoice,
} from "@/lib/interview/conversation";

interface UseInterviewReturn {
  isLoading: boolean;
  isEvaluating: boolean;
  state: InterviewState;
  transcripts: TranscriptEntry[];
  evaluation: EvaluationResult | null;
  startSession: () => Promise<void>;
  nextTurn: () => Promise<void>;
  sendText: (text: string) => void;
  reset: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * シンプルな面接フック
 *
 * フロー：
 * 1. 面接官が質問 → 自動で候補者が回答
 * 2. 【止まる】ユーザーが補足入力できる
 * 3. 「次へ」→ 面接官が質問（補足を考慮）→ 自動で候補者が回答
 * 4. 【止まる】...繰り返し
 */
export function useInterview(): UseInterviewReturn {
  const chatClient = useRef(getChatClient());
  const ttsClient = useRef(getTTSClient());
  const audioPlayer = useRef(getAudioPlayer());

  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [state, setState] = useState<InterviewState>({
    phase: "waiting",
    currentSpeaker: null,
    waitingForNext: false,
    mode: "step",
  });

  // 現在の面接記録ID
  const currentRecordIdRef = useRef<string | null>(null);

  // 次の面接官への補足
  const pendingHumanInputRef = useRef<string | null>(null);

  // 面接を評価する
  const evaluateInterview = useCallback(async (
    finalTranscripts: TranscriptEntry[],
    endReason: EndReason
  ) => {
    setIsEvaluating(true);

    // まず記録を保存（評価なし）
    const record = saveInterviewRecord(finalTranscripts, endReason, null);
    currentRecordIdRef.current = record.id;

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalTranscripts, endReason }),
      });

      if (response.ok) {
        const data: EvaluateResponse = await response.json();
        setEvaluation(data.evaluation);
        // 記録を更新
        updateRecordEvaluation(record.id, data.evaluation);
      }
    } catch (error) {
      console.error("Failed to evaluate interview:", error);
    } finally {
      setIsEvaluating(false);
    }
  }, []);

  // transcriptに追加
  const addTranscript = useCallback((speaker: Speaker, text: string) => {
    const entry: TranscriptEntry = {
      id: generateId(),
      speaker,
      name: getSpeakerDisplayName(speaker),
      text,
      timestamp: new Date(),
    };
    setTranscripts((prev) => [...prev, entry]);
    return entry;
  }, []);

  // 現在のtranscriptsを取得（state更新を待つ）
  const getCurrentTranscripts = useCallback((): Promise<TranscriptEntry[]> => {
    return new Promise((resolve) => {
      setTranscripts((prev) => {
        resolve(prev);
        return prev;
      });
    });
  }, []);

  // AIの応答を取得して音声再生
  const getAIResponseAndSpeak = useCallback(
    async (
      speaker: "interviewer" | "candidate",
      currentTranscripts: TranscriptEntry[]
    ): Promise<{ text: string; shouldEnd: boolean; endReason?: EndReason }> => {
      // メッセージ構築
      const messages =
        speaker === "interviewer"
          ? buildInterviewerMessages(currentTranscripts)
          : buildCandidateMessages(currentTranscripts);

      // 面接官の場合のみ、補足を渡す
      const humanInput =
        speaker === "interviewer" && pendingHumanInputRef.current
          ? { target: "interviewer" as const, text: pendingHumanInputRef.current }
          : undefined;

      // 補足をクリア（面接官が使った後）
      if (speaker === "interviewer") {
        pendingHumanInputRef.current = null;
      }

      // AI応答取得
      const response = await chatClient.current.getResponse(
        speaker,
        messages,
        humanInput
      );

      // transcript追加
      addTranscript(speaker, response.text);

      // TTS再生
      const voice = getSpeakerVoice(speaker);
      const audioBase64 = await ttsClient.current.synthesize(response.text, voice);
      await audioPlayer.current.play(audioBase64);

      return response;
    },
    [addTranscript]
  );

  // 面接官→候補者の連続実行
  const runInterviewerThenCandidate = useCallback(
    async (initialTranscripts: TranscriptEntry[]): Promise<boolean> => {
      // === 面接官のターン ===
      setState((prev) => ({
        ...prev,
        phase: "interviewer",
        currentSpeaker: "interviewer",
        waitingForNext: false,
      }));

      const interviewerResponse = await getAIResponseAndSpeak("interviewer", initialTranscripts);

      if (interviewerResponse.shouldEnd) {
        const endReason = interviewerResponse.endReason || "normal";
        setState((prev) => ({
          ...prev,
          phase: "ended",
          currentSpeaker: null,
          endReason,
        }));
        // 評価を実行
        const finalTranscripts = await getCurrentTranscripts();
        evaluateInterview(finalTranscripts, endReason);
        return true; // ended
      }

      // === 候補者のターン（自動で続く）===
      setState((prev) => ({
        ...prev,
        phase: "candidate",
        currentSpeaker: "candidate",
      }));

      const currentTranscripts = await getCurrentTranscripts();
      const candidateResponse = await getAIResponseAndSpeak("candidate", currentTranscripts);

      if (candidateResponse.shouldEnd) {
        const endReason = candidateResponse.endReason || "normal";
        setState((prev) => ({
          ...prev,
          phase: "ended",
          currentSpeaker: null,
          endReason,
        }));
        // 評価を実行
        const finalTranscripts = await getCurrentTranscripts();
        evaluateInterview(finalTranscripts, endReason);
        return true; // ended
      }

      // 待機状態に（ユーザーが補足できる）
      setState((prev) => ({
        ...prev,
        phase: "user_choice",
        currentSpeaker: null,
        waitingForNext: true,
      }));

      return false; // not ended
    },
    [getAIResponseAndSpeak, getCurrentTranscripts, evaluateInterview]
  );

  // 面接開始
  const startSession = useCallback(async () => {
    setIsLoading(true);
    setTranscripts([]);
    pendingHumanInputRef.current = null;

    setState({
      phase: "interviewer",
      currentSpeaker: "interviewer",
      waitingForNext: false,
      mode: "step",
    });

    try {
      await runInterviewerThenCandidate([]);
    } catch (error) {
      console.error("Failed to start session:", error);
      setState({ phase: "waiting", currentSpeaker: null, waitingForNext: false, mode: "step" });
    } finally {
      setIsLoading(false);
    }
  }, [runInterviewerThenCandidate]);

  // 次へ進む
  const nextTurn = useCallback(async () => {
    setIsLoading(true);

    try {
      const currentTranscripts = await getCurrentTranscripts();
      await runInterviewerThenCandidate(currentTranscripts);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      setState((prev) => ({
        ...prev,
        phase: "user_choice",
        currentSpeaker: null,
        waitingForNext: true,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [runInterviewerThenCandidate, getCurrentTranscripts]);

  // 補足を送信（面接官への補足として保存）
  const sendText = useCallback((text: string) => {
    // transcriptに追加
    addTranscript("human", text);
    // 次の面接官への補足として保存
    pendingHumanInputRef.current = text;
  }, [addTranscript]);

  // リセット
  const reset = useCallback(() => {
    setTranscripts([]);
    setEvaluation(null);
    pendingHumanInputRef.current = null;
    currentRecordIdRef.current = null;
    setState({
      phase: "waiting",
      currentSpeaker: null,
      waitingForNext: false,
      mode: "step",
    });
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      audioPlayer.current.close();
    };
  }, []);

  return {
    isLoading,
    isEvaluating,
    state,
    transcripts,
    evaluation,
    startSession,
    nextTurn,
    sendText,
    reset,
  };
}
