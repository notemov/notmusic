import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  Flame, 
  Heart, 
  Plus, 
  Disc3, 
  Sparkles, 
  History, 
  Settings, 
  DownloadCloud
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AppLogo } from './AppLogo';
import { UserAvatar } from './UserAvatar';

export const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    setSearchQuery,
    likedTracks, 
    playlists, 
    openPlaylist, 
    createPlaylist,
    appSettings,
    userProfile,
    setIsSettingsOpen,
    setIsProfileOpen,
  } = usePlayer();

  const [showNewModal, setShowNewModal] = useState(false);
  const [newPlName, setNewPlName] = useState('');

  const handleGoHome = () => {
    setActiveView('home');
    setSearchQuery('');
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    createPlaylist(newPlName.trim());
    setNewPlName('');
    setShowNewModal(false);
  };

  return (
    <aside className="w-64 bg-[#0f0f15]/95 border-r border-white/5 flex flex-col h-full select-none z-20 transition-colors">
      {/* Dynamic Brand Header */}
      <div 
        onClick={handleGoHome}
        title="Ana Sayfaya Dön"
        className="p-4 px-5 flex items-center justify-between border-b border-white/5 cursor-pointer hover:bg-white/[0.04] active:scale-[0.99] transition-all group select-none"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <AppLogo size="md" />
          <div className="min-w-0">
            <h1 className="font-black text-2xl tracking-tight leading-none text-white group-hover:text-emerald-400 transition-colors truncate">
              {appSettings.appName}
            </h1>
            <p className="text-[11px] text-neutral-400 font-bold tracking-wider uppercase mt-1 truncate">
              KAYIPSIZ SOUND ENGINE
            </p>
          </div>
        </div>

        {/* Quick Settings Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSettingsOpen(true);
          }}
          title="Ayarlar & Özelleştirme"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-3 space-y-1">
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
            activeView === 'home'
              ? 'bg-emerald-500/15 text-emerald-400 shadow-sm border border-emerald-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Ana Sayfa</span>
        </button>

        <button
          onClick={() => setActiveView('search')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
            activeView === 'search'
              ? 'bg-emerald-500/15 text-emerald-400 shadow-sm border border-emerald-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Arama & Keşfet</span>
        </button>

        <button
          onClick={() => setActiveView('recommendations')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
            activeView === 'recommendations'
              ? 'bg-violet-500/15 text-violet-300 shadow-sm border border-violet-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>Sana Özel</span>
        </button>

        <button
          onClick={() => setActiveView('charts')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
            activeView === 'charts'
              ? 'bg-orange-500/15 text-orange-400 shadow-sm border border-orange-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span>Top Listeler</span>
        </button>
      </div>

      {/* Library & Playlists Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 border-t border-white/5">
        <div className="flex items-center justify-between px-2 pt-1">
          <button
            onClick={() => setActiveView('library')}
            className="text-[11px] font-semibold text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            Kitaplığım
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            title="Yeni Çalma Listesi Oluştur"
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Liked shortcut */}
        <button
          onClick={() => setActiveView('liked')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeView === 'liked'
              ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white">
            <Heart className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="truncate flex-1 text-left">Beğenilen Şarkılar</span>
          <span className="text-[10px] text-neutral-400">{likedTracks.length}</span>
        </button>

        {/* Downloads / Offline Mode shortcut */}
        <button
          onClick={() => setActiveView('downloads')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeView === 'downloads'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white">
            <DownloadCloud className="w-3.5 h-3.5" />
          </div>
          <span className="truncate flex-1 text-left">İndirilenler & Çevrim Dışı</span>
        </button>

        {/* History shortcut */}
        <button
          onClick={() => setActiveView('history')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeView === 'history'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'text-neutral-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-neutral-300">
            <History className="w-3.5 h-3.5" />
          </div>
          <span className="truncate flex-1 text-left">Dinleme Geçmişi</span>
        </button>

        {/* Playlist items */}
        <div className="pt-2 space-y-1">
          {playlists.map(pl => (
            <div
              key={pl.id}
              onClick={() => openPlaylist(pl)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer transition-colors group"
            >
              <Disc3 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              <span className="truncate flex-1">{pl.name}</span>
              <span className="text-[10px] text-neutral-400">
                {pl.tracks.length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* New Playlist Modal Form */}
      {showNewModal && (
        <div className="p-3 border-t border-white/5 bg-[#14141e]">
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              type="text"
              autoFocus
              value={newPlName}
              onChange={e => setNewPlName(e.target.value)}
              placeholder="Liste adı girin..."
              className="w-full text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 text-[11px] font-semibold py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-colors"
              >
                Oluştur
              </button>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-2 py-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-white/5 bg-[#0a0a10]/60">
        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
        >
          <UserAvatar size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
              {userProfile.name}
            </p>
            <p className="text-[10px] text-neutral-400 truncate">
              {userProfile.favoriteGenre}
            </p>
          </div>
          <span className="text-[10px] text-neutral-500 group-hover:text-white">Profil</span>
        </div>
      </div>
    </aside>
  );
};
