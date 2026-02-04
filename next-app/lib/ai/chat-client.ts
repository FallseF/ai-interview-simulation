import type { ChatMessage, ChatResponse, Target } from "@/types";

export interface ChatClientOptions {
  baseUrl?: string;
}

/**
 * Client for the Chat API endpoint
 * Used by frontend to get AI responses
 */
export class ChatClient {
  private baseUrl: string;

  constructor(options: ChatClientOptions = {}) {
    this.baseUrl = options.baseUrl || "";
  }

  /**
   * Get a response from the specified AI role
   */
  async getResponse(
    role: "interviewer" | "candidate",
    messages: ChatMessage[],
    humanInput?: { target: Target; text: string }
  ): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role,
        messages,
        humanInput,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get AI response");
    }

    return response.json();
  }

  /**
   * Get interviewer response
   */
  async getInterviewerResponse(
    messages: ChatMessage[],
    humanInput?: { target: Target; text: string }
  ): Promise<ChatResponse> {
    return this.getResponse("interviewer", messages, humanInput);
  }

  /**
   * Get candidate response
   */
  async getCandidateResponse(
    messages: ChatMessage[],
    humanInput?: { target: Target; text: string }
  ): Promise<ChatResponse> {
    return this.getResponse("candidate", messages, humanInput);
  }
}

// Singleton instance
let chatClientInstance: ChatClient | null = null;

export function getChatClient(): ChatClient {
  if (!chatClientInstance) {
    chatClientInstance = new ChatClient();
  }
  return chatClientInstance;
}
