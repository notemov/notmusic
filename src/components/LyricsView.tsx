import React, { useEffect, useState, useRef } from 'react';
import { X, Mic2, Sparkles, Loader2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getLyrics } from '../services/api';
import { SyncedLyricLine } from '../types';

export const LyricsView: React.FC = () => {
  const { currentTrack, currentTime, isLyricsOpen, setIsLyricsOpen, seekTo } = usePlayer();
  const [syncedLines, setSyncedLines] = useState<SyncedLyricLine[]>([]);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Fetch lyrics whenever current track changes
  useEffect(() => {
    if (!currentTrack || !isLyricsOpen) return;

    let isMounted = true;
    setIsLoading(true);
    setSyncedLines([]);
    setPlainLyrics(null);

    getLyrics(currentTrack.title, currentTrack.artist).then((data) => {
      if (!isMounted) return;
      setIsLoading(false);

      if (data.syncedLyrics) {
        // Parse LRC format: [01:23.45] lyric text
        const lines: SyncedLyricLine[] = [];
        const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

        data.syncedLyrics.split('\n').forEach((raw) => {
          const m = raw.match(regex);
          if (m) {
            const mins = parseInt(m[1], 10);
            const secs = parseInt(m[2], 10);
            const ms = parseInt(m[3], 10) / (m[3].length === 3 ? 1000 : 100);
            const timeSec = mins * 60 + secs + ms;
            const text = m[4].trim();
            if (text) {
              lines.push({ timeSec, text });
            }
          }
        });
        setSyncedLines(lines);
      } else if (data.plainLyrics) {
        setPlainLyrics(data.plainLyrics);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTrack?.id, isLyricsOpen]);

  // Track active line
  useEffect(() => {
    if (syncedLines.length === 0) return;

    let currIdx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (currentTime >= syncedLines[i].timeSec) {
        currIdx = i;
      } else {
        break;
      }
    }

    setActiveIndex(currIdx);
  }, [currentTime, syncedLines]);

  // Smooth auto-scroll active lyric line to center
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex]);

  if (!isLyricsOpen) return null;

  return (
    <div className="fixed inset-0 top-16 bottom-24 bg-[#0a0a0f]/95 backdrop-blur-3xl z-30 flex flex-col items-center justify-between p-8 select-none">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Canlı Şarkı Sözleri</h3>
            <p className="text-xs text-neutral-400">
              {currentTrack ? `${currentTrack.artist} — ${currentTrack.title}` : 'Şarkı seçilmedi'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lyrics Body */}
      <div
        ref={scrollContainerRef}
        className="flex-1 w-full max-w-2xl overflow-y-auto my-6 py-12 px-4 space-y-6 text-center"
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <p className="text-sm">Şarkı sözleri taranıyor...</p>
          </div>
        ) : syncedLines.length > 0 ? (
          syncedLines.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <p
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => seekTo(line.timeSec)}
                className={`text-xl md:text-2xl font-bold cursor-pointer transition-all duration-300 py-1.5 px-4 rounded-xl ${
                  isActive
                    ? 'text-white scale-110 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] font-extrabold'
                    : 'text-neutral-500 hover:text-neutral-300 scale-100'
                }`}
              >
                {line.text}
              </p>
            );
          })
        ) : plainLyrics ? (
          <div className="text-left max-w-xl mx-auto whitespace-pre-line text-lg leading-relaxed text-neutral-300">
            {plainLyrics}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-neutral-500">
            <Sparkles className="w-10 h-10 text-neutral-600" />
            <p className="text-base font-semibold text-neutral-400">
              Bu parça için sözler henüz senkronize edilmedi
            </p>
            <p className="text-xs text-neutral-600">
              Şarkı çalmaya devam ederken diğer parçaların sözlerini deneyebilirsiniz
            </p>
          </div>
        )}
      </div>

      {/* Footer tip */}
      <div className="text-xs text-neutral-500 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span>Sözlere tıklayarak istediğin yere anında atlayabilirsin</span>
      </div>
    </div>
  );
};
