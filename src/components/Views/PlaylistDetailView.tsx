import React from 'react';
import { Play, ArrowLeft, Trash2, Music } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

export const PlaylistDetailView: React.FC = () => {
  const { 
    selectedPlaylist, 
    setActiveView, 
    playTrack, 
    currentTrack, 
    removeTrackFromPlaylist
  } = usePlayer();

  if (!selectedPlaylist) {
    return (
      <div className="p-8 text-center">
        <button
          onClick={() => setActiveView('library')}
          className="text-xs text-emerald-400 hover:underline"
        >
          ← Kitaplığa Dön
        </button>
      </div>
    );
  }

  const handlePlayAll = () => {
    if (selectedPlaylist.tracks.length > 0) {
      playTrack(selectedPlaylist.tracks[0], selectedPlaylist.tracks);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Back button */}
      <button
        onClick={() => setActiveView('library')}
        className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kitaplığa Dön</span>
      </button>

      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 bg-gradient-to-t from-white/[0.04] to-transparent p-6 rounded-3xl border border-white/5">
        <div className="w-48 h-48 rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl flex-shrink-0">
          <img
            src={selectedPlaylist.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
            alt={selectedPlaylist.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Çalma Listesi
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white truncate">
            {selectedPlaylist.name}
          </h2>
          <p className="text-xs text-neutral-400">
            {selectedPlaylist.description || 'Özel çalma listesi'} • {selectedPlaylist.tracks.length} parça
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <button
              onClick={handlePlayAll}
              disabled={selectedPlaylist.tracks.length === 0}
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Çalma Listesini Başlat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Table */}
      {selectedPlaylist.tracks.length === 0 ? (
        <div className="py-20 text-center space-y-2">
          <Music className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="text-base font-semibold text-neutral-300">
            Bu listede henüz şarkı yok
          </p>
          <p className="text-xs text-neutral-500">
            Arama veya Keşfet sayfalarından şarkı kartlarındaki menüyü kullanarak şarkı ekleyebilirsiniz
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <div className="divide-y divide-white/[0.02]">
            {selectedPlaylist.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={`${track.id}_${idx}`}
                  onClick={() => playTrack(track, selectedPlaylist.tracks)}
                  className={`group grid grid-cols-[3rem_1fr_1fr_4rem] items-center px-4 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'hover:bg-white/[0.05] text-neutral-300'
                  }`}
                >
                  <span className="text-neutral-500 w-6 text-center font-mono text-xs">
                    {idx + 1}
                  </span>

                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-neutral-900"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold truncate ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-neutral-400 truncate">
                    {track.album || '-'}
                  </span>

                  <div className="flex items-center justify-end gap-3 text-xs text-neutral-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrackFromPlaylist(selectedPlaylist.id, track.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                      title="Listeden Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono">{track.duration || '3:30'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
