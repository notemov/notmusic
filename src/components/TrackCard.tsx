import React, { useState, useEffect } from 'react';
import { Play, Pause, Heart, MoreVertical, Plus, DownloadCloud, Check } from 'lucide-react';
import { Track } from '../types';
import { usePlayer } from '../context/PlayerContext';
import { saveOfflineTrack, isTrackDownloaded } from '../services/offlineStorage';

interface TrackCardProps {
  track: Track;
  queueContext?: Track[];
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, queueContext }) => {
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

  const [showMenu, setShowMenu] = React.useState(false);
  const isCurrent = currentTrack?.id === track.id;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, queueContext);
    }
  };

  const getSourceBadge = () => {
    if (track.source === 'spotify') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Spotify
        </span>
      );
    }
    if (track.source === 'apple') {
      return (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
          Apple
        </span>
      );
    }
    return (
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
        YouTube
      </span>
    );
  };

  return (
    <div
      onClick={() => playTrack(track, queueContext)}
      className="group relative bg-white/[0.03] hover:bg-white/[0.08] p-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 mb-3 shadow-md">
        <img
          src={track.coverUrl}
          alt={track.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Source Badge (Top Left) */}
        <div className="absolute top-2 left-2 shadow-sm">
          {getSourceBadge()}
        </div>

        {/* Hover overlay & Play button */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={handlePlayClick}
            className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-200"
          >
            {isCurrent && isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>
        </div>

        {/* Like Shortcut (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/50 backdrop-blur-md transition-all ${
            isLiked(track.id) ? 'opacity-100 text-pink-500' : 'opacity-0 group-hover:opacity-100 text-white hover:text-pink-400'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked(track.id) ? 'fill-pink-500' : ''}`} />
        </button>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-semibold truncate transition-colors ${
          isCurrent ? 'text-emerald-400' : 'text-white group-hover:text-emerald-300'
        }`}>
          {track.title}
        </h4>
        <p className="text-xs text-neutral-400 truncate mt-0.5">
          {track.artist}
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-white/5">
        <span>{track.duration || '3:30'}</span>
        
        {/* More options dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-neutral-400 hover:text-white rounded"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-44 glass-dropdown rounded-xl py-1 shadow-2xl z-30 text-xs"
            >
              <button
                onClick={async () => {
                  await saveOfflineTrack(track);
                  setShowMenu(false);
                  alert(`"${track.title}" çevrim dışı kütüphaneye indirildi!`);
                }}
                className="w-full text-left px-3 py-2 text-cyan-400 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Çevrim Dışı İndir</span>
              </button>

              <button
                onClick={() => {
                  addToQueue(track);
                  setShowMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-neutral-300 hover:text-white hover:bg-white/10 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sıraya Ekle</span>
              </button>

              {playlists.map(pl => (
                <button
                  key={pl.id}
                  onClick={() => {
                    addTrackToPlaylist(pl.id, track);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-neutral-400 hover:text-white hover:bg-white/10 truncate"
                >
                  + {pl.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
