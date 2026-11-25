import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Flame, 
  Sparkles, 
  Loader2,
  Compass,
  ArrowRight
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getCharts } from '../../services/api';
import { Track } from '../../types';
import { TrackCard } from '../TrackCard';

export const HomeView: React.FC = () => {
  const { 
    playTrack, 
    setSearchQuery, 
    setActiveView, 
    recommendations, 
    userProfile, 
    historyItems,
    activeSourceTab
  } = usePlayer();

  const [charts, setCharts] = useState<{
    spotifyTurkeyTop: Track[];
    globalAppleTop: Track[];
    youtubeTrends: Track[];
  }>({ spotifyTurkeyTop: [], globalAppleTop: [], youtubeTrends: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCharts().then((data) => {
      setCharts(data);
      setLoading(false);
    });
  }, []);

  const genres = [
    { name: 'Türkçe Pop', query: 'türkçe pop hits', color: 'from-pink-600 to-rose-700' },
    { name: 'Hip-Hop & Rap', query: 'türkçe rap 2026', color: 'from-amber-600 to-orange-700' },
    { name: 'Global Top Hits', query: 'billboard hot 100', color: 'from-emerald-600 to-teal-700' },
    { name: 'Lo-Fi Chill & Focus', query: 'lofi hip hop radio', color: 'from-violet-600 to-indigo-700' },
    { name: 'Rock Klasikleri', query: 'classic rock hits', color: 'from-red-600 to-rose-800' },
    { name: 'Elektronik & Dance', query: 'edm electronic hits', color: 'from-cyan-600 to-blue-700' },
  ];

  const defaultHero: Track = {
    id: 'yt_chart_1',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
    duration: '4:11',
    durationSec: 251,
    source: 'youtube',
    youtubeId: 'kPa7bsKwL-8',
  };

  // Pick hero track and queue strictly matching the selected platform tab
  let heroTrack: Track = charts.youtubeTrends[0] || charts.globalAppleTop[0] || defaultHero;
  let heroQueue: Track[] = charts.youtubeTrends;
  let heroBadge = 'Günün Global Hiti';

  if (activeSourceTab === 'apple') {
    heroTrack = charts.globalAppleTop[0] || charts.spotifyTurkeyTop[0] || defaultHero;
    heroQueue = charts.globalAppleTop;
    heroBadge = 'Apple Music Zirvesi';
  } else if (activeSourceTab === 'spotify') {
    heroTrack = charts.spotifyTurkeyTop[0] || charts.globalAppleTop[0] || defaultHero;
    heroQueue = charts.spotifyTurkeyTop;
    heroBadge = 'Spotify Türkiye Zirvesi';
  } else if (activeSourceTab === 'youtube') {
    heroTrack = charts.youtubeTrends[0] || defaultHero;
    heroQueue = charts.youtubeTrends;
    heroBadge = 'YouTube Music Trendi';
  }

  const filteredRecommendations =
    activeSourceTab === 'all'
      ? recommendations
      : recommendations.filter((t) => t.source === activeSourceTab);

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto pb-32">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white">
            İyi günler, {userProfile.name}!
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {activeSourceTab === 'apple'
              ? 'Apple Music dünya listeleri ve parçaları gösteriliyor.'
              : activeSourceTab === 'spotify'
              ? 'Spotify Türkiye listeleri ve parçaları gösteriliyor.'
              : activeSourceTab === 'youtube'
              ? 'YouTube Music viral klipleri (video destekli) gösteriliyor.'
              : 'Spotify, Apple Music ve YouTube içerikleri senin için hazırlandı.'}
          </p>
        </div>

        <button
          onClick={() => setActiveView('recommendations')}
          className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Sana Özel Önerilere Git →</span>
        </button>
      </div>

      {/* Hero Banner */}
      {heroTrack && (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
          <div
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-40 scale-125 transform"
            style={{ backgroundImage: `url(${heroTrack.coverUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c14] via-[#0c0c14]/80 to-transparent" />

          <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  {heroBadge}
                </span>
                <span className="text-xs text-neutral-400 uppercase font-semibold">
                  {heroTrack.source === 'apple'
                    ? 'Apple Music'
                    : heroTrack.source === 'spotify'
                    ? 'Spotify'
                    : 'YouTube Music'}
                </span>
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {heroTrack.title}
              </h2>
              <p className="text-lg md:text-xl text-neutral-300 font-medium">
                {heroTrack.artist}
              </p>
              <p className="text-sm text-neutral-400 line-clamp-2">
                Listelerin zirvesindeki parça, yüksek ses kalitesi ve canlı şarkı sözleriyle hemen dinlemeye hazır.
              </p>

              <div className="pt-2 flex items-center gap-4">
                <button
                  onClick={() => playTrack(heroTrack, heroQueue)}
                  className="px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2.5 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-black" />
                  <span>Şimdi Dinle</span>
                </button>
              </div>
            </div>

            <div className="w-56 h-56 md:w-72 md:h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/20 group-hover:scale-105 transition-transform duration-500 flex-shrink-0 bg-neutral-900">
              <img
                src={heroTrack.coverUrl}
                alt={heroTrack.title}
                onError={(e) => {
                  e.currentTarget.src = 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg';
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION: Sana Özel Öneriler */}
      {filteredRecommendations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                Dinleme Zevkine Göre: Sana Özel Seçimler
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {historyItems.length > 0 
                  ? 'Dinlediğin sanatçılar ve beğendiğin şarkılardan ilham alındı'
                  : `Seçtiğin favori türün (${userProfile.favoriteGenre}) en iyileri`}
              </p>
            </div>

            <button
              onClick={() => setActiveView('recommendations')}
              className="text-xs font-semibold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredRecommendations.slice(0, 6).map((track) => (
              <TrackCard key={track.id} track={track} queueContext={filteredRecommendations} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Genre Explorers */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-yellow-400" />
          Türler ve Ruh Halleri
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {genres.map((g, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSearchQuery(g.query);
                setActiveView('search');
              }}
              className={`p-4 rounded-2xl bg-gradient-to-br ${g.color} shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 flex flex-col justify-between h-24`}
            >
              <span className="font-bold text-sm text-white drop-shadow">
                {g.name}
              </span>
              <span className="text-[10px] text-white/80 font-medium self-end">
                Keşfet →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-sm">Listeler yükleniyor...</p>
        </div>
      ) : (
        <>
          {/* Section 1: YouTube Music Viral Trends */}
          {(activeSourceTab === 'all' || activeSourceTab === 'youtube') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    YouTube Music Viral Trendler
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Tam video ve yüksek kaliteli ses akışı (Klip / Video izleme destekli)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {charts.youtubeTrends.slice(0, activeSourceTab === 'youtube' ? 12 : 6).map((track) => (
                  <TrackCard key={track.id} track={track} queueContext={charts.youtubeTrends} />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Spotify Türkiye Top 50 */}
          {(activeSourceTab === 'all' || activeSourceTab === 'spotify') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    Spotify Türkiye Zirvedekiler
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Türkiye'de bugün en çok çalınan parçalar (Yalnızca ses akışı)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {charts.spotifyTurkeyTop.slice(0, activeSourceTab === 'spotify' ? 24 : 12).map((track) => (
                  <TrackCard key={track.id} track={track} queueContext={charts.spotifyTurkeyTop} />
                ))}
              </div>
            </section>
          )}

          {/* Section 3: Apple Music Global Top */}
          {(activeSourceTab === 'all' || activeSourceTab === 'apple') && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                    Apple Music Dünya Listeleri
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Global listelerin en popüler parçaları ve albümleri (Yalnızca ses akışı)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {charts.globalAppleTop.slice(0, activeSourceTab === 'apple' ? 24 : 12).map((track) => (
                  <TrackCard key={track.id} track={track} queueContext={charts.globalAppleTop} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
