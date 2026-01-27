import type { AIPersonaConfig } from "../types/roles.js";
import { createInterviewerConfig } from "../prompts/interviewer.js";
import { createCandidateConfig } from "../prompts/candidate.js";
import type { Scenario } from "../prompts/scenario.js";

// Session configuration for OpenAI Realtime API
export interface SessionConfig {
  interviewer: AIPersonaConfig;
  candidate: AIPersonaConfig;
}

// Create session configurations for both AI participants
export function createSessionConfigs(scenario?: Scenario): SessionConfig {
  return {
    interviewer: createInterviewerConfig(scenario),
    candidate: createCandidateConfig(scenario),
  };
}

// Get session config by role
export function getSessionConfig(
  configs: SessionConfig,
  role: "interviewer" | "candidate"
): AIPersonaConfig {
  return configs[role];
}
