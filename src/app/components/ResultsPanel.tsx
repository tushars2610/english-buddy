'use client';

import { AnalysisResult } from '@/types';
import ScoreRing from './ScoreRing';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { useEffect, useState } from 'react';

interface ResultsPanelProps {
  result: AnalysisResult;
  onRetry: () => void;
}

const SCORE_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F59E0B'];

const getRatingEmoji = (rating: string) => {
  switch (rating) {
    case 'Excellent': return '🌟';
    case 'Good': return '😊';
    case 'Keep Practicing': return '💪';
    case 'Great Start': return '🎉';
    default: return '⭐';
  }
};

const getRatingGradient = (rating: string) => {
  switch (rating) {
    case 'Excellent': return 'linear-gradient(135deg, #FFE66D, #F59E0B)';
    case 'Good': return 'linear-gradient(135deg, #4ECDC4, #0891B2)';
    case 'Keep Practicing': return 'linear-gradient(135deg, #A78BFA, #7C3AED)';
    case 'Great Start': return 'linear-gradient(135deg, #FF6B6B, #FF8E53)';
    default: return 'linear-gradient(135deg, #4ECDC4, #0891B2)';
  }
};

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(17,24,39,0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '10px 14px',
        fontFamily: 'Nunito, sans-serif',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#4ECDC4', fontWeight: 700, fontSize: 16 }}>{payload[0].value}/100</p>
      </div>
    );
  }
  return null;
};

export default function ResultsPanel({ result, onRetry }: ResultsPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, [result]);

  const radarData = [
    { subject: 'Pronunciation', value: result.pronunciationScore },
    { subject: 'Fluency', value: result.fluencyScore },
    { subject: 'Vocabulary', value: result.vocabularyScore },
    { subject: 'Grammar', value: result.grammarScore },
    { subject: 'Confidence', value: result.confidenceScore },
  ];

  const barData = [
    { name: 'Pronunciation', score: result.pronunciationScore },
    { name: 'Fluency', score: result.fluencyScore },
    { name: 'Vocabulary', score: result.vocabularyScore },
    { name: 'Grammar', score: result.grammarScore },
    { name: 'Confidence', score: result.confidenceScore },
  ];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {/* Rating Header */}
      <div
        className="glass-card p-6 mb-6 text-center"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 24px',
            borderRadius: 50,
            background: getRatingGradient(result.rating),
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 20 }}>{getRatingEmoji(result.rating)}</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: '#0B1120' }}>
            {result.rating}!
          </span>
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            background: getRatingGradient(result.rating),
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          {result.overallScore}
          <span style={{ fontSize: 24, fontWeight: 600 }}>/100</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 8px' }}>
          {result.message}
        </p>
        <p style={{ color: '#FFE66D', fontWeight: 700, fontSize: 16 }}>
          {result.encouragement}
        </p>
      </div>

      {/* Score Rings */}
      <div
        className="glass-card p-6 mb-6"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <h3 style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
          📊 Detailed Scores
        </h3>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <ScoreRing score={result.pronunciationScore} label="Pronunciation" color="#FF6B6B" delay={100} />
          <ScoreRing score={result.fluencyScore} label="Fluency" color="#4ECDC4" delay={200} />
          <ScoreRing score={result.vocabularyScore} label="Vocabulary" color="#FFE66D" delay={300} />
          <ScoreRing score={result.grammarScore} label="Grammar" color="#A78BFA" delay={400} />
          <ScoreRing score={result.confidenceScore} label="Confidence" color="#F59E0B" delay={500} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Radar Chart */}
        <div
          className="glass-card p-4"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
            🕸️ Skill Web
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Nunito' }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#4ECDC4"
                fill="#4ECDC4"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div
          className="glass-card p-4"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
            📈 Score Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical" margin={{ left: -10, right: 10 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11, fontFamily: 'Nunito' }} width={90} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {barData.map((_, idx) => (
                  <Cell key={idx} fill={SCORE_COLORS[idx % SCORE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div
          className="glass-card p-4"
          style={{ border: '1px solid rgba(78, 205, 196, 0.2)' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#4ECDC4', marginBottom: 12 }}>
            ✨ Your Strengths
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.strengths.map((s, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: '#4ECDC4', marginTop: 1, flexShrink: 0 }}>✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="glass-card p-4"
          style={{ border: '1px solid rgba(255, 107, 107, 0.2)' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: '#FF6B6B', marginBottom: 12 }}>
            🎯 Let&apos;s Improve
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.improvements.map((imp, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: '#FFE66D', marginTop: 1, flexShrink: 0 }}>→</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Word Details */}
      {result.wordDetails && result.wordDetails.length > 0 && (
        <div
          className="glass-card p-4 mb-6"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h3 style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>
            🔤 Word-by-Word Feedback
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {result.wordDetails.map((wd, i) => (
              <div
                key={i}
                title={wd.feedback}
                style={{
                  padding: '6px 14px',
                  borderRadius: 50,
                  background: wd.score >= 75 ? 'rgba(78,205,196,0.12)' : wd.score >= 50 ? 'rgba(255,230,109,0.12)' : 'rgba(255,107,107,0.12)',
                  border: `1px solid ${wd.score >= 75 ? 'rgba(78,205,196,0.3)' : wd.score >= 50 ? 'rgba(255,230,109,0.3)' : 'rgba(255,107,107,0.3)'}`,
                  cursor: 'default',
                  fontSize: 13,
                  fontWeight: 600,
                  color: wd.score >= 75 ? '#4ECDC4' : wd.score >= 50 ? '#FFE66D' : '#FF6B6B',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {wd.word}
                <span style={{ marginLeft: 6, opacity: 0.7, fontWeight: 400 }}>
                  {wd.score}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            Hover over words to see feedback
          </p>
        </div>
      )}

      {/* Retry Button */}
      <button
        onClick={onRetry}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
          border: 'none',
          color: 'white',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 800,
          fontSize: 16,
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 4px 20px rgba(255,107,107,0.3)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        🎤 Try Again!
      </button>
    </div>
  );
}
