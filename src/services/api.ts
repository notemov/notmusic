import { Track, LyricsData } from '../types';

const API_BASE = '/api';

export async function searchTracks(query: string, source: 'all' | 'spotify' | 'apple' | 'youtube' = 'all'): Promise<Track[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&source=${source}`);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to search tracks:', err);
    return [];
  }
}

export async function getCharts(): Promise<{
  spotifyTurkeyTop: Track[];
  globalAppleTop: Track[];
  youtubeTrends: Track[];
}> {
  try {
    const res = await fetch(`${API_BASE}/charts`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load charts:', err);
    return { spotifyTurkeyTop: [], globalAppleTop: [], youtubeTrends: [] };
  }
}

export async function getSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${API_BASE}/suggest?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.suggestions || [];
  } catch (err) {
    return [];
  }
}

export async function getLyrics(title: string, artist: string): Promise<LyricsData> {
  try {
    const res = await fetch(`${API_BASE}/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
    return await res.json();
  } catch (err) {
    return { syncedLyrics: null, plainLyrics: null };
  }
}

export async function resolveYouTubeId(title: string, artist: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/resolve-youtube?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
    const data = await res.json();
    return data.youtubeId || null;
  } catch (err) {
    return null;
  }
}

// Smart Personalized Recommendations Generator
export async function getPersonalizedRecommendations(
  topArtists: string[],
  favoriteGenre: string
): Promise<Track[]> {
  try {
    const queries: string[] = [];
    if (topArtists.length > 0) {
      // Pick top 2 artists
      topArtists.slice(0, 2).forEach(artist => {
        queries.push(`${artist} hits`);
      });
    }
    if (favoriteGenre) {
      queries.push(`${favoriteGenre} music`);
    }

    if (queries.length === 0) {
      queries.push('trending songs 2026');
    }

    const promises = queries.map(q => searchTracks(q, 'all'));
    const results = await Promise.all(promises);
    const combined = results.flat();

    // Deduplicate
    const seen = new Set<string>();
    return combined.filter(t => {
      const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 24);
  } catch (e) {
    return [];
  }
}
