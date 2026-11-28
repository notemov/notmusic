import React, { useState } from 'react';
import { 
  Heart, 
  History, 
  Disc3, 
  Play, 
  Plus, 
  Trash2, 
  FolderPlus,
  DownloadCloud
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { TrackList } from '../TrackList';

export const LibraryView: React.FC = () => {
  const { 
    likedTracks, 
    historyItems, 
    playlists, 
    openPlaylist, 
    createPlaylist, 
    playTrack,
    deletePlaylist,
    setActiveView
  } = usePlayer();
  const history = historyItems.map(h => h.track);
  const [activeTab, setActiveTab] = useState<'liked' | 'playlists' | 'history'>('liked');
  const [newPlName, setNewPlName] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    createPlaylist(newPlName.trim());
    setNewPlName('');
    setShowModal(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-5 md:pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Kitaplığım
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Beğendiğin parçalar, özel çalma listelerin ve dinleme geçmişin
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('liked')}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'liked'
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Beğenilenler ({likedTracks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'playlists'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Listelerim ({playlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Geçmiş ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveView('downloads')}
            className="flex items-center gap-2 px-3.5 md:px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500 hover:text-black border border-cyan-500/20"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>İndirilenler</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        <button
          onClick={() => setActiveTab('liked')}
          className={`text-left p-3.5 md:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'liked'
              ? 'bg-gradient-to-br from-pink-500/20 via-pink-500/5 to-transparent border-pink-500/30 shadow-lg shadow-pink-500/10'
              : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-4 h-4 md:w-5 md:h-5 text-pink-400 fill-pink-400/30" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-400/80 hidden sm:inline">Favoriler</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-white">{likedTracks.length}</p>
          <p className="text-[11px] text-neutral-400 truncate">Beğenilen Parça</p>
        </button>

        <button
          onClick={() => setActiveTab('playlists')}
          className={`text-left p-3.5 md:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'playlists'
              ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Disc3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 hidden sm:inline">Koleksiyon</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-white">{playlists.length}</p>
          <p className="text-[11px] text-neutral-400 truncate">Çalma Listesi</p>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`text-left p-3.5 md:p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-gradient-to-br from-violet-500/20 via-violet-500/5 to-transparent border-violet-500/30 shadow-lg shadow-violet-500/10'
              : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <History className="w-4 h-4 md:w-5 md:h-5 text-violet-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80 hidden sm:inline">Son Çalınan</span>
          </div>
          <p className="text-xl md:text-2xl font-black text-white">{history.length}</p>
          <p className="text-[11px] text-neutral-400 truncate">Dinlenen Parça</p>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'liked' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => likedTracks.length > 0 && playTrack(likedTracks[0], likedTracks)}
              disabled={likedTracks.length === 0}
              className="px-6 py-2.5 rounded-full bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Beğenilenleri Çal ({likedTracks.length})</span>
            </button>
          </div>

          {likedTracks.length === 0 ? (
            <div className="py-24 text-center space-y-2">
              <Heart className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="text-base font-semibold text-neutral-300">
                Henüz beğenilen şarkı yok
              </p>
              <p className="text-xs text-neutral-500">
                Şarkıların yanındaki kalp simgesine tıklayarak favorilerine ekleyebilirsin
              </p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 md:p-4">
              <TrackList tracks={likedTracks} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'playlists' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Oluşturulan Çalma Listeleri
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Liste Oluştur</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => openPlaylist(pl)}
                className="group bg-white/[0.03] hover:bg-white/[0.08] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 mb-3 shadow-md relative">
                  <img
                    src={pl.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'}
                    alt={pl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play className="w-10 h-10 text-white fill-white drop-shadow-lg" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-white truncate group-hover:text-emerald-400 transition-colors">
                    {pl.name}
                  </h4>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {pl.tracks.length} parça
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-500">Özel Liste</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${pl.name}" listesini silmek istediğine emin misin?`)) {
                        deletePlaylist(pl.id);
                      }
                    }}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                    title="Listeyi Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* New Playlist Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[#14141e] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-emerald-400" />
                  Yeni Çalma Listesi
                </h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <input
                    type="text"
                    autoFocus
                    value={newPlName}
                    onChange={(e) => setNewPlName(e.target.value)}
                    placeholder="Örn: Gece Yolculuğu, Spor Motivasyon..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl shadow-md transition-colors"
                    >
                      Oluştur
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="py-24 text-center space-y-2">
              <History className="w-12 h-12 text-neutral-600 mx-auto" />
              <p className="text-base font-semibold text-neutral-300">
                Henüz dinleme geçmişi yok
              </p>
              <p className="text-xs text-neutral-500">
                Şarkı çaldıkça burada listelenecektir
              </p>
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-2 md:p-4">
              <TrackList tracks={history} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
