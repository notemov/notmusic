import React, { useState } from 'react';
import { Heart, Play, Shuffle, Search, Clock } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { TrackList } from '../TrackList';

export const LikedSongsView: React.FC = () => {
  const { likedTracks, playTrack, toggleShuffle, userProfile } = usePlayer();
  const [filterText, setFilterText] = useState('');

  const filteredTracks = likedTracks.filter(t => 
    t.title.toLowerCase().includes(filterText.toLowerCase()) ||
    t.artist.toLowerCase().includes(filterText.toLowerCase())
  );

  const totalSeconds = likedTracks.reduce((acc, t) => acc + (t.durationSec || 210), 0);
  const totalMins = Math.floor(totalSeconds / 60);

  const handlePlayAll = () => {
    if (likedTracks.length > 0) {
      playTrack(likedTracks[0], likedTracks);
    }
  };

  const handleShufflePlay = () => {
    if (likedTracks.length > 0) {
      toggleShuffle();
      const randIdx = Math.floor(Math.random() * likedTracks.length);
      playTrack(likedTracks[randIdx], likedTracks);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Big Hero Gradient Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 bg-gradient-to-t from-pink-900/30 via-purple-900/20 to-transparent p-8 rounded-3xl border border-white/5">
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-pink-600 via-rose-600 to-purple-700 flex items-center justify-center shadow-2xl flex-shrink-0">
          <Heart className="w-24 h-24 text-white fill-white drop-shadow-xl" />
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          <span className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">
            Kişisel Çalma Listesi
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">
            Beğenilen Şarkılar
          </h2>
          <p className="text-xs text-neutral-300">
            <span className="font-bold text-white">{userProfile.name}</span> • {likedTracks.length} şarkı • yaklaşık {totalMins} dakika
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handlePlayAll}
              disabled={likedTracks.length === 0}
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Tümünü Çal</span>
            </button>

            <button
              onClick={handleShufflePlay}
              disabled={likedTracks.length === 0}
              className="px-5 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-colors disabled:opacity-40"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Karışık Çal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search within Liked Tracks */}
      {likedTracks.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Beğenilenler içinde ara..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-pink-500"
            />
          </div>
          <span className="text-xs text-neutral-500">
            {filteredTracks.length} parça listeleniyor
          </span>
        </div>
      )}

      {/* Tracks Table */}
      {likedTracks.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-white/[0.02] rounded-3xl border border-white/5">
          <Heart className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="text-base font-semibold text-neutral-300">
            Henüz beğenilen şarkınız bulunmuyor
          </p>
          <p className="text-xs text-neutral-500">
            Şarkıların yanındaki kalp simgesine basarak buraya ekleyebilirsiniz
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <TrackList tracks={filteredTracks} />
        </div>
      )}
    </div>
  );
};
