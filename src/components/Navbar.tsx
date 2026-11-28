import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  X, 
  Tv, 
  Settings, 
  Clock
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
    currentTrack,
    isVideoOpen,
    setIsVideoOpen,
    setIsSettingsOpen,
    setIsProfileOpen,
    userProfile,
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

  const handleSourceSwitch = (tab: 'all' | 'spotify' | 'apple' | 'youtube') => {
    setActiveSourceTab(tab);
    // Platform sekmeleri tıklandığında ilgili içeriği hemen görmek için Home/Search/Charts görünümüne geç
    if (activeView !== 'home' && activeView !== 'search' && activeView !== 'charts') {
      setActiveView(searchQuery.trim() ? 'search' : 'home');
    }
  };

  // Video modu YALNIZCA YouTube sekmesinde görünür olsun
  const canShowNavbarVideo = activeSourceTab === 'youtube';

  return (
    <div className="shrink-0 bg-[#0c0c12]/90 backdrop-blur-xl border-b border-white/5 z-20 select-none pt-[env(safe-area-inset-top)]">
    <header className="h-14 md:h-16 px-3 md:px-6 flex items-center justify-between gap-2 md:gap-4">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2 md:gap-3 flex-1 max-w-md min-w-0">
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
              placeholder="Şarkı, sanatçı veya albüm ara..."
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
            <div className="absolute top-full left-0 right-0 mt-2 py-2 bg-[#12121a] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-3xl">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-white/5">
                Önerilen Aramalar
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {suggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setInputVal(item);
                      handleSearchSubmit(item);
                    }}
                    className="px-4 py-2.5 text-sm text-neutral-200 hover:text-white hover:bg-emerald-500/15 cursor-pointer flex items-center gap-2.5 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Platform Tabs Filter */}
      <div className="hidden lg:flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/5">
        <button
          onClick={() => handleSourceSwitch('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
            activeSourceTab === 'all'
              ? 'bg-white text-black shadow-md'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => handleSourceSwitch('spotify')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeSourceTab === 'spotify'
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
              : 'text-neutral-400 hover:text-emerald-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeSourceTab === 'spotify' ? 'bg-black' : 'bg-emerald-400'}`}></span>
          Spotify
        </button>
        <button
          onClick={() => handleSourceSwitch('apple')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeSourceTab === 'apple'
              ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
              : 'text-neutral-400 hover:text-pink-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeSourceTab === 'apple' ? 'bg-white' : 'bg-pink-400'}`}></span>
          Apple Music
        </button>
        <button
          onClick={() => handleSourceSwitch('youtube')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeSourceTab === 'youtube'
              ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
              : 'text-neutral-400 hover:text-red-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${activeSourceTab === 'youtube' ? 'bg-white' : 'bg-red-400'}`}></span>
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

        {/* Video Mode Toggle - Strictly only shown on YouTube Music tab */}
        {canShowNavbarVideo && (
          <button
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            title={
              currentTrack?.source === 'youtube'
                ? 'Klip / Video Modu'
                : 'Video izlemek için bir YouTube parçası başlatın'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isVideoOpen
                ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-sm'
                : 'bg-white/5 text-neutral-300 border-white/10 hover:text-white hover:bg-white/10'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-red-400" />
            <span>Video</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Ayarlar"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => setIsProfileOpen(true)}
          className="flex items-center gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors shrink-0"
          title={`Profil: ${userProfile.name}`}
        >
          <UserAvatar size="sm" />
          <span className="hidden sm:inline text-xs font-bold text-white max-w-[100px] truncate">
            {userProfile.name}
          </span>
        </div>
      </div>
    </header>

    {/* Mobile Platform Tabs Filter */}
    <div className="lg:hidden px-3 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
      <button
        onClick={() => handleSourceSwitch('all')}
        className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all cursor-pointer ${
          activeSourceTab === 'all'
            ? 'bg-white text-black shadow-sm'
            : 'bg-white/[0.04] text-neutral-400 hover:text-white'
        }`}
      >
        Tümü
      </button>
      <button
        onClick={() => handleSourceSwitch('spotify')}
        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
          activeSourceTab === 'spotify'
            ? 'bg-emerald-500 text-black shadow-sm'
            : 'bg-white/[0.04] text-neutral-400 hover:text-emerald-400'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${activeSourceTab === 'spotify' ? 'bg-black' : 'bg-emerald-400'}`}></span>
        Spotify
      </button>
      <button
        onClick={() => handleSourceSwitch('apple')}
        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
          activeSourceTab === 'apple'
            ? 'bg-pink-500 text-white shadow-sm'
            : 'bg-white/[0.04] text-neutral-400 hover:text-pink-400'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${activeSourceTab === 'apple' ? 'bg-white' : 'bg-pink-400'}`}></span>
        Apple Music
      </button>
      <button
        onClick={() => handleSourceSwitch('youtube')}
        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
          activeSourceTab === 'youtube'
            ? 'bg-red-500 text-white shadow-sm'
            : 'bg-white/[0.04] text-neutral-400 hover:text-red-400'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${activeSourceTab === 'youtube' ? 'bg-white' : 'bg-red-400'}`}></span>
        YouTube Music
      </button>
    </div>
    </div>
  );
};
