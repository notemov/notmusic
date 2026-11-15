import React, { useEffect, useState } from 'react';
import { Search, Loader2, LayoutGrid, List, Sparkles } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { searchTracks } from '../../services/api';
import { Track } from '../../types';
import { TrackCard } from '../TrackCard';
import { TrackList } from '../TrackList';

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery, activeSourceTab, setActiveSourceTab } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setTracks([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    searchTracks(searchQuery, activeSourceTab).then((results) => {
      if (!isMounted) return;
      setTracks(results);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, activeSourceTab]);

  const quickSearches = [
    'The Weeknd', 'Tarkan', 'Billie Eilish', 'Ezhel', 'Taylor Swift', 
    'Coldplay', 'Mabel Matiz', 'Daft Punk', 'Eminem', 'Hans Zimmer'
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-32">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Search className="w-6 h-6 text-emerald-400" />
            {searchQuery ? `"${searchQuery}" için Sonuçlar` : 'Müzik ve İçerik Ara'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Spotify, Apple Music ve YouTube kütüphanelerinde eşzamanlı arama
          </p>
        </div>

        {/* View mode toggle (Grid vs List) */}
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
              title="Izgara Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
              }`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm">Platformlar taranıyor...</p>
        </div>
      ) : tracks.length > 0 ? (
        <div>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tracks.map((track) => (
                <TrackCard key={track.id} track={track} queueContext={tracks} />
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <TrackList tracks={tracks} />
            </div>
          )}
        </div>
      ) : searchQuery ? (
        <div className="py-24 text-center space-y-2">
          <p className="text-lg font-semibold text-neutral-300">
            "{searchQuery}" için eşleşen parça bulunamadı
          </p>
          <p className="text-xs text-neutral-500">
            Farklı bir sanatçı veya şarkı adı deneyebilirsiniz
          </p>
        </div>
      ) : (
        /* Empty search recommendation cards */
        <div className="space-y-6 pt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Popüler Arama Önerileri</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {quickSearches.map((term, idx) => (
              <button
                key={idx}
                onClick={() => setSearchQuery(term)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 text-xs font-medium text-neutral-300 hover:text-white transition-all duration-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
