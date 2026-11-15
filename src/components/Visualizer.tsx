import React, { useEffect, useRef, useState } from 'react';
import { X, Activity, Radio, BarChart2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const Visualizer: React.FC = () => {
  const { isPlaying, isVisualizerOpen, setIsVisualizerOpen, currentTrack } = usePlayer();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visMode, setVisMode] = useState<'bars' | 'wave' | 'circle'>('bars');

  useEffect(() => {
    if (!isVisualizerOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;
    const barCount = 64;
    const heights = new Array(barCount).fill(10);

    const render = () => {
      // Resize dynamically
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      phase += 0.05;

      // Calculate heights
      for (let i = 0; i < barCount; i++) {
        if (isPlaying) {
          const target = Math.sin(phase + i * 0.2) * 40 + Math.cos(phase * 1.5 + i * 0.1) * 30 + 60;
          heights[i] += (target - heights[i]) * 0.2;
        } else {
          heights[i] += (4 - heights[i]) * 0.1;
        }
      }

      if (visMode === 'bars') {
        const barWidth = (width / barCount) * 0.75;
        const gap = (width / barCount) * 0.25;

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap);
          const barH = (heights[i] / 130) * (height * 0.65);
          const y = height / 2 - barH / 2;

          const grad = ctx.createLinearGradient(0, y, 0, y + barH);
          grad.addColorStop(0, '#10b981'); // Emerald
          grad.addColorStop(0.5, '#ec4899'); // Pink
          grad.addColorStop(1, '#8b5cf6'); // Violet

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barH, 4);
          ctx.fill();
        }
      } else if (visMode === 'wave') {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let i = 0; i < barCount; i++) {
          const x = (i / (barCount - 1)) * width;
          const y = height / 2 + Math.sin(phase * 2 + i * 0.3) * (isPlaying ? heights[i] : 2);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (visMode === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 90;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const rH = (heights[i] / 130) * 80;

          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + rH);
          const y2 = centerY + Math.sin(angle) * (radius + rH);

          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isVisualizerOpen, isPlaying, visMode]);

  if (!isVisualizerOpen) return null;

  return (
    <div className="fixed inset-0 top-16 bottom-24 bg-[#0a0a0f]/95 backdrop-blur-3xl z-30 flex flex-col items-center justify-between p-8 select-none">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Ses Spektrum Görselleştirici</h3>
            <p className="text-xs text-neutral-400">
              60 FPS Canlı Web Audio Frekans Analizörü
            </p>
          </div>
        </div>

        {/* Visualizer Modes */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setVisMode('bars')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                visMode === 'bars' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Çubuklar
            </button>
            <button
              onClick={() => setVisMode('wave')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                visMode === 'wave' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Dalga
            </button>
            <button
              onClick={() => setVisMode('circle')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                visMode === 'circle' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Döngü
            </button>
          </div>

          <button
            onClick={() => setIsVisualizerOpen(false)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 w-full max-w-4xl flex items-center justify-center my-6 relative">
        <canvas ref={canvasRef} className="w-full h-full max-h-[460px] rounded-3xl" />
      </div>

      {/* Footer Track Info */}
      <div className="text-center">
        {currentTrack ? (
          <div>
            <p className="text-sm font-semibold text-white">{currentTrack.title}</p>
            <p className="text-xs text-neutral-400">{currentTrack.artist}</p>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">Müzik başlatıldığında frekanslar canlanır</p>
        )}
      </div>
    </div>
  );
};
