'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface UseGeminiLiveOptions {
  apiKey: string;
  onTranscript?: (text: string, isUser: boolean) => void;
  onStateChange?: (state: VoiceState) => void;
}

export function useGeminiLive({ apiKey, onTranscript, onStateChange }: UseGeminiLiveOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null); // mic capture context
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const scheduledUntilRef = useRef(0);
  const lastSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sessionActiveRef = useRef(false);
  const modelTurnBufferRef = useRef<string>('');
  const isAgentSpeakingRef = useRef(false);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const [activeTranscript, setActiveTranscript] = useState('');
  
  // Background recorder for final analysis
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const updateState = useCallback((state: VoiceState) => {
    setVoiceState(state);
    onStateChange?.(state);
  }, [onStateChange]);

  function pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
    const int16 = new Int16Array(buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }
    return float32;
  }

  function float32ToPcm16(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const int16 = new Int16Array(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buffer;
  }

  const enqueueAudioChunk = useCallback((audioData: ArrayBuffer) => {
    const ctx = playbackContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    isAgentSpeakingRef.current = true;

    const float32 = pcm16ToFloat32(audioData);
    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now + 0.03, scheduledUntilRef.current);
    source.start(startAt);
    scheduledUntilRef.current = startAt + audioBuffer.duration;

    lastSourceRef.current = source;
    source.onended = () => {
      if (lastSourceRef.current === source) {
        lastSourceRef.current = null;
        isAgentSpeakingRef.current = false;
        updateState('listening');
      }
    };

    updateState('speaking');
  }, [updateState]);

  const sendAudioChunk = useCallback((pcm16Data: ArrayBuffer) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (isAgentSpeakingRef.current) return;

    const base64 = btoa(String.fromCharCode(...Array.from(new Uint8Array(pcm16Data))));
    wsRef.current.send(JSON.stringify({
      realtimeInput: {
        mediaChunks: [{
          mimeType: 'audio/pcm;rate=16000',
          data: base64
        }]
      }
    }));
  }, []);

  const connect = useCallback(async (systemPrompt: string) => {
    if (!apiKey) return;

    try {
      updateState('connecting');

      playbackContextRef.current = new AudioContext({ sampleRate: 24000 });

      const model = 'models/gemini-2.5-flash-native-audio-latest';
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        ws.send(JSON.stringify({
          setup: {
            model,
            generation_config: {
              response_modalities: ['AUDIO'],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: { voice_name: 'Aoede' }
                }
              }
            },
            input_audio_transcription: {},
            output_audio_transcription: {},
            system_instruction: {
              parts: [{ text: systemPrompt }]
            }
          }
        }));
      };

      ws.onmessage = async (event) => {
        const text = event.data instanceof Blob ? await event.data.text() : event.data;
        
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(text);
        } catch {
          return;
        }

        if (data.setupComplete || data.setup_complete) {
          setIsConnected(true);
          sessionActiveRef.current = true;
          updateState('listening');
          await startMicrophone();
          
          // Send initial trigger so the AI tutor starts the conversation automatically
          wsRef.current?.send(JSON.stringify({
            clientContent: {
              turns: [{ role: 'user', parts: [{ text: 'Hello! I am ready to start.' }] }],
              turnComplete: true,
            }
          }));
          return;
        }

        const serverContent = (data.serverContent || data.server_content) as Record<string, unknown> | undefined;
        if (serverContent) {
          const interrupted = serverContent.interrupted as boolean | undefined;
          if (interrupted) {
            if (!isAgentSpeakingRef.current) {
              if (lastSourceRef.current) {
                try { lastSourceRef.current.stop(); } catch { /* already stopped */ }
                lastSourceRef.current = null;
              }
              scheduledUntilRef.current = 0;
              updateState('listening');
            }
            return;
          }

          const modelTurn = (serverContent.modelTurn || serverContent.model_turn) as Record<string, unknown> | undefined;
          if (modelTurn) {
            isAgentSpeakingRef.current = true;
            updateState('thinking');
            const parts = modelTurn.parts as Array<Record<string, unknown>> | undefined;
            if (parts) {
              for (const part of parts) {
                console.log('Gemini Live part:', part);
                const inlineData = (part.inlineData || part.inline_data) as Record<string, unknown> | undefined;
                if (inlineData) {
                  if ((inlineData.mimeType as string)?.includes('audio/pcm')) {
                    const audioBytes = Uint8Array.from(atob(inlineData.data as string), c => c.charCodeAt(0));
                    enqueueAudioChunk(audioBytes.buffer);
                  }
                }
              }
            }
          }

          const outputTranscription = (serverContent.outputTranscription || serverContent.output_audio_transcription || serverContent.output_transcription) as Record<string, unknown> | undefined;
          if (outputTranscription?.text) {
            modelTurnBufferRef.current += (outputTranscription.text as string);
            setActiveTranscript(modelTurnBufferRef.current);
          }

          const turnComplete = (serverContent.turnComplete || serverContent.turn_complete) as boolean | undefined;
          if (turnComplete) {
            if (modelTurnBufferRef.current.trim()) {
              onTranscript?.(modelTurnBufferRef.current.trim(), false);
              modelTurnBufferRef.current = '';
              setActiveTranscript('');
            }
            
            // Fallback: if turn is complete but no audio was scheduled, or audio finished instantly
            const now = playbackContextRef.current?.currentTime || 0;
            if (scheduledUntilRef.current <= now + 0.1) {
              isAgentSpeakingRef.current = false;
              updateState('listening');
            }
          }
        }

        const inputTranscription = (data.inputTranscription || data.input_audio_transcription || data.input_transcription) as Record<string, unknown> | undefined;
        const inputTranscriptionText = (inputTranscription && ((inputTranscription as any).transcript || (inputTranscription as any).text)) as string | undefined;
        if (inputTranscriptionText) {
          if (!isAgentSpeakingRef.current) {
            onTranscript?.(inputTranscriptionText, true);
          }
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        updateState('error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        sessionActiveRef.current = false;
        isAgentSpeakingRef.current = false;
        if (voiceState !== 'idle') {
          updateState('idle');
        }
      };

    } catch {
      updateState('error');
    }
  }, [apiKey, updateState, enqueueAudioChunk, onTranscript, voiceState]);

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
      });
      mediaStreamRef.current = stream;
      
      // Start background recorder for the full session analysis
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      recorder.start(100);

      const ac = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ac;
      
      const workletCode = `
        class PCMProcessor extends AudioWorkletProcessor {
          process(inputs) {
            const input = inputs[0];
            if (input && input[0]) {
              this.port.postMessage(input[0]);
            }
            return true;
          }
        }
        registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      
      await ac.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      const source = ac.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ac, 'pcm-processor');
      
      workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const pcm16 = float32ToPcm16(e.data);
          sendAudioChunk(pcm16);
        }
      };
      
      source.connect(workletNode);
      workletNodeRef.current = workletNode;
    } catch (err) {
      console.error('Microphone access denied:', err);
      updateState('error');
    }
  };

  const getRecordedAudioBlob = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        if (audioChunksRef.current.length === 0) resolve(null);
        else resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
        return;
      }
      
      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length === 0) resolve(null);
        else resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      };
      
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }));
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    scheduledUntilRef.current = 0;
    lastSourceRef.current = null;
    sessionActiveRef.current = false;
    isAgentSpeakingRef.current = false;
    setIsConnected(false);
    setActiveTranscript('');
    updateState('idle');
  }, [updateState]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return { voiceState, isConnected, activeTranscript, connect, disconnect, getRecordedAudioBlob };
}
