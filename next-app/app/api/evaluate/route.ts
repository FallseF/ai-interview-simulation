import { NextResponse } from "next/server";
import type { EvaluateRequest, EvaluateResponse, EvaluationResult, TranscriptEntry } from "@/types";

function formatTranscript(transcript: TranscriptEntry[]): string {
  return transcript
    .map((entry) => `[${entry.name}]: ${entry.text}`)
    .join("\n\n");
}

const EVALUATION_PROMPT = `あなたは面接シミュレーションの評価者です。
以下は「転職支援エージェント」が外国人求職者の面接をサポートした記録です。

転職支援エージェントの役割：
- 日本語が苦手な求職者（グエン・ミン）の面接をサポートする
- 面接官（田中部長）に対して、求職者の意図を補足・説明する
- 適切なタイミングで介入し、面接がスムーズに進むよう助ける

以下の観点で評価してください（各1-5点）：

1. **communication（コミュニケーション対応力）**
   - 補足のタイミングは適切だったか
   - 伝え方は明確だったか
   - 面接官と求職者の橋渡しができていたか

2. **manner（マナー・態度）**
   - 面接の場にふさわしい言葉遣いだったか
   - 面接官への敬意を示せていたか
   - 不適切な発言はなかったか

3. **support（サポート力）**
   - 求職者を効果的に助けられたか
   - 求職者の強みを引き出せたか
   - 求職者が困っている時に適切に介入したか

4. **judgment（状況判断）**
   - 介入すべきタイミングを見極められたか
   - 不要な介入で面接を妨げていなかったか
   - 面接の流れを読めていたか

回答は必ず以下のJSON形式で返してください：
{
  "criteria": {
    "communication": <1-5>,
    "manner": <1-5>,
    "support": <1-5>,
    "judgment": <1-5>
  },
  "totalScore": <0-100の総合点>,
  "feedback": "<全体的なフィードバック（2-3文）>",
  "strengths": ["<良かった点1>", "<良かった点2>"],
  "improvements": ["<改善点1>", "<改善点2>"]
}

JSONのみを返してください。説明文は不要です。`;

export async function POST(request: Request) {
  try {
    const body: EvaluateRequest = await request.json();
    const { transcript, endReason } = body;

    // トランスクリプトをテキスト化
    const transcriptText = formatTranscript(transcript);

    // 面接中止の場合は追加情報
    const endInfo = endReason === "aborted"
      ? "\n\n【注意】この面接は中止になりました。評価にはこの点も考慮してください。"
      : "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [
          { role: "system", content: EVALUATION_PROMPT },
          { role: "user", content: `以下の面接記録を評価してください：\n\n${transcriptText}${endInfo}` },
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to evaluate interview" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    // JSONをパース
    let evaluation: EvaluationResult;
    try {
      // コードブロックがある場合は除去
      const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
      evaluation = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse evaluation JSON:", content);
      // パース失敗時のデフォルト
      evaluation = {
        criteria: {
          communication: 3,
          manner: 3,
          support: 3,
          judgment: 3,
        },
        totalScore: 60,
        feedback: "評価を完了できませんでした。",
        strengths: [],
        improvements: [],
      };
    }

    const result: EvaluateResponse = { evaluation };
    return NextResponse.json(result);
  } catch (error) {
    console.error("Evaluate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
