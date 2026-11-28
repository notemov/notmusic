import React, { useEffect, useState } from 'react';
import { Flame, Play, Loader2 } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getCharts } from '../../services/api';
import { Track } from '../../types';
import { TrackList } from '../TrackList';

export const ChartsView: React.FC = () => {
  const { playTrack, activeSourceTab, setActiveSourceTab } = usePlayer();
  const [activeTab, setActiveTab] = useState<'tr' | 'global' | 'youtube'>(() => {
    if (activeSourceTab === 'apple') return 'global';
    if (activeSourceTab === 'youtube') return 'youtube';
    return 'tr';
  });
  const [charts, setCharts] = useState<{
    spotifyTurkeyTop: Track[];
    globalAppleTop: Track[];
    youtubeTrends: Track[];
  }>({ spotifyTurkeyTop: [], globalAppleTop: [], youtubeTrends: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeSourceTab === 'apple') setActiveTab('global');
    else if (activeSourceTab === 'spotify') setActiveTab('tr');
    else if (activeSourceTab === 'youtube') setActiveTab('youtube');
  }, [activeSourceTab]);

  useEffect(() => {
    getCharts().then((data) => {
      setCharts(data);
      setLoading(false);
    });
  }, []);

  const getCurrentList = () => {
    if (activeTab === 'tr') return charts.spotifyTurkeyTop;
    if (activeTab === 'global') return charts.globalAppleTop;
    return charts.youtubeTrends;
  };

  const currentList = getCurrentList();

  const handlePlayAll = () => {
    if (currentList.length > 0) {
      playTrack(currentList[0], currentList);
    }
  };

  const switchChartTab = (tab: 'tr' | 'global' | 'youtube') => {
    setActiveTab(tab);
    if (tab === 'tr') setActiveSourceTab('spotify');
    else if (tab === 'global') setActiveSourceTab('apple');
    else setActiveSourceTab('youtube');
  };

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 md:pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <Flame className="w-6 h-6 md:w-7 md:h-7 text-orange-400" />
            Top Trend Listeler
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Spotify, Apple Music ve YouTube'un en çok dinlenen resmi parçaları
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 md:gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
          <button
            onClick={() => switchChartTab('tr')}
            className={`px-3 md:px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'tr'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Spotify Türkiye Top 50
          </button>

          <button
            onClick={() => switchChartTab('global')}
            className={`px-3 md:px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'global'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Apple Music Dünya Zirvesi
          </button>

          <button
            onClick={() => switchChartTab('youtube')}
            className={`px-3 md:px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            YouTube Music Trendler
          </button>
        </div>
      </div>

      {/* Play all bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handlePlayAll}
          disabled={currentList.length === 0}
          className="px-5 md:px-6 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>Tümünü Sırayla Çal ({currentList.length})</span>
        </button>

        <span className="hidden sm:inline text-xs text-neutral-500">
          Her gün otomatik güncellenir
        </span>
      </div>

      {/* Track List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm">Listeler yükleniyor...</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 md:p-4">
          <TrackList tracks={currentList} />
        </div>
      )}
    </div>
  );
};
