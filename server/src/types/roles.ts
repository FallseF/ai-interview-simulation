// Participant roles in the interview
export type Role = "interviewer" | "candidate" | "human";

// Speaker types (for audio/transcript events)
export type Speaker = "interviewer" | "candidate" | "human";

// Target for human input
export type Target = "interviewer" | "candidate" | "both";

// Interview mode
export type InterviewMode = "step" | "auto";

// Interview phase
export type Phase =
  | "waiting"           // Initial state, waiting to start
  | "interviewer"       // AI interviewer is speaking
  | "candidate"         // AI candidate is speaking
  | "user_choice"       // Waiting for human to choose action (step mode)
  | "user_speaking"     // Human is speaking
  | "ended";            // Interview ended

// Interview end reason
export type EndReason = "normal" | "aborted" | null;

// AI persona configuration
export interface AIPersonaConfig {
  role: "interviewer" | "candidate";
  name: string;
  voice: string;
  instructions: string;
}
