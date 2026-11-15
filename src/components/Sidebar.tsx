import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  Flame, 
  Library, 
  Heart, 
  Plus, 
  Disc3, 
  Sparkles, 
  History, 
  Settings, 
  User,
  Music,
  DownloadCloud
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AppLogo } from './AppLogo';
import { UserAvatar } from './UserAvatar';

export const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
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
      <div className="p-5 flex items-center justify-between border-b border-white/5">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setActiveView('home')}
        >
          <AppLogo size="md" />
          <div className="min-w-0">
            <h1 className="font-extrabold text-base tracking-tight text-white truncate group-hover:text-emerald-400 transition-colors">
              {appSettings.appName}
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium tracking-wider uppercase truncate">
              {appSettings.audioQuality.split(' ')[0]} Sound Engine
            </p>
          </div>
        </div>

        {/* Quick Settings Icon */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Ayarlar & Temalar"
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="px-3 py-3 space-y-1">
        <button
          onClick={() => setActiveView('home')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
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
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
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
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
            activeView === 'recommendations'
              ? 'bg-violet-500/15 text-violet-300 shadow-sm border border-violet-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>Sana Özel</span>
          <span className="ml-auto text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full font-bold">
            AI
          </span>
        </button>

        <button
          onClick={() => setActiveView('charts')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
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
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            Kitaplığım
          </span>
          <button
            onClick={() => setShowNewModal(true)}
            title="Yeni Çalma Listesi Oluştur"
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Liked shortcut */}
        <button
          onClick={() => setActiveView('liked')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          <span className="text-[10px] text-neutral-500 group-hover:text-white">Düzenle</span>
        </div>
      </div>
    </aside>
  );
};
