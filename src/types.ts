export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  duration: string;
  durationSec: number;
  source: 'spotify' | 'apple' | 'youtube';
  previewUrl?: string;
  youtubeId?: string;
  genre?: string;
  releaseDate?: string;
  externalUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  tracks: Track[];
  createdAt: string;
}

export interface LyricsData {
  syncedLyrics: string | null;
  plainLyrics: string | null;
  instrumental?: boolean;
}

export interface SyncedLyricLine {
  timeSec: number;
  text: string;
}

export type ViewType = 
  | 'home' 
  | 'search' 
  | 'charts' 
  | 'recommendations' 
  | 'liked' 
  | 'downloads'
  | 'playlists' 
  | 'library'
  | 'playlist' 
  | 'history' 
  | 'profile' 
  | 'settings';

export type ThemeType = 'dark' | 'light' | 'cyberpunk' | 'spotify' | 'apple' | 'ocean';

export interface UserProfile {
  name: string;
  avatar: string;
  bio: string;
  favoriteGenre: string;
  joinedDate: string;
}

export interface AppSettings {
  appName: string;
  appIcon: string; // icon identifier or image URL
  theme: ThemeType;
  audioQuality: 'Normal (160kbps)' | 'Yüksek (320kbps)' | 'Kayıpsız Hi-Res (24-bit/96kHz)';
  equalizerPreset: string;
  sleepTimerMinutes: number | null;
}

export interface HistoryItem {
  id: string;
  track: Track;
  playedAt: string; // ISO String
}

export interface EqualizerPreset {
  name: string;
  bass: number; // -10 to +10
  mid: number;
  treble: number;
}
