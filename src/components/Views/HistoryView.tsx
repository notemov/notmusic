import React from 'react';
import { History, Play, Trash2, Clock, Music } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';

export const HistoryView: React.FC = () => {
  const { historyItems, clearHistory, playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const formatPlayedAt = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dakika önce`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} saat önce`;
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Yakın zamanda';
    }
  };

  const tracks = historyItems.map(h => h.track);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-400" />
            Dinleme Geçmişi
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Daha önce çaldığınız tüm parçalar ve zaman damgaları
          </p>
        </div>

        {historyItems.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => playTrack(tracks[0], tracks)}
              className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-md transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Geçmişi Sırayla Çal</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Dinleme geçmişinizi temizlemek istediğinize emin misiniz?')) {
                  clearHistory();
                }
              }}
              className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-neutral-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Geçmişi Temizle</span>
            </button>
          </div>
        )}
      </div>

      {/* History List */}
      {historyItems.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-white/[0.02] rounded-3xl border border-white/5">
          <History className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="text-base font-semibold text-neutral-300">
            Henüz dinleme geçmişiniz bulunmuyor
          </p>
          <p className="text-xs text-neutral-500">
            Şarkı dinledikçe dinlediğiniz zamanla birlikte burada saklanacaktır
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <div className="grid grid-cols-[3rem_1fr_1fr_10rem_4rem] px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/5 select-none">
            <span>#</span>
            <span>Şarkı</span>
            <span>Albüm</span>
            <span>Dinleme Zamanı</span>
            <span className="text-right">Süre</span>
          </div>

          <div className="divide-y divide-white/[0.02]">
            {historyItems.map((item, idx) => {
              const isCurrent = currentTrack?.id === item.track.id;

              return (
                <div
                  key={item.id}
                  onClick={() => playTrack(item.track, tracks)}
                  className={`group grid grid-cols-[3rem_1fr_1fr_10rem_4rem] items-center px-4 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'hover:bg-white/[0.05] text-neutral-300'
                  }`}
                >
                  <span className="text-neutral-500 font-mono text-xs w-6 text-center">
                    {idx + 1}
                  </span>

                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <img
                      src={item.track.coverUrl}
                      alt={item.track.title}
                      className="w-10 h-10 rounded-lg object-cover bg-neutral-900 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold truncate ${isCurrent ? 'text-emerald-400' : 'text-white'}`}>
                        {item.track.title}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {item.track.artist}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-neutral-400 truncate pr-4">
                    {item.track.album || '-'}
                  </span>

                  <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    {formatPlayedAt(item.playedAt)}
                  </span>

                  <span className="text-xs font-mono text-neutral-500 text-right">
                    {item.track.duration || '3:30'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
