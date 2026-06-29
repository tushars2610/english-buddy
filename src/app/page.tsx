'use client';

import { useState } from 'react';
import ChatMode from './components/ChatMode';
import UploadMode from './components/UploadMode';

type Tab = 'chat' | 'upload';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <main
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px 40px',
      }}
    >
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 520 }}>
        {/* Logo mark */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 8px 32px rgba(255,107,107,0.4)',
            }}
          >
            ⭐
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 900,
                background: 'linear-gradient(135deg, #FF6B6B, #FFE66D)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                letterSpacing: '-0.5px',
              }}
            >
              SpeakStar
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.05em' }}>
              ENGLISH LEARNING FOR KIDS
            </p>
          </div>
        </div>

        <p
          style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
          }}
        >
          Practise speaking English and get instant feedback with our friendly AI tutor!
          Perfect for ages <strong style={{ color: 'rgba(255,255,255,0.7)' }}>5–14</strong> 🚀
        </p>
      </div>

      {/* Main card */}
      <div
        style={{
          width: '100%',
          maxWidth: 680,
          background: 'rgba(11, 17, 32, 0.7)',
          backdropFilter: 'blur(24px)',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            padding: '12px 12px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {[
            { id: 'chat' as Tab, label: '🎤 AI Conversation', sub: 'Talk with your AI tutor' },
            { id: 'upload' as Tab, label: '📁 Upload & Analyse', sub: 'Analyse your recording' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 8px 14px',
                borderRadius: '12px 12px 0 0',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Nunito, sans-serif',
                transition: 'all 0.25s',
                background:
                  activeTab === tab.id
                    ? 'rgba(255,255,255,0.05)'
                    : 'transparent',
                borderBottom:
                  activeTab === tab.id
                    ? '2px solid #FF6B6B'
                    : '2px solid transparent',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  fontSize: 14,
                  color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.35)',
                  marginBottom: 2,
                  transition: 'color 0.2s',
                }}
              >
                {tab.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: activeTab === tab.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)',
                }}
              >
                {tab.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px 20px' }}>
          {activeTab === 'chat' ? <ChatMode /> : <UploadMode />}
        </div>
      </div>

      {/* Footer badges */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginTop: 28,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { id: 'safe', icon: '🔒', text: 'Safe for Kids' },
          { id: 'ai', icon: '🤖', text: <>Powered by <a href="https://pravakta.ai/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline underline-offset-2">Pravakta AI</a></> },
          { id: 'fast', icon: '⚡', text: 'Instant Feedback' },
          { id: 'stats', icon: '📊', text: 'Detailed Analytics' },
        ].map((b) => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 50,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: 13,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
            }}
          >
            <span>{b.icon}</span>
            {b.text}
          </div>
        ))}
      </div>
    </main>
  );
}
