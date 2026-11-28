import React, { useEffect, useState } from 'react';
import { 
  DownloadCloud, 
  Play, 
  Trash2, 
  WifiOff, 
  HardDrive, 
  Sparkles, 
  CheckCircle,
  FileDown
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getOfflineTracks, deleteOfflineTrack, getOfflineAudioUrl } from '../../services/offlineStorage';
import { Track } from '../../types';

export const DownloadsView: React.FC = () => {
  const { playTrack, currentTrack } = usePlayer();
  const [offlineList, setOfflineList] = useState<{ track: Track; downloadedAt: string; sizeBytes: number; audioUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    getOfflineTracks().then((data) => {
      setOfflineList(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalBytes = offlineList.reduce((acc, item) => acc + item.sizeBytes, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const tracks = offlineList.map(item => item.track);

  const handlePlayOffline = async (item: { track: Track; audioUrl?: string }) => {
    const audioUrl = item.audioUrl || (await getOfflineAudioUrl(item.track.id));
    if (audioUrl) {
      playTrack({ ...item.track, previewUrl: audioUrl }, tracks);
    } else {
      playTrack(item.track, tracks);
    }
  };

  const handleDelete = async (trackId: string, title: string) => {
    if (confirm(`"${title}" parçasını çevrim dışı kütüphanenizden silmek istediğinize emin misiniz?`)) {
      await deleteOfflineTrack(trackId);
      loadData();
    }
  };

  const handleExportFile = (item: { track: Track; audioUrl?: string }) => {
    const audioUrl = item.audioUrl || `/api/download-file/${item.track.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${item.track.artist} - ${item.track.title}.mp3`;
    a.click();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto pb-32">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-5 md:p-10 bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-cyan-900/40 border border-white/10 shadow-2xl">
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              Çevrim Dışı Dinleme Modu
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            İndirilen Şarkılar
          </h2>

          <p className="text-sm text-neutral-300">
            İnternetiniz olmasa bile cihazınıza kaydettiğiniz parçaları kesintisiz, yüksek kalitede dinleyebilirsiniz.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => tracks.length > 0 && handlePlayOffline(offlineList[0])}
              disabled={tracks.length === 0}
              className="px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center gap-2 shadow-xl shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Çevrim Dışı Tümünü Çal ({tracks.length})</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kaplanan Alan: {totalMB} MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <DownloadCloud className="w-5 h-5 text-cyan-400" />
            İndirilen Parçalar ({offlineList.length})
          </h3>
          <span className="text-xs text-neutral-400">
            Yerel Disk Hafızasında Güvende
          </span>
        </div>

        {offlineList.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-white/[0.02] rounded-3xl border border-white/5">
            <DownloadCloud className="w-12 h-12 text-neutral-600 mx-auto" />
            <p className="text-base font-semibold text-neutral-300">
              Henüz indirilmiş şarkınız yok
            </p>
            <p className="text-xs text-neutral-500">
              Herhangi bir şarkı kartındaki indirme butonuna (⬇️) basarak çevrim dışı kütüphanenize ekleyebilirsiniz
            </p>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 md:p-4">
            <div className="grid grid-cols-[1.75rem_1fr_auto] md:grid-cols-[3rem_1fr_1fr_6rem_8rem] gap-2 md:gap-0 px-2.5 md:px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/5 select-none">
              <span>#</span>
              <span>Şarkı</span>
              <span className="hidden md:block">Albüm</span>
              <span className="hidden md:block">Boyut</span>
              <span className="text-right pr-1 md:pr-2">İşlem</span>
            </div>

            <div className="divide-y divide-white/[0.02]">
              {offlineList.map((item, idx) => {
                const isCurrent = currentTrack?.id === item.track.id;
                const sizeMB = (item.sizeBytes / (1024 * 1024)).toFixed(1);

                return (
                  <div
                    key={item.track.id}
                    onClick={() => handlePlayOffline(item)}
                    className={`group grid grid-cols-[1.75rem_1fr_auto] md:grid-cols-[3rem_1fr_1fr_6rem_8rem] gap-2 md:gap-0 items-center px-2.5 md:px-4 py-2.5 rounded-xl text-sm transition-all duration-150 cursor-pointer ${
                      isCurrent
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'hover:bg-white/[0.05] text-neutral-300'
                    }`}
                  >
                    <span className="text-neutral-500 font-mono text-xs w-6 text-center">
                      {idx + 1}
                    </span>

                    <div className="flex items-center gap-2.5 md:gap-3 min-w-0 pr-2 md:pr-4">
                      <img
                        src={item.track.coverUrl}
                        alt={item.track.title}
                        className="w-10 h-10 rounded-lg object-cover bg-neutral-900 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold truncate ${isCurrent ? 'text-cyan-400' : 'text-white'}`}>
                          {item.track.title}
                        </p>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs text-neutral-400 truncate">
                            {item.track.artist}
                          </p>
                          <span className="md:hidden text-[10px] text-cyan-400/80 font-mono shrink-0">
                            • {sizeMB} MB
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="hidden md:block text-xs text-neutral-400 truncate pr-4">
                      {item.track.album || '-'}
                    </span>

                    <span className="hidden md:block text-xs text-neutral-400 font-mono">
                      {sizeMB} MB
                    </span>

                    <div className="flex items-center justify-end gap-1.5 md:gap-2 text-xs shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportFile(item);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors"
                        title="Dosyayı Dışa Aktar / MP3 İndir"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.track.id, item.track.title);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                        title="İndirilenlerden Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
