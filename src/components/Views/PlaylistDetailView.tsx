import React, { useState } from 'react';
import { Play, ArrowLeft, Trash2, Music, Plus, Search, Loader2, Check } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { searchTracks } from '../../services/api';
import { Track } from '../../types';

export const PlaylistDetailView: React.FC = () => {
  const { 
    selectedPlaylist, 
    setActiveView, 
    playTrack, 
    currentTrack, 
    addTrackToPlaylist,
    removeTrackFromPlaylist
  } = usePlayer();

  const [showAddSearch, setShowAddSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);

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

  const handleSearchAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    const list = await searchTracks(query.trim(), 'all');
    setResults(list.slice(0, 12));
    setSearching(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-32">
      {/* Back button */}
      <button
        onClick={() => setActiveView('library')}
        className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kitaplığa Dön</span>
      </button>

      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5 md:gap-6 bg-gradient-to-t from-white/[0.04] to-transparent p-5 md:p-6 rounded-3xl border border-white/5">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl flex-shrink-0">
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
          <h2 className="text-2xl md:text-5xl font-extrabold text-white truncate">
            {selectedPlaylist.name}
          </h2>
          <p className="text-xs text-neutral-400">
            {selectedPlaylist.description || 'Özel çalma listesi'} • {selectedPlaylist.tracks.length} parça
          </p>

          <div className="pt-2 flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePlayAll}
              disabled={selectedPlaylist.tracks.length === 0}
              className="px-5 md:px-6 py-2.5 md:py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Çalma Listesini Başlat</span>
            </button>

            <button
              onClick={() => setShowAddSearch(!showAddSearch)}
              className="px-4 md:px-5 py-2.5 md:py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Listeye Şarkı Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Inline Add Track Search Panel */}
      {showAddSearch && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 md:p-5 space-y-4">
          <form onSubmit={handleSearchAdd} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Listeye eklemek istediğin şarkıyı veya sanatçıyı yaz..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 md:px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shrink-0 cursor-pointer"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ara'}
            </button>
          </form>

          {results.length > 0 && (
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {results.map((track) => {
                const added = selectedPlaylist.tracks.some(t => t.id === track.id);
                return (
                  <div
                    key={track.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 hover:bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-neutral-900"
                      />
                      <div className="min-w-0">
                        <p className="text-xs md:text-sm font-semibold text-white truncate">{track.title}</p>
                        <p className="text-[11px] text-neutral-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addTrackToPlaylist(selectedPlaylist.id, track)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                        added
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white text-black hover:bg-emerald-400'
                      }`}
                    >
                      {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{added ? 'Eklendi' : 'Ekle'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tracks Table */}
      {selectedPlaylist.tracks.length === 0 ? (
        <div className="py-16 md:py-20 text-center space-y-2">
          <Music className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="text-base font-semibold text-neutral-300">
            Bu listede henüz şarkı yok
          </p>
          <p className="text-xs text-neutral-500">
            Yukarıdaki "Listeye Şarkı Ekle" butonundan veya herhangi bir şarkının yanındaki (+) simgesinden şarkı ekleyebilirsin
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 md:p-4">
          <div className="divide-y divide-white/[0.02]">
            {selectedPlaylist.tracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;

              return (
                <div
                  key={`${track.id}_${idx}`}
                  onClick={() => playTrack(track, selectedPlaylist.tracks)}
                  className={`group grid grid-cols-[1.75rem_1fr_auto] md:grid-cols-[3rem_1fr_1fr_4rem] gap-2 md:gap-0 items-center px-2.5 md:px-4 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'hover:bg-white/[0.05] text-neutral-300'
                  }`}
                >
                  <span className="text-neutral-500 w-6 text-center font-mono text-xs">
                    {idx + 1}
                  </span>

                  <div className="flex items-center gap-3 min-w-0 pr-2 md:pr-4">
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

                  <span className="hidden md:block text-xs text-neutral-400 truncate">
                    {track.album || '-'}
                  </span>

                  <div className="flex items-center justify-end gap-2 md:gap-3 text-xs text-neutral-400">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTrackFromPlaylist(selectedPlaylist.id, track.id);
                      }}
                      className="md:opacity-0 md:group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity cursor-pointer"
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
