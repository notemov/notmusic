import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Track, 
  Playlist, 
  ViewType, 
  UserProfile, 
  AppSettings, 
  HistoryItem, 
  ThemeType 
} from '../types';
import { resolveYouTubeId, getPersonalizedRecommendations } from '../services/api';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  queueIndex: number;
  historyItems: HistoryItem[];
  likedTracks: Track[];
  playlists: Playlist[];
  activeView: ViewType;
  searchQuery: string;
  selectedPlaylist: Playlist | null;
  isLyricsOpen: boolean;
  isVisualizerOpen: boolean;
  isQueueOpen: boolean;
  isVideoOpen: boolean;
  isSettingsOpen: boolean;
  isProfileOpen: boolean;
  activeSourceTab: 'all' | 'spotify' | 'apple' | 'youtube';
  currentYoutubeId: string | null;
  isLoadingTrack: boolean;
  userProfile: UserProfile;
  appSettings: AppSettings;
  recommendations: Track[];
  sleepTimerRemaining: number | null; // in seconds
  
  // Actions
  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  createPlaylist: (name: string, desc?: string, coverUrl?: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  setActiveView: (view: ViewType) => void;
  setSearchQuery: (q: string) => void;
  openPlaylist: (pl: Playlist) => void;
  setIsLyricsOpen: (val: boolean) => void;
  setIsVisualizerOpen: (val: boolean) => void;
  setIsQueueOpen: (val: boolean) => void;
  setIsVideoOpen: (val: boolean) => void;
  setIsSettingsOpen: (val: boolean) => void;
  setIsProfileOpen: (val: boolean) => void;
  setActiveSourceTab: (tab: 'all' | 'spotify' | 'apple' | 'youtube') => void;
  setCurrentTime: (time: number) => void;
  setDuration: (dur: number) => void;
  setIsPlaying: (playing: boolean) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  clearHistory: () => void;
  setSleepTimer: (minutes: number | null) => void;
  refreshRecommendations: () => void;
  ytPlayerRef: React.MutableRefObject<any>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('notmusic_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Müziksever',
      avatar: 'dj-cool',
      bio: 'Müzik ruhun gıdasıdır 🎧',
      favoriteGenre: 'Türkçe Pop',
      joinedDate: 'Kasım 2026',
    };
  });

  // App Settings state (Custom App Name, Icon, Theme, Audio Quality)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('notmusic_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      appName: 'NotMusic',
      appIcon: 'neon-note',
      theme: 'dark',
      audioQuality: 'Kayıpsız Hi-Res (24-bit/96kHz)',
      equalizerPreset: 'Bass Boost',
      sleepTimerMinutes: null,
    };
  });

  // History state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('notmusic_history_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Liked Tracks state
  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('notmusic_liked');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('notmusic_playlists');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'pl_favorites',
        name: 'Favori Şarkılarım',
        description: 'En çok dinlediğin ve beğendiğin şarkılar',
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        tracks: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pl_chill',
        name: 'Gece Sakinliği & Chill',
        description: 'Lo-Fi ve dinlenme saatleri',
        coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
        tracks: [],
        createdAt: new Date().toISOString(),
      }
    ];
  });

  // Smart Recommendations state
  const [recommendations, setRecommendations] = useState<Track[]>([]);

  // Navigation & Modals state
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [activeSourceTab, setActiveSourceTab] = useState<'all' | 'spotify' | 'apple' | 'youtube'>('all');
  const [currentYoutubeId, setCurrentYoutubeId] = useState<string | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // References
  const ytPlayerRef = useRef<any>(null);

  // Apply dark theme to document.body & title
  useEffect(() => {
    document.body.setAttribute('data-theme', 'dark');
    document.title = `${appSettings.appName} — Spotify, Apple Music & YouTube`;
  }, [appSettings.appName]);

  // Persist Profile
  useEffect(() => {
    try {
      localStorage.setItem('notmusic_profile', JSON.stringify(userProfile));
    } catch (e) {
      console.error(e);
    }
  }, [userProfile]);

  // Persist Settings
  useEffect(() => {
    try {
      localStorage.setItem('notmusic_settings', JSON.stringify(appSettings));
    } catch (e) {
      console.error(e);
    }
  }, [appSettings]);

  // Persist Liked Tracks
  useEffect(() => {
    try {
      localStorage.setItem('notmusic_liked', JSON.stringify(likedTracks));
    } catch (e) {
      console.error(e);
    }
  }, [likedTracks]);

  // Persist Playlists
  useEffect(() => {
    try {
      localStorage.setItem('notmusic_playlists', JSON.stringify(playlists));
    } catch (e) {
      console.error(e);
    }
  }, [playlists]);

  // Persist History
  useEffect(() => {
    try {
      localStorage.setItem('notmusic_history_items', JSON.stringify(historyItems));
    } catch (e) {
      console.error(e);
    }
  }, [historyItems]);

  // Fetch Smart Recommendations based on History and Liked Artists
  const refreshRecommendations = async () => {
    const artistCounts = new Map<string, number>();
    historyItems.forEach(item => {
      const art = item.track.artist;
      artistCounts.set(art, (artistCounts.get(art) || 0) + 1);
    });
    likedTracks.forEach(track => {
      artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + 2);
    });

    const topArtists = Array.from(artistCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    const recs = await getPersonalizedRecommendations(topArtists, userProfile.favoriteGenre);
    setRecommendations(recs);
  };

  useEffect(() => {
    refreshRecommendations();
  }, [historyItems.length, likedTracks.length, userProfile.favoriteGenre]);

  // Ultra-Fast Queue Pre-fetching: Pre-resolve the next 2 tracks in background
  // so when user clicks "Next", the track starts in 0 milliseconds!
  useEffect(() => {
    if (queue.length > 0 && queueIndex >= 0) {
      const nextTracks = [queue[queueIndex + 1], queue[queueIndex + 2]].filter(Boolean);
      nextTracks.forEach(t => {
        if (!t.youtubeId) {
          resolveYouTubeId(t.title, t.artist).then(ytId => {
            if (ytId) {
              setQueue(prev => prev.map(item => item.id === t.id ? { ...item, youtubeId: ytId } : item));
            }
          });
        }
      });
    }
  }, [queueIndex, queue.length]);

  // Sleep Timer countdown ticker
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;

    const timer = setInterval(() => {
      setSleepTimerRemaining(prev => {
        if (prev === null || prev <= 1) {
          pause();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerRemaining]);

  const setSleepTimer = (minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemaining(null);
    } else {
      setSleepTimerRemaining(minutes * 60);
    }
  };

  // Play track & record history
  const playTrack = async (track: Track, newQueue?: Track[]) => {
    setIsLoadingTrack(true);
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.durationSec || 210);

    if (newQueue) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(t => t.id === track.id);
      setQueueIndex(idx >= 0 ? idx : 0);
    } else {
      if (queue.length === 0) {
        setQueue([track]);
        setQueueIndex(0);
      }
    }

    // Add to history with timestamp
    setHistoryItems(prev => [
      {
        id: `${track.id}_${Date.now()}`,
        track,
        playedAt: new Date().toISOString(),
      },
      ...prev.filter(h => h.track.id !== track.id),
    ].slice(0, 100));

    // Fast-path 1: If track already has YouTube ID, play instantly (0ms delay!)
    if (track.youtubeId) {
      setCurrentYoutubeId(track.youtubeId);
      setIsPlaying(true);
      setIsLoadingTrack(false);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById(track.youtubeId);
        ytPlayerRef.current.playVideo();
      }
    } else {
      // Fast-path 2: If track has audio preview (Apple/Spotify), start audio instantly (< 30ms)!
      if (track.previewUrl) {
        setCurrentYoutubeId(null);
        setIsPlaying(true);
        setIsLoadingTrack(false);
      } else {
        setIsLoadingTrack(true);
      }

      // Fast-path 3: Resolve full YouTube ID asynchronously in the background
      resolveYouTubeId(track.title, track.artist).then(resolvedId => {
        if (resolvedId) {
          // Cache in current queue item
          setQueue(prev => prev.map(t => t.id === track.id ? { ...t, youtubeId: resolvedId } : t));
          setCurrentYoutubeId(resolvedId);
          setIsLoadingTrack(false);
          setIsPlaying(true);
          if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
            ytPlayerRef.current.loadVideoById(resolvedId);
            ytPlayerRef.current.playVideo();
          }
        }
      });
    }
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const pause = () => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    if (repeatMode === 'one' && currentTrack) {
      seekTo(0);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      }
      setIsPlaying(true);
      return;
    }

    let nextIdx = queueIndex + 1;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }

    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      playTrack(queue[nextIdx], queue);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
      playTrack(queue[0], queue);
    } else {
      setIsPlaying(false);
    }
  };

  const playPrevious = () => {
    if (currentTime > 4) {
      seekTo(0);
      return;
    }
    if (queue.length === 0) return;
    const prevIdx = queueIndex > 0 ? queueIndex - 1 : 0;
    setQueueIndex(prevIdx);
    playTrack(queue[prevIdx], queue);
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seconds, true);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    setIsMuted(val === 0);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(Math.round(val * 100));
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
      }
    } else {
      setIsMuted(true);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      }
    }
  };

  const toggleShuffle = () => setIsShuffle(prev => !prev);

  const cycleRepeatMode = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const toggleLike = (track: Track) => {
    setLikedTracks(prev => {
      const exists = prev.some(t => t.id === track.id);
      if (exists) {
        return prev.filter(t => t.id !== track.id);
      } else {
        return [track, ...prev];
      }
    });
  };

  const isLiked = (trackId: string) => {
    return likedTracks.some(t => t.id === trackId);
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const removeFromQueue = (index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
    if (index === queueIndex) {
      playNext();
    } else if (index < queueIndex) {
      setQueueIndex(prev => prev - 1);
    }
  };

  const clearQueue = () => {
    setQueue(currentTrack ? [currentTrack] : []);
    setQueueIndex(0);
  };

  const createPlaylist = (name: string, desc: string = '', coverUrl?: string) => {
    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      description: desc,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      tracks: [],
      createdAt: new Date().toISOString(),
    };
    setPlaylists(prev => [newPl, ...prev]);
  };

  const addTrackToPlaylist = (playlistId: string, track: Track) => {
    setPlaylists(prev =>
      prev.map(pl => {
        if (pl.id === playlistId) {
          if (pl.tracks.some(t => t.id === track.id)) return pl;
          return { ...pl, tracks: [...pl.tracks, track] };
        }
        return pl;
      })
    );
  };

  const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists(prev =>
      prev.map(pl => {
        if (pl.id === playlistId) {
          return { ...pl, tracks: pl.tracks.filter(t => t.id !== trackId) };
        }
        return pl;
      })
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) {
      setActiveView('library');
      setSelectedPlaylist(null);
    }
  };

  const openPlaylist = (pl: Playlist) => {
    setSelectedPlaylist(pl);
    setActiveView('playlist');
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...settings }));
  };

  const clearHistory = () => {
    setHistoryItems([]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        queueIndex,
        historyItems,
        likedTracks,
        playlists,
        activeView,
        searchQuery,
        selectedPlaylist,
        isLyricsOpen,
        isVisualizerOpen,
        isQueueOpen,
        isVideoOpen,
        isSettingsOpen,
        isProfileOpen,
        activeSourceTab,
        currentYoutubeId,
        isLoadingTrack,
        userProfile,
        appSettings,
        recommendations,
        sleepTimerRemaining,
        playTrack,
        togglePlay,
        pause,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeatMode,
        toggleLike,
        isLiked,
        addToQueue,
        removeFromQueue,
        clearQueue,
        createPlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        deletePlaylist,
        setActiveView,
        setSearchQuery,
        openPlaylist,
        setIsLyricsOpen,
        setIsVisualizerOpen,
        setIsQueueOpen,
        setIsVideoOpen,
        setIsSettingsOpen,
        setIsProfileOpen,
        setActiveSourceTab,
        setCurrentTime,
        setDuration,
        setIsPlaying,
        updateProfile,
        updateSettings,
        clearHistory,
        setSleepTimer,
        refreshRecommendations,
        ytPlayerRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};
