import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Player } from './components/Player';
import { QueueDrawer } from './components/QueueDrawer';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { LyricsView } from './components/LyricsView';
import { Visualizer } from './components/Visualizer';
import { HomeView } from './components/Views/HomeView';
import { SearchView } from './components/Views/SearchView';
import { ChartsView } from './components/Views/ChartsView';
import { LibraryView } from './components/Views/LibraryView';
import { PlaylistDetailView } from './components/Views/PlaylistDetailView';
import { RecommendationsView } from './components/Views/RecommendationsView';
import { LikedSongsView } from './components/Views/LikedSongsView';
import { HistoryView } from './components/Views/HistoryView';
import { DownloadsView } from './components/Views/DownloadsView';

const MainApp: React.FC = () => {
  const { 
    activeView, 
    toast,
    togglePlay, 
    toggleMute, 
    seekTo, 
    currentTime, 
    duration,
    setIsSettingsOpen,
    setIsProfileOpen,
    setIsQueueOpen,
    setIsVideoOpen,
    setIsLyricsOpen,
    setIsVisualizerOpen,
    playNext,
    playPrevious
  } = usePlayer();

  // Global Keyboard Shortcuts (Space: Play/Pause, M: Mute, Left/Right: Seek 5s, Esc: Close Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsProfileOpen(false);
        setIsQueueOpen(false);
        setIsVideoOpen(false);
        setIsLyricsOpen(false);
        setIsVisualizerOpen(false);
        return;
      }

      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo(Math.min(duration || 100, currentTime + 5));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo(Math.max(0, currentTime - 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, seekTo, currentTime, duration, setIsSettingsOpen, setIsProfileOpen, setIsQueueOpen, setIsVideoOpen, setIsLyricsOpen, setIsVisualizerOpen]);

  // Electron IPC Media Key Listeners
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api && typeof api.on === 'function') {
      const unsub1 = api.on('media:togglePlay', () => togglePlay());
      const unsub2 = api.on('media:playNext', () => playNext());
      const unsub3 = api.on('media:playPrevious', () => playPrevious());
      return () => {
        if (typeof unsub1 === 'function') unsub1();
        if (typeof unsub2 === 'function') unsub2();
        if (typeof unsub3 === 'function') unsub3();
      };
    }
  }, [togglePlay, playNext, playPrevious]);

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'search':
        return <SearchView />;
      case 'charts':
        return <ChartsView />;
      case 'recommendations':
        return <RecommendationsView />;
      case 'liked':
        return <LikedSongsView />;
      case 'downloads':
        return <DownloadsView />;
      case 'history':
        return <HistoryView />;
      case 'library':
      case 'playlists':
        return <LibraryView />;
      case 'playlist':
        return <PlaylistDetailView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-base)]">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Content View with smooth scroll */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          {renderView()}
        </main>

        {/* Functional Overlays, Modals & Drawers */}
        <LyricsView />
        <Visualizer />
        <QueueDrawer />
        <ProfileModal />
        <SettingsModal />

        {/* Floating Animated Toast Notification */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-emerald-500/95 text-black font-extrabold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 border border-emerald-400/40 pointer-events-none transition-all duration-300">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>{toast}</span>
          </div>
        )}

        {/* Bottom Unified Player */}
        <Player />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PlayerProvider>
      <MainApp />
    </PlayerProvider>
  );
};

export default App;
