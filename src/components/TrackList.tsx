import React from 'react';
import { Play, Pause, Heart, Clock, Plus, MoreHorizontal } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';

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
    addToQueue,
    playlists,
    addTrackToPlaylist
  } = usePlayer();

  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

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

              {/* Duration & Like */}
              <div className="flex items-center justify-end gap-2 md:gap-3 text-xs text-neutral-400 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(track);
                  }}
                  className={`md:opacity-0 md:group-hover:opacity-100 transition-opacity ${
                    isLiked(track.id) ? 'opacity-100 text-pink-500' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked(track.id) ? 'fill-pink-500' : ''}`} />
                </button>

                <span className="font-mono w-9 md:w-10 text-right">
                  {track.duration || '3:30'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
