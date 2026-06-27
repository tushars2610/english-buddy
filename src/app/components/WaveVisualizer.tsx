'use client';

import { useEffect, useRef } from 'react';

interface WaveVisualizerProps {
  isActive: boolean;
  color?: string;
  barCount?: number;
  height?: number;
}

export default function WaveVisualizer({
  isActive,
  color = '#FF6B6B',
  barCount = 20,
  height = 60,
}: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const barsRef = useRef<number[]>(
    Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1)
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = canvas.width / barCount;
    const gap = barWidth * 0.3;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      barsRef.current = barsRef.current.map((h) => {
        if (!isActive) {
          return h * 0.95 + 0.05 * 0.15;
        }
        const target = Math.random() * 0.8 + 0.2;
        return h * 0.7 + target * 0.3;
      });

      barsRef.current.forEach((h, i) => {
        const barH = h * height;
        const x = i * barWidth + gap / 2;
        const y = (canvas.height - barH) / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barH);
        gradient.addColorStop(0, color + 'CC');
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, color + 'CC');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - gap, barH, 4);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isActive, color, barCount, height]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 18}
      height={height + 10}
      style={{ width: '100%', height: `${height + 10}px` }}
    />
  );
}
