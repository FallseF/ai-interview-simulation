import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: (onAudioChunk: (base64: string) => void) => Promise<void>;
  stopRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const onAudioChunkRef = useRef<((base64: string) => void) | null>(null);

  const startRecording = useCallback(
    async (onAudioChunk: (base64: string) => void) => {
      try {
        onAudioChunkRef.current = onAudioChunk;

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        mediaStreamRef.current = stream;

        // Create audio context
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        // Create source from stream
        const source = audioContext.createMediaStreamSource(stream);

        // Create script processor for audio processing
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (!onAudioChunkRef.current) return;

          const inputData = event.inputBuffer.getChannelData(0);

          // Check if audio has content
          let maxVal = 0;
          for (let i = 0; i < inputData.length; i++) {
            const absVal = Math.abs(inputData[i]);
            if (absVal > maxVal) maxVal = absVal;
          }

          if (maxVal < 0.0001) return;

          // Resample to 24kHz if needed
          const resampledData = resampleTo24k(inputData, audioContext.sampleRate);

          // Convert to PCM16
          const pcm16 = float32ToPcm16(resampledData);

          // Convert to base64
          const base64 = arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

          onAudioChunkRef.current(base64);
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        setIsRecording(true);
        console.log("[AudioRecorder] Started recording");
      } catch (error) {
        console.error("[AudioRecorder] Failed to start:", error);
        throw error;
      }
    },
    []
  );

  const stopRecording = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    onAudioChunkRef.current = null;
    setIsRecording(false);
    console.log("[AudioRecorder] Stopped recording");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
}

// Audio playback hook
interface UseAudioPlayerReturn {
  isPlaying: boolean;
  playAudio: (base64: string) => Promise<void>;
  stop: () => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const playAudio = useCallback(async (base64: string) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    // Decode base64 to PCM
    const pcmBuffer = base64ToArrayBuffer(base64);
    const floatData = pcm16ToFloat32(pcmBuffer);

    // Create audio buffer
    const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);

    // Create and play source
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    currentSourceRef.current = source;
    setIsPlaying(true);

    return new Promise<void>((resolve) => {
      source.onended = () => {
        setIsPlaying(false);
        currentSourceRef.current = null;
        resolve();
      };
      source.start();
    });
  }, []);

  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      audioContextRef.current?.close();
    };
  }, [stop]);

  return {
    isPlaying,
    playAudio,
    stop,
  };
}

// Utility functions
function resampleTo24k(inputData: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 24000) {
    return inputData;
  }

  const ratio = inputSampleRate / 24000;
  const outputLength = Math.floor(inputData.length / ratio);
  const outputData = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const inputIndex = Math.floor(i * ratio);
    outputData[i] = inputData[inputIndex];
  }

  return outputData;
}

function float32ToPcm16(float32Array: Float32Array): Int16Array {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm16;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function pcm16ToFloat32(pcm16Buffer: ArrayBuffer): Float32Array {
  const int16Array = new Int16Array(pcm16Buffer);
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768;
  }
  return float32Array;
}
