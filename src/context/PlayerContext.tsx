import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Track, 
  Playlist, 
  ViewType, 
  UserProfile, 
  AppSettings, 
  HistoryItem
} from '../types';
import { 
  resolveYouTubeId, 
  getPersonalizedRecommendations, 
  getUserDataApi, 
  saveUserDataApi
} from '../services/api';
import { getOfflineAudioUrl } from '../services/offlineStorage';

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
  audioPreviewRef: React.MutableRefObject<HTMLAudioElement | null>;
  userPausedRef: React.MutableRefObject<boolean>;
  toast: string | null;
  showToast: (msg: string) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

function sanitizeProfile(raw: any): UserProfile {
  return {
    name: raw?.name || 'notemov',
    avatar: raw?.avatar || 'dj-cool',
    bio: raw?.bio || 'nabersiniz',
    favoriteGenre: raw?.favoriteGenre || 'Türkçe Pop',
    joinedDate: raw?.joinedDate || 'Kasım 2026',
  };
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userPausedRef = useRef<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2800);
  };

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

  const queueRef = useRef<Track[]>(queue);
  queueRef.current = queue;

  const queueIndexRef = useRef<number>(queueIndex);
  queueIndexRef.current = queueIndex;

  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;

  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;

  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;

  // User Profile state (clean personal preferences without IDs or social handles)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('notmusic_profile');
      if (saved) {
        return sanitizeProfile(JSON.parse(saved));
      }
    } catch {}
    return sanitizeProfile(null);
  });

  // App Settings state
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
  const recommendationsRef = useRef<Track[]>(recommendations);
  recommendationsRef.current = recommendations;

  // Navigation & Modals state
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isVideoOpen, setIsVideoOpenState] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const [activeSourceTab, setActiveSourceTabState] = useState<'all' | 'spotify' | 'apple' | 'youtube'>('all');
  const activeSourceTabRef = useRef(activeSourceTab);
  activeSourceTabRef.current = activeSourceTab;

  const [currentYoutubeId, setCurrentYoutubeId] = useState<string | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState<boolean>(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  // References
  const ytPlayerRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Video can ONLY be opened when playing a YouTube track and NOT on Spotify/Apple tabs
  const setIsVideoOpen = (val: boolean) => {
    if (!val) {
      setIsVideoOpenState(false);
      return;
    }
    const tab = activeSourceTabRef.current;
    const track = currentTrackRef.current;
    if (tab === 'spotify' || tab === 'apple') {
      setIsVideoOpenState(false);
      showToast('Video modu yalnızca YouTube sekmesinde ve YouTube parçalarında açılabilir');
      return;
    }
    if (!track || track.source !== 'youtube') {
      setIsVideoOpenState(false);
      showToast('Video yalnızca YouTube kaynaklı parçalarda izlenebilir');
      return;
    }
    setIsVideoOpenState(true);
  };

  const setActiveSourceTab = (tab: 'all' | 'spotify' | 'apple' | 'youtube') => {
    setActiveSourceTabState(tab);
    activeSourceTabRef.current = tab;
    if (tab !== 'youtube') {
      setIsVideoOpenState(false);
    }
  };

  // Auto-close video if current track is Spotify or Apple Music
  useEffect(() => {
    if (!currentTrack || currentTrack.source !== 'youtube') {
      setIsVideoOpenState(false);
    }
  }, [currentTrack?.id, currentTrack?.source]);

  // Apply theme to document.body & title
  useEffect(() => {
    document.body.setAttribute('data-theme', appSettings.theme || 'dark');
    document.title = `${appSettings.appName} — Spotify, Apple Music & YouTube`;
  }, [appSettings.appName, appSettings.theme]);

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

  // Sync selectedPlaylist when playlists mutate (e.g. adding/removing tracks)
  useEffect(() => {
    if (selectedPlaylist) {
      const updated = playlists.find(p => p.id === selectedPlaylist.id);
      if (updated) setSelectedPlaylist(updated);
    }
  }, [playlists]);

  // Hydrate user data from disk API on startup
  useEffect(() => {
    getUserDataApi().then(diskData => {
      if (diskData) {
        if (Array.isArray(diskData.likedTracks) && diskData.likedTracks.length > 0) {
          setLikedTracks(diskData.likedTracks);
        }
        if (Array.isArray(diskData.playlists) && diskData.playlists.length > 0) {
          setPlaylists(diskData.playlists);
        }
        if (diskData.userProfile) {
          setUserProfile(sanitizeProfile(diskData.userProfile));
        }
        if (Array.isArray(diskData.historyItems) && diskData.historyItems.length > 0) {
          setHistoryItems(diskData.historyItems);
        }
      }
    });

    // Provide default ready-to-play track on first launch if empty
    setCurrentTrack(prev => {
      if (prev) return prev;
      return {
        id: 'yt_chart_1',
        title: 'Die With A Smile',
        artist: 'Lady Gaga & Bruno Mars',
        album: 'Die With A Smile',
        coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
        duration: '4:11',
        durationSec: 251,
        source: 'youtube',
        youtubeId: 'kPa7bsKwL-8',
      };
    });
  }, []);

  // Save to disk whenever liked tracks, playlists, profile or history changes
  useEffect(() => {
    saveUserDataApi({
      likedTracks,
      playlists,
      userProfile,
      historyItems,
    });
  }, [likedTracks, playlists, userProfile, historyItems]);

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
  useEffect(() => {
    if (queue.length > 0 && queueIndex >= 0) {
      const nextTracks = [queue[queueIndex + 1], queue[queueIndex + 2]].filter(Boolean);
      nextTracks.forEach(t => {
        if (!t.youtubeId && !t.previewUrl?.startsWith('/api/download-file/')) {
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
    userPausedRef.current = false;
    if (track.source !== 'youtube') {
      setIsVideoOpenState(false);
    }

    setIsLoadingTrack(true);
    setCurrentTrack(track);
    currentTrackRef.current = track;
    setCurrentTime(0);
    setDuration(track.durationSec || 210);

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      queueRef.current = newQueue;
      const idx = newQueue.findIndex(t => t.id === track.id);
      const safeIdx = idx >= 0 ? idx : 0;
      setQueueIndex(safeIdx);
      queueIndexRef.current = safeIdx;
    } else {
      if (queueRef.current.length === 0) {
        const initialQueue = recommendationsRef.current.length > 0
          ? [track, ...recommendationsRef.current.filter(r => r.id !== track.id)]
          : [track];
        setQueue(initialQueue);
        queueRef.current = initialQueue;
        setQueueIndex(0);
        queueIndexRef.current = 0;
      } else {
        const idx = queueRef.current.findIndex(t => t.id === track.id);
        if (idx >= 0) {
          setQueueIndex(idx);
          queueIndexRef.current = idx;
        } else {
          const updatedQueue = [...queueRef.current, track];
          setQueue(updatedQueue);
          queueRef.current = updatedQueue;
          const newIdx = updatedQueue.length - 1;
          setQueueIndex(newIdx);
          queueIndexRef.current = newIdx;
        }
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

    // Offline downloaded MP3 / IndexedDB Blob playback path (local file, no internet needed)
    if (track.previewUrl?.startsWith('/api/download-file/') || track.previewUrl?.startsWith('blob:')) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
        try { ytPlayerRef.current.stopVideo(); } catch {}
      }
      setCurrentYoutubeId(null);
      setIsPlaying(true);
      setIsLoadingTrack(false);
      return;
    }

    // Check if track was previously downloaded offline before streaming
    const targetTrackId = track.id;
    const offlineLocalUrl = await getOfflineAudioUrl(track.id);
    if (currentTrackRef.current?.id !== targetTrackId) return;
    if (offlineLocalUrl) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.stopVideo === 'function') {
        try { ytPlayerRef.current.stopVideo(); } catch {}
      }
      setCurrentTrack({ ...track, previewUrl: offlineLocalUrl });
      currentTrackRef.current = { ...track, previewUrl: offlineLocalUrl };
      setCurrentYoutubeId(null);
      setIsPlaying(true);
      setIsLoadingTrack(false);
      return;
    }

    // Fast-path 1: Track already has YouTube ID -> start immediately
    if (track.youtubeId) {
      setCurrentYoutubeId(track.youtubeId);
      setIsPlaying(true);
      setIsLoadingTrack(false);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById(track.youtubeId);
        ytPlayerRef.current.playVideo();
      }
      return;
    }

    // Fast-path 2: Resolve full-length stream in background (prevent double playback & race condition)
    resolveYouTubeId(track.title, track.artist).then(resolvedId => {
      if (currentTrackRef.current?.id !== targetTrackId) return; // user switched tracks

      if (resolvedId) {
        setQueue(prev => prev.map(t => t.id === track.id ? { ...t, youtubeId: resolvedId } : t));
        queueRef.current = queueRef.current.map(t => t.id === track.id ? { ...t, youtubeId: resolvedId } : t);
        setCurrentYoutubeId(resolvedId);
        setIsLoadingTrack(false);
        setIsPlaying(true);
        if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
          ytPlayerRef.current.loadVideoById(resolvedId);
          ytPlayerRef.current.playVideo();
        }
      } else if (track.previewUrl) {
        setCurrentYoutubeId(null);
        setIsLoadingTrack(false);
        setIsPlaying(true);
      } else {
        setIsLoadingTrack(false);
        setIsPlaying(false);
        showToast('Bu parça şu an yüklenemedi.');
      }
    });
  };

  const togglePlay = () => {
    if (!currentTrack) return;

    // Handle HTML5 Audio element if active (offline download or preview fallback)
    if (!currentYoutubeId && audioPreviewRef.current && audioPreviewRef.current.src) {
      if (isPlaying) {
        userPausedRef.current = true;
        audioPreviewRef.current.pause();
        setIsPlaying(false);
      } else {
        userPausedRef.current = false;
        audioPreviewRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
      if (isPlaying) {
        userPausedRef.current = true;
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        userPausedRef.current = false;
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      userPausedRef.current = !isPlaying;
      setIsPlaying(!isPlaying);
    }
  };

  const pause = () => {
    userPausedRef.current = true;
    if (audioPreviewRef.current && !audioPreviewRef.current.paused) {
      audioPreviewRef.current.pause();
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  };

  const playNext = () => {
    userPausedRef.current = false;
    const currentQ = queueRef.current;
    const currentIdx = queueIndexRef.current;
    const repMode = repeatModeRef.current;
    const shuffle = isShuffleRef.current;

    if (currentQ.length === 0) {
      if (recommendationsRef.current.length > 0) {
        const nextTrack = recommendationsRef.current[0];
        setQueue(recommendationsRef.current);
        queueRef.current = recommendationsRef.current;
        setQueueIndex(0);
        queueIndexRef.current = 0;
        playTrack(nextTrack, recommendationsRef.current);
      }
      return;
    }

    if (repMode === 'one' && currentTrackRef.current) {
      seekTo(0);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      }
      if (!currentYoutubeId && audioPreviewRef.current && audioPreviewRef.current.src) {
        audioPreviewRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
      return;
    }

    let nextIdx = currentIdx + 1;
    if (shuffle && currentQ.length > 1) {
      let randIdx = Math.floor(Math.random() * currentQ.length);
      while (randIdx === currentIdx && currentQ.length > 1) {
        randIdx = Math.floor(Math.random() * currentQ.length);
      }
      nextIdx = randIdx;
    }

    if (nextIdx < currentQ.length) {
      setQueueIndex(nextIdx);
      queueIndexRef.current = nextIdx;
      playTrack(currentQ[nextIdx], currentQ);
    } else {
      if (recommendationsRef.current.length > 0) {
        const unused = recommendationsRef.current.filter(r => !currentQ.some(q => q.id === r.id));
        if (unused.length > 0) {
          const nextTrack = unused[0];
          const newQ = [...currentQ, nextTrack];
          setQueue(newQ);
          queueRef.current = newQ;
          setQueueIndex(currentQ.length);
          queueIndexRef.current = currentQ.length;
          playTrack(nextTrack, newQ);
          return;
        }
      }
      setQueueIndex(0);
      queueIndexRef.current = 0;
      playTrack(currentQ[0], currentQ);
    }
  };

  const playPrevious = () => {
    userPausedRef.current = false;
    if (currentTime > 4) {
      seekTo(0);
      return;
    }
    const currentQ = queueRef.current;
    if (currentQ.length === 0) return;
    const currentIdx = queueIndexRef.current;
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : currentQ.length - 1;
    setQueueIndex(prevIdx);
    queueIndexRef.current = prevIdx;
    playTrack(currentQ[prevIdx], currentQ);
  };

  const seekTo = (seconds: number) => {
    setCurrentTime(seconds);
    if (!currentYoutubeId && audioPreviewRef.current && audioPreviewRef.current.src) {
      audioPreviewRef.current.currentTime = seconds;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seconds, true);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    setIsMuted(val === 0);
    if (audioPreviewRef.current) {
      audioPreviewRef.current.volume = val;
    }
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(Math.round(val * 100));
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioPreviewRef.current) audioPreviewRef.current.volume = volume;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
      }
    } else {
      setIsMuted(true);
      if (audioPreviewRef.current) audioPreviewRef.current.volume = 0;
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
    showToast(`"${track.title}" çalma sırasına eklendi`);
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
    showToast(`"${track.title}" listeye eklendi`);
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
    setUserProfile(prev => sanitizeProfile({ ...prev, ...profile }));
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
        audioPreviewRef,
        userPausedRef,
        toast,
        showToast,
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
