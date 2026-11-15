import React from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Player } from './components/Player';
import { LyricsView } from './components/LyricsView';
import { Visualizer } from './components/Visualizer';
import { QueueDrawer } from './components/QueueDrawer';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
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
  const { activeView } = usePlayer();

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

        {/* Overlay Modals & Drawers */}
        <LyricsView />
        <Visualizer />
        <QueueDrawer />
        <ProfileModal />
        <SettingsModal />

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
