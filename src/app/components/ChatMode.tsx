'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Volume2, RotateCcw, Loader2, Send } from 'lucide-react';
import ResultsPanel from './ResultsPanel';
import { AnalysisResult, ConversationTurn } from '@/types';
import VoiceOrb from './VoiceOrb';
import { useGeminiLive } from '@/lib/useGeminiLive';

type ChatPhase = 'idle' | 'session' | 'processing' | 'results';

const TOPICS = [
  { label: '🌳 My Favourite Place', prompt: 'Talk about places you love and why' },
  { label: '🐶 Pets & Animals', prompt: 'Chat about animals and pets' },
  { label: '🎮 Hobbies & Games', prompt: 'Discuss favourite games and activities' },
  { label: '📚 School & Friends', prompt: 'Talk about school life and friends' },
  { label: '🍕 Food & Cooking', prompt: 'Share thoughts on food and eating' },
  { label: '🚀 Future Dreams', prompt: 'Talk about future goals and dreams' },
];

export default function ChatMode() {
  const [phase, setPhase] = useState<ChatPhase>('idle');
  const [selectedTopic, setSelectedTopic] = useState<typeof TOPICS[0] | null>(null);
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [statusText, setStatusText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  const handleTranscript = useCallback((text: string, isUser: boolean) => {
    setTurns(prev => [...prev, { role: isUser ? 'user' : 'ai', text, timestamp: Date.now() }]);
  }, []);

  const { voiceState, isConnected, connect, disconnect, getRecordedAudioBlob } = useGeminiLive({
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    onTranscript: handleTranscript,
  });

  const handleStartSession = useCallback(async (topic: typeof TOPICS[0]) => {
    setSelectedTopic(topic);
    setPhase('session');
    // Pre-populate the transcript with a greeting so the AI's response makes sense in the UI
    setTurns([{ role: 'user', text: 'Hello!', timestamp: Date.now() }]);
    
    const systemPrompt = `You are a friendly, encouraging English tutor for children aged 9-14. 
Your conversation topic is: "${topic.prompt}".
Rules:
- Ask ONE clear, open-ended question at a time. Wait for the child to respond.
- Keep questions simple, fun, and age-appropriate
- After the child responds, give brief encouragement (1 sentence) then ask the next question
- Be warm, patient, and enthusiastic
- Use simple English vocabulary
- Have a natural conversation (not too formal)
- Start by warmly greeting the child and asking your first question about ${topic.label}
- Keep your responses relatively short.`;

    await connect(systemPrompt);
  }, [connect]);

  const analyzeConversation = async () => {
    setPhase('processing');
    setStatusText('Analysing your English skills...');

    const audioBlob = await getRecordedAudioBlob();
    if (!audioBlob) {
      alert("No audio was recorded to analyze!");
      setPhase('idle');
      return;
    }

    disconnect(); // Ensure session is closed

    try {
      const conversationText = turns.map((t) => `${t.role === 'ai' ? 'Tutor' : 'Student'}: ${t.text}`).join('\n');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'conversation.webm');
      formData.append('transcript', conversationText);
      formData.append('context', `English conversation about ${selectedTopic?.label}`);

      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');
      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      setPhase('results');
    } catch (err) {
      console.error(err);
      setStatusText('Analysis failed. Please try again.');
      setPhase('idle');
    }
  };

  const handleReset = () => {
    disconnect();
    setPhase('idle');
    setTurns([]);
    setAnalysisResult(null);
    setSelectedTopic(null);
  };

  // ── IDLE: Topic selection ──────────────────────────────────────────────────
  if (phase === 'idle' && !selectedTopic) {
    return (
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 8 }}>
            Choose a Topic 📝
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>
            Pick what you&apos;d like to talk about with your AI tutor
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {TOPICS.map((topic) => (
            <button
              key={topic.label}
              onClick={() => handleStartSession(topic)}
              className="glass-card"
              style={{
                padding: '20px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s',
                background: 'rgba(17,24,39,0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,107,107,0.4)';
                e.currentTarget.style.background = 'rgba(255,107,107,0.05)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(17,24,39,0.6)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{topic.label.split(' ')[0]}</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'white', marginBottom: 4 }}>
                {topic.label.slice(topic.label.indexOf(' ') + 1)}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{topic.prompt}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (phase === 'results' && analysisResult) {
    return <ResultsPanel result={analysisResult} onRetry={handleReset} />;
  }

  // ── CONVERSATION UI ────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div
        className="glass-card"
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: phase === 'processing' ? '#A78BFA' : '#4ECDC4',
              boxShadow: `0 0 8px currentColor`,
              animation: 'pulse-ring 1.5s ease-out infinite',
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            {selectedTopic?.label}
          </span>
        </div>
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '6px 10px',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
            fontFamily: 'Nunito',
          }}
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        
        {/* Left Panel: VoiceOrb */}
        <div className="glass-card flex flex-col items-center justify-center p-8 md:w-[300px] shrink-0" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
           {phase === 'session' ? (
             <VoiceOrb 
                voiceState={voiceState} 
                isConnected={isConnected} 
                isReady={true} 
                onToggle={() => {
                  if (isConnected) disconnect();
                  else handleStartSession(selectedTopic!);
                }} 
             />
           ) : phase === 'processing' ? (
             <div className="flex flex-col items-center text-purple-400 gap-4">
                <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
                <div className="font-bold">Analysing your English...</div>
             </div>
           ) : null}
        </div>

        {/* Right Panel: Chat feed */}
        <div
          className="glass-card flex-1 flex flex-col gap-3 p-4 h-[400px] overflow-y-auto"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {turns.length === 0 && phase === 'session' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: 'rgba(255,255,255,0.3)' }}>
              <span>Connecting to your AI tutor...</span>
            </div>
          )}

          {turns.map((turn, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: turn.role === 'ai' ? 'flex-start' : 'flex-end',
                animation: 'fadeInUp 0.3s ease',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '12px 16px',
                  borderRadius: turn.role === 'ai' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                  background:
                    turn.role === 'ai'
                      ? 'rgba(78, 205, 196, 0.1)'
                      : 'rgba(255, 107, 107, 0.1)',
                  border: `1px solid ${turn.role === 'ai' ? 'rgba(78,205,196,0.2)' : 'rgba(255,107,107,0.2)'}`,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {turn.role === 'ai' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Volume2 size={12} color="#4ECDC4" />
                    <span style={{ fontSize: 11, color: '#4ECDC4', fontWeight: 700 }}>AI TUTOR</span>
                  </div>
                )}
                {turn.role === 'user' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, justifyContent: 'flex-end' }}>
                    <Mic size={12} color="#FF6B6B" />
                    <span style={{ fontSize: 11, color: '#FF6B6B', fontWeight: 700 }}>YOU</span>
                  </div>
                )}
                {turn.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {voiceState === 'thinking' && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '12px 20px',
                  borderRadius: '4px 16px 16px 16px',
                  background: 'rgba(78,205,196,0.1)',
                  border: '1px solid rgba(78,205,196,0.2)',
                  display: 'flex',
                  gap: 6,
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`typing-dot`}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#4ECDC4',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* End Session & Analyse Button */}
      {phase === 'session' && turns.length > 2 && (
        <button
          onClick={analyzeConversation}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #4ECDC4, #2DD4BF)',
            border: 'none',
            color: 'white',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 4px 20px rgba(78,205,196,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Send size={20} />
          End Session & Get Results
        </button>
      )}
      
      {statusText && phase === 'processing' && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
          {statusText}
        </p>
      )}

    </div>
  );
}
