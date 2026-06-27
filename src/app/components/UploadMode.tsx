'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Music, Loader2, Play, Pause, X, CheckCircle } from 'lucide-react';
import ResultsPanel from './ResultsPanel';
import WaveVisualizer from './WaveVisualizer';
import { AnalysisResult } from '@/types';

type UploadPhase = 'idle' | 'uploaded' | 'analysing' | 'results';

const SUPPORTED_FORMATS = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/m4a', 'audio/mp4'];
const MAX_SIZE_MB = 25;

export default function UploadMode() {
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [context, setContext] = useState('');
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = useCallback((file: File) => {
    setError('');
    if (!SUPPORTED_FORMATS.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm|m4a|aac)$/i)) {
      setError('Please upload an audio file (MP3, WAV, OGG, WebM, M4A)');
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB`);
      return;
    }
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setPhase('uploaded');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAnalyse = async () => {
    if (!audioFile) return;
    setPhase('analysing');
    setProgress(0);

    // Fake progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 85;
        }
        return p + Math.random() * 8 + 2;
      });
    }, 400);

    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      formData.append('transcript', '');
      formData.append('context', context || 'General English speaking practice');

      const response = await fetch('/api/analyze-audio', {
        method: 'POST',
        body: formData,
      });

      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setProgress(100);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const result: AnalysisResult = await response.json();
      setTimeout(() => {
        setAnalysisResult(result);
        setPhase('results');
      }, 500);
    } catch (err) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error(err);
      setError(String(err));
      setPhase('uploaded');
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setPhase('idle');
    setAudioFile(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setAnalysisResult(null);
    setError('');
    setContext('');
    setProgress(0);
  };

  // ── RESULTS ──────────────────────────────────────────────────────────────
  if (phase === 'results' && analysisResult) {
    return <ResultsPanel result={analysisResult} onRetry={handleReset} />;
  }

  // ── ANALYSING ─────────────────────────────────────────────────────────────
  if (phase === 'analysing') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        {/* Spinner orb */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(78,205,196,0.2))',
            border: '2px solid rgba(167,139,250,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'float1 3s ease-in-out infinite',
          }}
        >
          <Loader2 size={48} color="#A78BFA" style={{ animation: 'spin 1.5s linear infinite' }} />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Analysing Your Audio
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontSize: 14 }}>
          Our AI is carefully listening and evaluating your English...
        </p>

        {/* Progress bar */}
        <div
          style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 50,
            height: 10,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #A78BFA, #4ECDC4)',
              borderRadius: 50,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <p style={{ color: '#A78BFA', fontWeight: 700, fontSize: 14 }}>
          {Math.round(progress)}% complete
        </p>

        {/* Wave below */}
        <div style={{ marginTop: 24, opacity: 0.6 }}>
          <WaveVisualizer isActive={true} color="#A78BFA" barCount={24} height={40} />
        </div>

        {/* Steps */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {['Transcribing audio', 'Checking pronunciation', 'Rating fluency', 'Generating feedback'].map((step, i) => (
            <div
              key={step}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: progress > i * 25 ? '#4ECDC4' : 'rgba(255,255,255,0.25)',
                transition: 'color 0.5s',
              }}
            >
              {progress > i * 25 ? (
                <CheckCircle size={12} />
              ) : (
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1px solid currentColor', opacity: 0.4 }} />
              )}
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── UPLOAD UI ─────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 8 }}>
          Upload Your Recording 🎵
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Upload an audio file of you speaking English and get instant feedback
        </p>
      </div>

      {/* Drop zone */}
      {phase === 'idle' && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className="glass-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            border: `2px dashed ${isDragging ? '#FF6B6B' : 'rgba(255,255,255,0.1)'}`,
            background: isDragging ? 'rgba(255,107,107,0.04)' : 'rgba(17,24,39,0.4)',
            transition: 'all 0.25s',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: isDragging ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              transition: 'all 0.25s',
              border: `1px solid ${isDragging ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <Upload size={32} color={isDragging ? '#FF6B6B' : 'rgba(255,255,255,0.3)'} />
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
            {isDragging ? 'Drop it here!' : 'Drag & drop your audio file'}
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
            or click to browse
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['MP3', 'WAV', 'OGG', 'WebM', 'M4A'].map((fmt) => (
              <span
                key={fmt}
                style={{
                  padding: '4px 10px',
                  borderRadius: 50,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 600,
                }}
              >
                {fmt}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 12 }}>
            Max file size: {MAX_SIZE_MB}MB
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {/* Uploaded file preview */}
      {phase === 'uploaded' && audioFile && (
        <>
          <div
            className="glass-card"
            style={{
              padding: '20px',
              marginBottom: 16,
              border: '1px solid rgba(78,205,196,0.2)',
            }}
          >
            {/* File info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(78,205,196,0.1)',
                  border: '1px solid rgba(78,205,196,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Music size={22} color="#4ECDC4" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {audioFile.name}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB · {audioFile.type || 'audio'}
                </p>
              </div>
              <button
                onClick={handleReset}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)',
                  display: 'flex',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Waveform + player */}
            <div style={{ marginBottom: 12 }}>
              <WaveVisualizer isActive={isPlaying} color="#4ECDC4" barCount={28} height={48} />
            </div>

            {audioUrl && (
              <>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={togglePlay}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 12,
                    background: 'rgba(78,205,196,0.1)',
                    border: '1px solid rgba(78,205,196,0.25)',
                    color: '#4ECDC4',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(78,205,196,0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(78,205,196,0.1)')}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? 'Pause Preview' : 'Preview Audio'}
                </button>
              </>
            )}
          </div>

          {/* Optional context */}
          <div className="glass-card" style={{ padding: 16, marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
              📝 What were you talking about? (optional)
            </label>
            <input
              type="text"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. My favourite hobby, school life, describing my pet..."
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                color: 'rgba(255,255,255,0.8)',
                fontFamily: 'Nunito, sans-serif',
                fontSize: 14,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,107,107,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            />
          </div>

          {/* Tips */}
          <div
            className="glass-card"
            style={{
              padding: '14px 16px',
              marginBottom: 20,
              border: '1px solid rgba(255,230,109,0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              For best results, record yourself speaking for at least <strong style={{ color: 'rgba(255,230,109,0.7)' }}>30 seconds</strong>. 
              Talk about a topic you know well. Speak clearly and at a natural pace!
            </p>
          </div>

          {/* Analyse button */}
          <button
            onClick={handleAnalyse}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
              border: 'none',
              color: 'white',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800,
              fontSize: 17,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 4px 24px rgba(255,107,107,0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,107,107,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,107,107,0.4)';
            }}
          >
            ✨ Analyse My English
          </button>

          {/* Upload different */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              marginTop: 10,
              padding: '12px',
              borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            Upload a different file
          </button>
        </>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255,107,107,0.08)',
            border: '1px solid rgba(255,107,107,0.2)',
            color: '#FF6B6B',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
