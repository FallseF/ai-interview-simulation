"use client";

import type { InterviewRecord, TranscriptEntry, EndReason, EvaluationResult } from "@/types";

const STORAGE_KEY = "interview_records";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 全ての面接記録を取得
 */
export function getInterviewRecords(): InterviewRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    console.error("Failed to parse interview records");
    return [];
  }
}

/**
 * 新しい面接記録を保存
 */
export function saveInterviewRecord(
  transcript: TranscriptEntry[],
  endReason: EndReason,
  evaluation: EvaluationResult | null = null
): InterviewRecord {
  const record: InterviewRecord = {
    id: generateId(),
    createdAt: new Date().toISOString(),
    transcript,
    endReason,
    evaluation,
  };

  const records = getInterviewRecords();
  records.unshift(record); // 新しいものを先頭に

  // 最大100件まで保存
  const trimmed = records.slice(0, 100);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

  return record;
}

/**
 * 面接記録の評価を更新
 */
export function updateRecordEvaluation(
  recordId: string,
  evaluation: EvaluationResult
): void {
  const records = getInterviewRecords();
  const index = records.findIndex((r) => r.id === recordId);

  if (index !== -1) {
    records[index].evaluation = evaluation;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

/**
 * 特定の面接記録を取得
 */
export function getInterviewRecord(recordId: string): InterviewRecord | null {
  const records = getInterviewRecords();
  return records.find((r) => r.id === recordId) || null;
}

/**
 * 全ての面接記録を削除
 */
export function clearInterviewRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}
