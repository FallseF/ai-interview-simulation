export interface TTSClientOptions {
  baseUrl?: string;
}

/**
 * Client for the TTS API endpoint
 * Used by frontend to convert text to speech
 */
export class TTSClient {
  private baseUrl: string;

  constructor(options: TTSClientOptions = {}) {
    this.baseUrl = options.baseUrl || "";
  }

  /**
   * Convert text to speech
   * Returns base64-encoded MP3 audio
   */
  async synthesize(text: string, voice: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate speech");
    }

    const data = await response.json();
    return data.audioBase64;
  }

  /**
   * Synthesize speech for interviewer
   */
  async synthesizeInterviewer(text: string): Promise<string> {
    return this.synthesize(text, "cedar");
  }

  /**
   * Synthesize speech for candidate
   */
  async synthesizeCandidate(text: string): Promise<string> {
    return this.synthesize(text, "shimmer");
  }
}

// Singleton instance
let ttsClientInstance: TTSClient | null = null;

export function getTTSClient(): TTSClient {
  if (!ttsClientInstance) {
    ttsClientInstance = new TTSClient();
  }
  return ttsClientInstance;
}

/**
 * Audio player utility for MP3 playback
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;

  /**
   * Play base64-encoded MP3 audio
   */
  async play(base64Audio: string): Promise<void> {
    // Create audio context if needed
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    // Resume context if suspended (needed for autoplay policies)
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    // Decode base64 to ArrayBuffer
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBuffer = bytes.buffer;

    // Decode MP3 to AudioBuffer
    const decodedBuffer = await this.audioContext.decodeAudioData(audioBuffer);

    // Play the audio
    return new Promise((resolve) => {
      const source = this.audioContext!.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(this.audioContext!.destination);
      source.onended = () => resolve();
      source.start();
    });
  }

  /**
   * Close the audio context
   */
  close(): void {
    this.audioContext?.close();
    this.audioContext = null;
  }
}

// Singleton player instance
let audioPlayerInstance: AudioPlayer | null = null;

export function getAudioPlayer(): AudioPlayer {
  if (!audioPlayerInstance) {
    audioPlayerInstance = new AudioPlayer();
  }
  return audioPlayerInstance;
}
