'use client';

import { VoiceState } from '@/lib/useGeminiLive';

interface VoiceOrbProps {
  voiceState: VoiceState;
  isConnected: boolean;
  isReady: boolean;
  onToggle: () => void;
}

const stateConfig = {
  idle: {
    label: 'Tap to Start',
    sublabel: 'Voice Session',
    color: 'rgba(78, 205, 196, 0.15)', // Changed to match SpeakStar's mint green
    borderColor: 'rgba(78, 205, 196, 0.3)',
    glowColor: 'rgba(78, 205, 196, 0.2)',
    iconColor: '#4ECDC4',
  },
  connecting: {
    label: 'Connecting...',
    sublabel: 'Setting up session',
    color: 'rgba(167, 139, 250, 0.15)', // Purple
    borderColor: 'rgba(167, 139, 250, 0.4)',
    glowColor: 'rgba(167, 139, 250, 0.25)',
    iconColor: '#A78BFA',
  },
  listening: {
    label: 'Listening',
    sublabel: 'Speak now...',
    color: 'rgba(255, 107, 107, 0.15)', // Coral pink
    borderColor: 'rgba(255, 107, 107, 0.4)',
    glowColor: 'rgba(255, 107, 107, 0.25)',
    iconColor: '#FF6B6B',
  },
  thinking: {
    label: 'Thinking',
    sublabel: 'AI is thinking...',
    color: 'rgba(255, 230, 109, 0.12)', // Gold
    borderColor: 'rgba(255, 230, 109, 0.35)',
    glowColor: 'rgba(255, 230, 109, 0.2)',
    iconColor: '#FFE66D',
  },
  speaking: {
    label: 'AI Speaking',
    sublabel: 'Tutor is talking...',
    color: 'rgba(78, 205, 196, 0.18)', // Mint
    borderColor: 'rgba(78, 205, 196, 0.5)',
    glowColor: 'rgba(78, 205, 196, 0.3)',
    iconColor: '#4ECDC4',
  },
  error: {
    label: 'Connection Error',
    sublabel: 'Tap to retry',
    color: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    glowColor: 'rgba(239, 68, 68, 0.2)',
    iconColor: '#EF4444',
  },
};

export default function VoiceOrb({ voiceState, isConnected, isReady, onToggle }: VoiceOrbProps) {
  const config = stateConfig[voiceState];
  const isActive = voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'thinking';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center w-44 h-44 sm:w-52 sm:h-52">
        {isActive && (
          <>
            <div className="absolute rounded-full animate-ping"
              style={{
                width: 160, height: 160,
                background: config.glowColor,
                animationDuration: '2s',
                opacity: 0.5
              }} />
            <div className="absolute rounded-full animate-ping"
              style={{
                width: 180, height: 180,
                background: config.glowColor,
                animationDuration: '2.5s',
                animationDelay: '0.5s',
                opacity: 0.3
              }} />
          </>
        )}

        <button
          onClick={onToggle}
          disabled={!isReady && voiceState === 'idle'}
          className="relative z-10 flex items-center justify-center rounded-full transition-all duration-300 select-none"
          style={{
            width: '70%',
            maxWidth: 140,
            aspectRatio: '1 / 1',
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.12), ${config.color})`,
            border: `2px solid ${config.borderColor}`,
            boxShadow: `0 0 40px ${config.glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
            cursor: isReady ? 'pointer' : 'not-allowed',
            opacity: !isReady ? 0.5 : 1,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            {voiceState === 'idle' && (
              <svg className="w-10 h-10" style={{ color: config.iconColor }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
            {voiceState === 'connecting' && (
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: `${config.iconColor} transparent transparent transparent` }} />
              </div>
            )}
            {voiceState === 'listening' && (
              <div className="flex items-end gap-0.5 h-10">
                {[3, 6, 9, 12, 9, 6, 3, 6, 9].map((h, i) => (
                  <div key={i} className="w-1 rounded-full"
                    style={{ height: h, background: config.iconColor, minHeight: 3, animation: 'wave 0.8s ease-in-out infinite' }} />
                ))}
              </div>
            )}
            {voiceState === 'thinking' && (
              <div className="flex gap-1.5 items-center h-10">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div key={i} className="w-2 h-2 rounded-full typing-dot"
                    style={{ background: config.iconColor }} />
                ))}
              </div>
            )}
            {voiceState === 'speaking' && (
              <div className="flex items-end gap-0.5 h-10">
                {[5, 10, 15, 18, 15, 10, 5, 10, 15].map((h, i) => (
                  <div key={i} className="w-1 rounded-full"
                    style={{ height: h, background: config.iconColor, animation: 'wave 0.8s ease-in-out infinite' }} />
                ))}
              </div>
            )}
            {voiceState === 'error' && (
              <svg className="w-10 h-10" style={{ color: config.iconColor }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            )}
          </div>
        </button>

        {isConnected && (
          <button
            onClick={onToggle}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all hover:scale-110"
            style={{
              background: 'rgba(239, 68, 68, 0.9)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)'
            }}
            title="End session"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1"/>
            </svg>
          </button>
        )}
      </div>

      <div className="text-center" style={{ fontFamily: 'Nunito, sans-serif' }}>
        <p className="text-sm font-bold" style={{ color: config.iconColor }}>{config.label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{config.sublabel}</p>
      </div>

      {voiceState === 'speaking' && (
        <div className="text-xs text-slate-400 text-center animate-pulse" style={{ fontFamily: 'Nunito, sans-serif' }}>
          💬 Speak to interrupt
        </div>
      )}
    </div>
  );
}
