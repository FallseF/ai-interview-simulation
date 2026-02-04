import { NextResponse } from "next/server";
import type { TTSRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const body: TTSRequest = await request.json();
    const { text, voice } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Map voice names to OpenAI TTS voices
    // OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
    const voiceMap: Record<string, string> = {
      cedar: "onyx",      // 面接官 - 低めの落ち着いた声
      shimmer: "shimmer", // 求職者 - 若めの声
    };
    const ttsVoice = voiceMap[voice] || "alloy";

    // Call OpenAI TTS API
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: ttsVoice,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI TTS API error:", error);
      return NextResponse.json(
        { error: "Failed to generate speech" },
        { status: 500 }
      );
    }

    // Get audio data as ArrayBuffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({ audioBase64: base64Audio });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
