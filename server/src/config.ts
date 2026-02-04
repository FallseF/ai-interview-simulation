import dotenv from "dotenv";

dotenv.config();

// Environment variables
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const PORT = parseInt(process.env.PORT || "3000", 10);
export const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview";

// テストモード設定
// MOCK_MODE=true で本物のOpenAI APIに繋がずにテストできる
export const MOCK_MODE = process.env.MOCK_MODE === "true";

// Validate required environment variables
export function validateEnv(): void {
  // モックモードの場合はAPIキー不要
  if (MOCK_MODE) {
    console.log("🧪 Mock mode enabled - OpenAI API will not be used");
    return;
  }

  if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables");
    console.error("Please create a .env file with OPENAI_API_KEY=your_api_key");
    console.error("Or set MOCK_MODE=true for testing without API");
    process.exit(1);
  }
}

// Interview configuration
export const INTERVIEW_CONFIG = {
  // Minimum turns before interview can end naturally
  MIN_TURNS: 5,
  // Maximum turns before forcing end
  MAX_TURNS: 15,
  // End markers in AI transcripts
  END_MARKER: "【面接終了】",
  ABORT_MARKER: "【面接中止】",
};
