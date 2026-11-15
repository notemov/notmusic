import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Mic2, 
  Activity, 
  Tv, 
  Settings, 
  Palette, 
  Clock, 
  User 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { getSuggestions } from '../services/api';
import { UserAvatar } from './UserAvatar';

export const Navbar: React.FC = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    activeView, 
    setActiveView,
    activeSourceTab,
    setActiveSourceTab,
    isLyricsOpen,
    setIsLyricsOpen,
    isVisualizerOpen,
    setIsVisualizerOpen,
    isVideoOpen,
    setIsVideoOpen,
    setIsSettingsOpen,
    setIsProfileOpen,
    userProfile,
    appSettings,
    updateSettings,
    sleepTimerRemaining
  } = usePlayer();

  const [inputVal, setInputVal] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (!inputVal.trim() || inputVal.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const list = await getSuggestions(inputVal);
      setSuggestions(list);
    }, 200);

    return () => clearTimeout(timer);
  }, [inputVal]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (val: string) => {
    const q = val.trim();
    if (!q) return;
    setSearchQuery(q);
    setActiveView('search');
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(inputVal);
    }
  };

  const cycleTheme = () => {
    const themes = ['dark', 'light', 'cyberpunk', 'spotify', 'apple', 'ocean'] as const;
    const currentIdx = themes.indexOf(appSettings.theme);
    const nextTheme = themes[(currentIdx + 1) % themes.length];
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="h-16 px-6 bg-[#0c0c12]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between gap-4 z-10 select-none">
      {/* Search Input Bar with autocomplete */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative flex-1" ref={dropdownRef}>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={e => {
                setInputVal(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleKeyDown}
              placeholder="Şarkı, sanatçı, albüm veya YouTube videosu ara..."
              className="w-full bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] text-sm text-white placeholder-neutral-400 pl-10 pr-9 py-2 rounded-full border border-white/10 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
            />
            {inputVal && (
              <button
                onClick={() => {
                  setInputVal('');
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                className="absolute right-3 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 py-2 glass-dropdown rounded-2xl shadow-2xl z-50">
              <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Önerilen Aramalar
              </div>
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setInputVal(item);
                    handleSearchSubmit(item);
                  }}
                  className="px-4 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer flex items-center gap-2.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform Tabs Filter */}
      <div className="hidden lg:flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/5">
        <button
          onClick={() => setActiveSourceTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeSourceTab === 'all'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Tümü (All)
        </button>
        <button
          onClick={() => setActiveSourceTab('spotify')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeSourceTab === 'spotify'
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
              : 'text-neutral-400 hover:text-emerald-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Spotify
        </button>
        <button
          onClick={() => setActiveSourceTab('apple')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeSourceTab === 'apple'
              ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
              : 'text-neutral-400 hover:text-pink-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
          Apple Music
        </button>
        <button
          onClick={() => setActiveSourceTab('youtube')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 ${
            activeSourceTab === 'youtube'
              ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
              : 'text-neutral-400 hover:text-red-400'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          YouTube Music
        </button>
      </div>

      {/* Feature Toggles, Sleep Timer, Profile */}
      <div className="flex items-center gap-2">
        {/* Sleep Timer Indicator if active */}
        {sleepTimerRemaining !== null && (
          <div
            onClick={() => setIsSettingsOpen(true)}
            title="Uyku Zamanlayıcısı Aktif"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-pointer animate-pulse"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{Math.ceil(sleepTimerRemaining / 60)} dk</span>
          </div>
        )}

        {/* Lyrics Toggle */}
        <button
          onClick={() => setIsLyricsOpen(!isLyricsOpen)}
          title="Şarkı Sözleri (L)"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isLyricsOpen
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
              : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white hover:bg-white/10'
          }`}
        >
          <Mic2 className="w-3.5 h-3.5" />
          <span>Sözler</span>
        </button>

        {/* Visualizer Toggle */}
        <button
          onClick={() => setIsVisualizerOpen(!isVisualizerOpen)}
          title="Ses Spektrum Görselleştirici (V)"
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isVisualizerOpen
              ? 'bg-violet-500/20 text-violet-400 border-violet-500/40 shadow-sm'
              : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white hover:bg-white/10'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Spektrum</span>
        </button>

        {/* Video Mode Toggle */}
        <button
          onClick={() => setIsVideoOpen(!isVideoOpen)}
          title="Klip / Video Modu"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isVideoOpen
              ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm'
              : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white hover:bg-white/10'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Video</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Ayarlar & Temalar"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-colors"
        >
          <UserAvatar size="sm" />
          <span className="text-xs font-bold text-white max-w-[90px] truncate">
            {userProfile.name}
          </span>
        </div>
      </div>
    </header>
  );
};
