import { Capacitor } from '@capacitor/core';
import { Track, LyricsData } from '../types';

const API_BASE = '/api';

const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// In-memory cache for native Android serverless calls
const nativeCache = new Map<string, { data: any; expiry: number }>();
function getNativeCached(key: string) {
  const item = nativeCache.get(key);
  if (item && item.expiry > Date.now()) return item.data;
  return null;
}
function setNativeCached(key: string, data: any, ttlMs: number = 300000) {
  nativeCache.set(key, { data, expiry: Date.now() + ttlMs });
}

async function nativeSearchYouTube(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' music')}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const results: Track[] = [];

    for (const section of contents) {
      const items = section.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const vr = item.videoRenderer;
        if (vr && vr.videoId) {
          const durationText = vr.lengthText?.simpleText || '3:30';
          const parts = durationText.split(':').map(Number);
          const durationSec = parts.length === 2 ? parts[0] * 60 + parts[1] : (parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 210);

          let title = vr.title?.runs?.[0]?.text || '';
          let artist = vr.ownerText?.runs?.[0]?.text || 'YouTube Music';

          if (title.includes(' - ')) {
            const split = title.split(' - ');
            artist = split[0].trim();
            title = split.slice(1).join(' - ').replace(/\(Official.*?\)|\[Official.*?\]|\(Lyric.*?\)|\[Lyric.*?\]/gi, '').trim();
          }

          const thumbs = vr.thumbnail?.thumbnails || [];
          const coverUrl = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`;

          results.push({
            id: `yt_${vr.videoId}`,
            title,
            artist,
            album: 'YouTube Music',
            coverUrl,
            duration: durationText,
            durationSec,
            source: 'youtube',
            youtubeId: vr.videoId,
            externalUrl: `https://www.youtube.com/watch?v=${vr.videoId}`,
          });

          if (results.length >= limit) break;
        }
      }
      if (results.length >= limit) break;
    }
    return results;
  } catch (err) {
    console.error('Native YouTube search error:', err);
    return [];
  }
}

async function nativeSearchAppleMusic(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((item: any) => {
      const durationSec = Math.round((item.trackTimeMillis || 200000) / 1000);
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;
      const duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      const highResArt = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb');

      return {
        id: `apple_${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName,
        coverUrl: highResArt,
        duration,
        durationSec,
        source: 'apple' as const,
        previewUrl: item.previewUrl,
        genre: item.primaryGenreName,
        releaseDate: item.releaseDate ? item.releaseDate.split('T')[0] : undefined,
        externalUrl: item.trackViewUrl,
      };
    });
  } catch (err) {
    console.error('Native Apple Music search error:', err);
    return [];
  }
}

const CURATED_YOUTUBE_TRENDS: Track[] = [
  {
    id: 'yt_chart_1',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/600x600bb.jpg',
    duration: '4:11',
    durationSec: 251,
    source: 'youtube',
    youtubeId: 'kPa7bsKwL-8',
  },
  {
    id: 'yt_chart_2',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    album: 'HIT ME HARD AND SOFT',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4a/89/3b/4a893baa-f87c-2ea7-227a-8f52f36f90d5/24UMGIM33146.rgb.jpg/600x600bb.jpg',
    duration: '3:18',
    durationSec: 198,
    source: 'youtube',
    youtubeId: 'V9PVRfjEBTI',
  },
  {
    id: 'yt_chart_3',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: "Short n' Sweet",
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/bf/25/7f/bf257fe1-c966-d4f1-6101-8bf82381f26f/24UMGIM39223.rgb.jpg/600x600bb.jpg',
    duration: '2:55',
    durationSec: 175,
    source: 'youtube',
    youtubeId: 'eVli-tstM5E',
  },
  {
    id: 'yt_chart_4',
    title: 'Apt.',
    artist: 'ROSE & Bruno Mars',
    album: 'rosie',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/58/01/a0/5801a070-df6a-2ee5-eb9e-c88c757c2a71/075679633652.jpg/600x600bb.jpg',
    duration: '2:49',
    durationSec: 169,
    source: 'youtube',
    youtubeId: 'ekr2nIex040',
  },
  {
    id: 'yt_chart_5',
    title: 'Good Luck, Babe!',
    artist: 'Chappell Roan',
    album: 'Good Luck, Babe!',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/bf/2c/3f/bf2c3fb6-78ff-604b-5517-c812d77054f1/24UMGIM34685.rgb.jpg/600x600bb.jpg',
    duration: '3:38',
    durationSec: 218,
    source: 'youtube',
    youtubeId: '1RKqOmSkGgM',
  },
  {
    id: 'yt_chart_6',
    title: 'Taste',
    artist: 'Sabrina Carpenter',
    album: "Short n' Sweet",
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/37/b2/8c/37b28cc1-a6ee-35e6-b605-67c9c0f99ae9/24UMGIM69455.rgb.jpg/600x600bb.jpg',
    duration: '2:37',
    durationSec: 157,
    source: 'youtube',
    youtubeId: 'ZFafIclpn8M',
  },
  {
    id: 'yt_chart_7',
    title: 'Not Like Us',
    artist: 'Kendrick Lamar',
    album: 'Not Like Us',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/21/bc/1b/21bc1b47-ce47-5d51-6d75-ec9457df7834/24UMGIM52358.rgb.jpg/600x600bb.jpg',
    duration: '4:34',
    durationSec: 274,
    source: 'youtube',
    youtubeId: 'H58vbez_m4E',
  },
  {
    id: 'yt_chart_8',
    title: 'KUSURA BAKMA',
    artist: 'BLOK3',
    album: 'KUSURA BAKMA',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/91/9f/bf/919fbf3c-c9d3-f002-c8a7-ad093ea65181/198704207865.jpg/600x600bb.jpg',
    duration: '2:40',
    durationSec: 160,
    source: 'youtube',
    youtubeId: '9g-sSbgZ2lI',
  },
  {
    id: 'yt_chart_9',
    title: 'Güzel Kızım',
    artist: 'Lvbel C5',
    album: 'Güzel Kızım',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/bc/40/e3/bc40e3aa-2144-8cb3-d731-8e05cb8f2441/5054197992705.jpg/600x600bb.jpg',
    duration: '2:25',
    durationSec: 145,
    source: 'youtube',
    youtubeId: 'b7E-x9L2eYI',
  },
  {
    id: 'yt_chart_10',
    title: 'Aptal Kafam',
    artist: 'UZI',
    album: 'Aptal Kafam',
    coverUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/80/06/f0/8006f014-9989-1383-efca-932d04a63fa3/8683515000574.jpg/600x600bb.jpg',
    duration: '2:35',
    durationSec: 155,
    source: 'youtube',
    youtubeId: 'jV5UoB3eXzY',
  }
];

export async function searchTracks(query: string, source: 'all' | 'spotify' | 'apple' | 'youtube' = 'all'): Promise<Track[]> {
  if (!query.trim()) return [];

  if (isNative()) {
    const cacheKey = `search_${source}_${query.trim()}`;
    const cached = getNativeCached(cacheKey);
    if (cached) return cached;

    try {
      let results: Track[] = [];
      if (source === 'all') {
        const [appleTracks, ytTracks] = await Promise.all([
          nativeSearchAppleMusic(query, 15),
          nativeSearchYouTube(query, 15),
        ]);
        const spotifyMapped = appleTracks.slice(0, 5).map(t => ({
          ...t,
          id: `spotify_${t.id.replace('apple_', '')}`,
          source: 'spotify' as const,
        }));
        const maxLength = Math.max(appleTracks.length, ytTracks.length);
        for (let i = 0; i < maxLength; i++) {
          if (i < spotifyMapped.length) results.push(spotifyMapped[i]);
          if (i < appleTracks.length) results.push(appleTracks[i]);
          if (i < ytTracks.length) results.push(ytTracks[i]);
        }
      } else if (source === 'apple') {
        results = await nativeSearchAppleMusic(query, 30);
      } else if (source === 'youtube') {
        results = await nativeSearchYouTube(query, 30);
      } else if (source === 'spotify') {
        const appleData = await nativeSearchAppleMusic(query, 30);
        results = appleData.map(t => ({
          ...t,
          id: `spotify_${t.id.replace('apple_', '')}`,
          source: 'spotify' as const,
        }));
      }

      const seen = new Set<string>();
      const uniqueResults = results.filter(t => {
        const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}_${t.source}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setNativeCached(cacheKey, uniqueResults, 120000);
      return uniqueResults;
    } catch (err) {
      console.error('Native search error:', err);
      return [];
    }
  }

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
  if (isNative()) {
    const cacheKey = 'native_charts';
    const cached = getNativeCached(cacheKey);
    if (cached) return cached;

    try {
      const [trRes, usRes] = await Promise.allSettled([
        fetch('https://itunes.apple.com/tr/rss/topsongs/limit=25/json').then(r => r.json()),
        fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json').then(r => r.json()),
      ]);

      const formatEntry = (e: any, source: 'spotify' | 'apple' | 'youtube'): Track => {
        const title = e['im:name']?.label || 'Unknown';
        const artist = e['im:artist']?.label || 'Artist';
        const img = e['im:image']?.[2]?.label || '';
        const highRes = img.replace('170x170bb', '600x600bb');
        const id = e.id?.attributes?.['im:id'] || Math.random().toString();
        return {
          id: `${source}_chart_${id}`,
          title,
          artist,
          album: e['im:collection']?.['im:name']?.label || 'Top Hits',
          coverUrl: highRes,
          duration: '3:30',
          durationSec: 210,
          source,
          genre: e.category?.attributes?.label,
          releaseDate: e['im:releaseDate']?.label?.split('T')[0],
        };
      };

      const turkeyTop = trRes.status === 'fulfilled' && trRes.value?.feed?.entry
        ? trRes.value.feed.entry.map((e: any) => formatEntry(e, 'spotify'))
        : [];
      const globalTop = usRes.status === 'fulfilled' && usRes.value?.feed?.entry
        ? usRes.value.feed.entry.map((e: any) => formatEntry(e, 'apple'))
        : [];

      const data = {
        spotifyTurkeyTop: turkeyTop,
        globalAppleTop: globalTop,
        youtubeTrends: CURATED_YOUTUBE_TRENDS,
      };
      setNativeCached(cacheKey, data, 1800000);
      return data;
    } catch (err) {
      console.error('Native charts error:', err);
      return { spotifyTurkeyTop: [], globalAppleTop: [], youtubeTrends: CURATED_YOUTUBE_TRENDS };
    }
  }

  try {
    const res = await fetch(`${API_BASE}/charts`);
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch charts:', err);
    return { spotifyTurkeyTop: [], globalAppleTop: [], youtubeTrends: [] };
  }
}

export async function getSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];

  if (isNative()) {
    try {
      const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return Array.isArray(data?.[1]) ? data[1].slice(0, 6) : [];
    } catch {
      return [];
    }
  }

  try {
    const res = await fetch(`${API_BASE}/suggestions?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.suggestions || [];
  } catch (err) {
    return [];
  }
}

export async function getLyrics(title: string, artist: string): Promise<LyricsData> {
  if (isNative()) {
    const cacheKey = `lyrics_${title}_${artist}`.toLowerCase();
    const cached = getNativeCached(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
      const r = await fetch(url);
      if (!r.ok) {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
        const sr = await fetch(searchUrl);
        const sData = await sr.json();
        if (Array.isArray(sData) && sData.length > 0) {
          const item = sData[0];
          const result = {
            syncedLyrics: item.syncedLyrics,
            plainLyrics: item.plainLyrics,
            instrumental: item.instrumental,
          };
          setNativeCached(cacheKey, result, 3600000 * 48);
          return result;
        }
        return { syncedLyrics: null, plainLyrics: null };
      }
      const data = await r.json();
      const result = {
        syncedLyrics: data.syncedLyrics,
        plainLyrics: data.plainLyrics,
        instrumental: data.instrumental,
      };
      setNativeCached(cacheKey, result, 3600000 * 48);
      return result;
    } catch {
      return { syncedLyrics: null, plainLyrics: null };
    }
  }

  try {
    const res = await fetch(`${API_BASE}/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
    return await res.json();
  } catch (err) {
    return { syncedLyrics: null, plainLyrics: null };
  }
}

export async function resolveYouTubeId(title: string, artist: string): Promise<string | null> {
  if (isNative()) {
    const cacheKey = `yt_res_${title}_${artist}`.toLowerCase();
    const cached = getNativeCached(cacheKey);
    if (cached) return cached;

    const ytResults = await nativeSearchYouTube(`${artist} ${title} audio`, 3);
    if (ytResults.length > 0 && ytResults[0].youtubeId) {
      setNativeCached(cacheKey, ytResults[0].youtubeId, 3600000 * 24);
      return ytResults[0].youtubeId;
    }
    return null;
  }

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

const NATIVE_USER_DATA_KEY = 'notmusic_native_user_data';

export async function getUserDataApi(): Promise<any> {
  if (isNative()) {
    try {
      const raw = localStorage.getItem(NATIVE_USER_DATA_KEY);
      return raw ? JSON.parse(raw) : { likedTracks: [], playlists: [], userProfile: null, historyItems: [] };
    } catch {
      return null;
    }
  }

  try {
    const res = await fetch(`${API_BASE}/user-data`);
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveUserDataApi(data: any): Promise<void> {
  if (isNative()) {
    try {
      const currentRaw = localStorage.getItem(NATIVE_USER_DATA_KEY);
      const current = currentRaw ? JSON.parse(currentRaw) : {};
      localStorage.setItem(NATIVE_USER_DATA_KEY, JSON.stringify({ ...current, ...data }));
    } catch {}
    return;
  }

  try {
    await fetch(`${API_BASE}/user-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {}
}
