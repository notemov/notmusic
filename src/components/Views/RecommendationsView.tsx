import React from 'react';
import { Sparkles, Play, RefreshCw, Compass, Heart } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { TrackCard } from '../TrackCard';
import { TrackList } from '../TrackList';

export const RecommendationsView: React.FC = () => {
  const { 
    recommendations, 
    refreshRecommendations, 
    playTrack, 
    userProfile, 
    historyItems, 
    likedTracks, 
    setActiveView 
  } = usePlayer();

  const handlePlayAll = () => {
    if (recommendations.length > 0) {
      playTrack(recommendations[0], recommendations);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-10 bg-gradient-to-r from-violet-900/60 via-purple-900/40 to-emerald-900/40 border border-white/10 shadow-2xl">
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              Yapay Zeka Müzik Öneri Algoritması
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Sana Özel Keşif Listesi
          </h2>

          <p className="text-sm text-neutral-300">
            {historyItems.length > 0
              ? `Son dinlediğin parçalar, favori sanatçıların ve ${userProfile.favoriteGenre} tarzın analiz edilerek özel olarak hazırlandı.`
              : `Henüz dinleme geçmişin az olduğu için favori türün (${userProfile.favoriteGenre}) baz alınarak oluşturuldu. Şarkı dinledikçe sana daha çok benzeyecek!`}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              disabled={recommendations.length === 0}
              className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Sana Özel Listeyi Başlat</span>
            </button>

            <button
              onClick={refreshRecommendations}
              className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs flex items-center gap-2 border border-white/10 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Yenile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-400" />
            Önerilen Parçalar ({recommendations.length})
          </h3>
          <span className="text-xs text-neutral-400">
            Zevkine Göre Kişiselleştirilmiş
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white/[0.02] rounded-3xl border border-white/5">
            <Sparkles className="w-10 h-10 text-neutral-600 mx-auto" />
            <p className="text-sm font-semibold text-neutral-300">
              Öneriler hazırlanıyor veya dinleme geçmişi taranıyor
            </p>
            <button
              onClick={() => setActiveView('home')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Ana sayfadaki parçaları keşfet →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.map((track) => (
              <TrackCard key={track.id} track={track} queueContext={recommendations} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
