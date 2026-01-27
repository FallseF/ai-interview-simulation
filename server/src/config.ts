import dotenv from "dotenv";

dotenv.config();

// Environment variables
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const PORT = parseInt(process.env.PORT || "3000", 10);
export const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-realtime";

// Validate required environment variables
export function validateEnv(): void {
  if (!OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY is not set in environment variables");
    console.error("Please create a .env file with OPENAI_API_KEY=your_api_key");
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
