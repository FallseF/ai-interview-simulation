import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/types";
import { createInterviewerConfig } from "@/lib/prompts/interviewer";
import { createCandidateConfig } from "@/lib/prompts/candidate";
import { INTERVIEW_CONFIG } from "@/types";

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { role, messages, humanInput } = body;

    // Get persona config
    const config = role === "interviewer"
      ? createInterviewerConfig()
      : createCandidateConfig();

    // Build messages array for OpenAI
    const apiMessages: ChatMessage[] = [
      { role: "system", content: config.instructions },
      ...messages,
    ];

    // If human input is provided, add it as a system message for stronger instruction
    if (humanInput) {
      apiMessages.push({
        role: "system",
        content: `【重要：転職支援エージェントからの補足情報】
以下は転職支援エージェントからの補足です。この情報を必ず考慮し、次の発言で言及してください。

補足内容：「${humanInput.text}」

※この補足を無視せず、必ず反応してください。`,
      });
    }

    // Debug: log what we're sending
    console.log("=== Chat API Request ===");
    console.log("Role:", role);
    console.log("Human Input:", humanInput);
    console.log("Messages:", JSON.stringify(apiMessages, null, 2));

    // Call OpenAI Chat API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.2-chat-latest",
        messages: apiMessages,
        max_completion_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("OpenAI API error:", error);
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || "";

    // Check for end markers
    const shouldEnd = text.includes(INTERVIEW_CONFIG.END_MARKER);
    const isAborted = text.includes(INTERVIEW_CONFIG.ABORT_MARKER);

    const result: ChatResponse = {
      text: text
        .replace(INTERVIEW_CONFIG.END_MARKER, "")
        .replace(INTERVIEW_CONFIG.ABORT_MARKER, "")
        .trim(),
      shouldEnd: shouldEnd || isAborted,
      endReason: isAborted ? "aborted" : shouldEnd ? "normal" : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
