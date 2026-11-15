import React from 'react';
import { X, Trash2, Music2, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

export const QueueDrawer: React.FC = () => {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    queueIndex,
    currentTrack,
    playTrack,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-[#0f0f18]/95 backdrop-blur-2xl border-l border-white/10 z-40 flex flex-col shadow-2xl select-none">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Music2 className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white text-sm">Çalma Sırası ({queue.length})</h3>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              title="Sırayı Temizle"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsQueueOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Queue Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Currently Playing */}
        {currentTrack && (
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Şu An Çalıyor
            </span>
            <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-11 h-11 rounded-lg object-cover bg-neutral-900"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div>
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Sıradaki Parçalar
          </span>

          <div className="mt-2 space-y-1.5">
            {queue.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">
                Sırada başka şarkı yok
              </p>
            ) : (
              queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;

                return (
                  <div
                    key={`${track.id}_${idx}`}
                    onClick={() => playTrack(track, queue)}
                    className={`group flex items-center gap-3 p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-white/10 text-white font-medium'
                        : 'hover:bg-white/5 text-neutral-300'
                    }`}
                  >
                    <span className="w-4 text-center font-mono text-[10px] text-neutral-500">
                      {idx + 1}
                    </span>

                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-9 h-9 rounded-lg object-cover bg-neutral-900 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-white">
                        {track.title}
                      </p>
                      <p className="truncate text-[10px] text-neutral-400">
                        {track.artist}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
