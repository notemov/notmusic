import React from 'react';
import { Play, Pause, Heart, Clock, Plus, ListPlus, DownloadCloud, Check, X } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { saveOfflineTrack } from '../services/offlineStorage';

interface TrackListProps {
  tracks: Track[];
  showAlbum?: boolean;
}

export const TrackList: React.FC<TrackListProps> = ({ tracks, showAlbum = true }) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    isLiked,
    toggleLike,
    playlists,
    addTrackToPlaylist,
    createPlaylist,
    showToast
  } = usePlayer();

  const [pickerTrack, setPickerTrack] = React.useState<Track | null>(null);
  const [newPlName, setNewPlName] = React.useState('');
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const getSourceBadge = (source: string) => {
    if (source === 'spotify') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Spotify
        </span>
      );
    }
    if (source === 'apple') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
          Apple
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
        YouTube
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[1.75rem_1fr_auto] md:grid-cols-[3rem_1fr_1fr_7rem_4rem] gap-2 md:gap-0 px-2.5 md:px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/5 select-none">
        <span>#</span>
        <span>Başlık</span>
        {showAlbum && <span className="hidden md:block">Albüm</span>}
        <span className="hidden md:block">Platform</span>
        <span className="flex items-center justify-end pr-1 md:pr-3">
          <Clock className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-white/[0.02]">
        {tracks.map((track, idx) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <div
              key={track.id}
              onClick={() => playTrack(track, tracks)}
              className={`group grid grid-cols-[1.75rem_1fr_auto] md:grid-cols-[3rem_1fr_1fr_7rem_4rem] gap-2 md:gap-0 items-center px-2.5 md:px-4 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                isCurrent
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'hover:bg-white/[0.05] text-neutral-300'
              }`}
            >
              {/* Index or Play icon */}
              <div className="flex items-center">
                <span className="text-neutral-500 group-hover:hidden w-6 text-center font-mono text-xs">
                  {idx + 1}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrent) togglePlay();
                    else playTrack(track, tracks);
                  }}
                  className="hidden group-hover:flex items-center justify-center w-6 text-white"
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Title & Artist */}
              <div className="flex items-center gap-2.5 md:gap-3 min-w-0 pr-2 md:pr-4">
                <img
                  src={track.coverUrl}
                  alt={track.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm bg-neutral-900"
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium truncate ${isCurrent ? 'text-emerald-400 font-semibold' : 'text-white'}`}>
                    {track.title}
                  </p>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs text-neutral-400 truncate">
                      {track.artist}
                    </p>
                    <span className="md:hidden shrink-0 scale-90 origin-left">{getSourceBadge(track.source)}</span>
                  </div>
                </div>
              </div>

              {/* Album */}
              {showAlbum && (
                <div className="hidden md:block text-xs text-neutral-400 truncate pr-4">
                  {track.album || '-'}
                </div>
              )}

              {/* Source Badge */}
              <div className="hidden md:block">{getSourceBadge(track.source)}</div>

              {/* Duration, Playlist, Download & Like */}
              <div className="flex items-center justify-end gap-1 md:gap-2 text-xs text-neutral-400 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerTrack(track);
                  }}
                  title="Çalma Listesine Ekle"
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (downloadingId === track.id) return;
                    setDownloadingId(track.id);
                    showToast(`"${track.title}" indiriliyor...`);
                    const ok = await saveOfflineTrack(track);
                    setDownloadingId(null);
                    if (ok) showToast(`"${track.title}" çevrim dışı indirildi!`);
                    else showToast(`"${track.title}" indirilemedi.`);
                  }}
                  title="Çevrim Dışı İndir"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    downloadingId === track.id ? 'text-cyan-400 animate-pulse' : 'text-neutral-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }`}
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(track);
                  }}
                  className={`p-1.5 rounded-lg transition-opacity cursor-pointer ${
                    isLiked(track.id) ? 'text-pink-500' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked(track.id) ? 'fill-pink-500' : ''}`} />
                </button>

                <span className="font-mono w-9 md:w-10 text-right hidden sm:inline">
                  {track.duration || '3:30'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Playlist Picker Modal */}
      {pickerTrack && (
        <div
          onClick={() => setPickerTrack(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14141e] border border-white/10 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-emerald-400" />
                  Çalma Listesine Ekle
                </h3>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{pickerTrack.title}</p>
              </div>
              <button
                onClick={() => setPickerTrack(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5">
              {playlists.map(pl => {
                const alreadyIn = pl.tracks.some(t => t.id === pickerTrack.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      addTrackToPlaylist(pl.id, pickerTrack);
                      setPickerTrack(null);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                      <p className="text-[10px] text-neutral-400">{pl.tracks.length} parça</p>
                    </div>
                    {alreadyIn ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlName.trim()) return;
                createPlaylist(newPlName.trim());
                setNewPlName('');
              }}
              className="flex gap-2 pt-2 border-t border-white/5"
            >
              <input
                type="text"
                value={newPlName}
                onChange={(e) => setNewPlName(e.target.value)}
                placeholder="Yeni liste adı..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer"
              >
                Oluştur
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
