import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const distPath = path.join(currentDir, '../dist');
const downloadsDir = path.join(currentDir, '../downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}
const downloadsManifestFile = path.join(downloadsDir, 'downloads.json');

const dataDir = path.join(currentDir, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const userDataFile = path.join(dataDir, 'user_data.json');

function getUserData(): any {
  try {
    if (fs.existsSync(userDataFile)) {
      return JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    }
  } catch (e) {}
  return { likedTracks: [], playlists: [], userProfile: null, historyItems: [] };
}

function saveUserData(data: any) {
  try {
    fs.writeFileSync(userDataFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

function getDownloadsManifest(): any[] {
  try {
    if (fs.existsSync(downloadsManifestFile)) {
      return JSON.parse(fs.readFileSync(downloadsManifestFile, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveDownloadsManifest(list: any[]) {
  try {
    fs.writeFileSync(downloadsManifestFile, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {}
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Disk persistence for Liked Songs, Playlists, Profile, History
app.get('/api/user-data', (_req: Request, res: Response) => {
  res.json(getUserData());
});

app.post('/api/user-data', (req: Request, res: Response) => {
  const current = getUserData();
  const updated = { ...current, ...req.body };
  saveUserData(updated);
  res.json({ success: true });
});

// In-memory cache for fast repeated queries
const cache = new Map<string, { data: any; expiry: number }>();
function getCached(key: string) {
  const item = cache.get(key);
  if (item && item.expiry > Date.now()) return item.data;
  return null;
}
function setCache(key: string, data: any, ttlMs: number = 300000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

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

// Scrape YouTube search results safely
async function searchYouTube(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' music')}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'SOCS=CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg; CONSENT=YES+cb.20230531-04-p0.en+FX+999',
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

          // Clean title
          let title = vr.title?.runs?.[0]?.text || '';
          let artist = vr.ownerText?.runs?.[0]?.text || 'YouTube Music';
          
          // If title has artist - song format
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
    console.error('YouTube search error:', err);
    return [];
  }
}

// Search Apple Music (via iTunes API)
async function searchAppleMusic(query: string, limit: number = 20): Promise<Track[]> {
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
    console.error('Apple Music search error:', err);
    return [];
  }
}

// Resolve YouTube ID for a track
async function resolveYouTubeId(title: string, artist: string): Promise<string | null> {
  const cacheKey = `yt_res_${title}_${artist}`.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const ytResults = await searchYouTube(`${artist} ${title} audio`, 3);
  if (ytResults.length > 0 && ytResults[0].youtubeId) {
    setCache(cacheKey, ytResults[0].youtubeId, 3600000 * 24); // 24hr cache
    return ytResults[0].youtubeId;
  }
  return null;
}

// 1. Search endpoint
app.get('/api/search', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  const source = (req.query.source as string || 'all').toLowerCase();

  if (!q) {
    return res.json({ results: [] });
  }

  const cacheKey = `search_${source}_${q}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    let results: Track[] = [];

    if (source === 'all') {
      const [appleTracks, ytTracks] = await Promise.all([
        searchAppleMusic(q, 15),
        searchYouTube(q, 15),
      ]);

      // Tag some top tracks as Spotify style matches or combine
      const spotifyMapped = appleTracks.slice(0, 5).map((t, i) => ({
        ...t,
        id: `spotify_${t.id.replace('apple_', '')}`,
        source: 'spotify' as const,
      }));

      // Interleave results for rich multi-source view
      const maxLength = Math.max(appleTracks.length, ytTracks.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < spotifyMapped.length) results.push(spotifyMapped[i]);
        if (i < appleTracks.length) results.push(appleTracks[i]);
        if (i < ytTracks.length) results.push(ytTracks[i]);
      }
    } else if (source === 'apple') {
      results = await searchAppleMusic(q, 30);
    } else if (source === 'youtube') {
      results = await searchYouTube(q, 30);
    } else if (source === 'spotify') {
      const appleData = await searchAppleMusic(q, 30);
      results = appleData.map(t => ({
        ...t,
        id: `spotify_${t.id.replace('apple_', '')}`,
        source: 'spotify' as const,
      }));
    }

    // Deduplicate by title + artist
    const seen = new Set<string>();
    const uniqueResults = results.filter(t => {
      const key = `${t.title.toLowerCase()}_${t.artist.toLowerCase()}_${t.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const response = { results: uniqueResults };
    setCache(cacheKey, response, 120000);
    return res.json(response);
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Resolve YouTube video ID for seamless playback
app.get('/api/resolve-youtube', async (req: Request, res: Response) => {
  const title = (req.query.title as string || '').trim();
  const artist = (req.query.artist as string || '').trim();
  if (!title) return res.status(400).json({ error: 'Title required' });

  const youtubeId = await resolveYouTubeId(title, artist);
  res.json({ youtubeId });
});

// 3. Lyrics endpoint (Synchronized + Plain via LRCLIB)
app.get('/api/lyrics', async (req: Request, res: Response) => {
  const title = (req.query.title as string || '').trim();
  const artist = (req.query.artist as string || '').trim();
  if (!title) return res.status(400).json({ error: 'Title required' });

  const cacheKey = `lyrics_${title}_${artist}`.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    const r = await fetch(url);
    if (!r.ok) {
      // Try search query fallback
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
        setCache(cacheKey, result, 3600000 * 48);
        return res.json(result);
      }
      return res.json({ syncedLyrics: null, plainLyrics: null });
    }
    const data = await r.json();
    const result = {
      syncedLyrics: data.syncedLyrics,
      plainLyrics: data.plainLyrics,
      instrumental: data.instrumental,
    };
    setCache(cacheKey, result, 3600000 * 48);
    return res.json(result);
  } catch (e: any) {
    res.json({ syncedLyrics: null, plainLyrics: null });
  }
});

// 4. Live Charts endpoint
app.get('/api/charts', async (_req: Request, res: Response) => {
  const cacheKey = 'global_charts_data';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    // Fetch Turkey Top & US Top from Apple Music RSS
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

    let turkeyTop: Track[] = [];
    if (trRes.status === 'fulfilled' && trRes.value?.feed?.entry) {
      turkeyTop = trRes.value.feed.entry.map((e: any) => formatEntry(e, 'spotify'));
    }

    let globalTop: Track[] = [];
    if (usRes.status === 'fulfilled' && usRes.value?.feed?.entry) {
      globalTop = usRes.value.feed.entry.map((e: any) => formatEntry(e, 'apple'));
    }

    // Curated YouTube Trends (Hits with pre-set YouTube IDs and reliable high-res covers)
    const youtubeTrends: Track[] = [
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
        album: 'Short n\' Sweet',
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
        album: 'Short n\' Sweet',
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

    const data = {
      spotifyTurkeyTop: turkeyTop,
      globalAppleTop: globalTop,
      youtubeTrends,
    };

    setCache(cacheKey, data, 1800000); // 30 min cache
    res.json(data);
  } catch (err: any) {
    console.error('Charts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Focus existing window endpoint for single-instance enforcement
app.get('/api/focus-window', (req: Request, res: Response) => {
  if (typeof (global as any).focusNotMusicWindow === 'function') {
    (global as any).focusNotMusicWindow();
  }
  res.json({ ok: true });
});

// 5. Autocomplete suggestions endpoint
app.get('/api/suggest', async (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim();
  if (!q) return res.json({ suggestions: [] });

  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
    const r = await fetch(url);
    const data = await r.json();
    const suggestions = (data[1] || []).slice(0, 8);
    res.json({ suggestions });
  } catch (e) {
    res.json({ suggestions: [] });
  }
});

// 6. Get all downloaded tracks (Persisted physically on disk)
app.get('/api/downloads', (_req: Request, res: Response) => {
  const list = getDownloadsManifest();
  const verified = list.filter(item => {
    const filePath = path.join(downloadsDir, item.filename);
    return fs.existsSync(filePath);
  });
  res.json({ downloads: verified });
});

// Resolve yt-dlp path dynamically across common Python installations and PATH
function findYtDlp(): string {
  const localAppData = process.env.LOCALAPPDATA || '';
  const appData = process.env.APPDATA || '';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

  const candidatePaths: string[] = [
    // Python Scripts directories in LocalAppData
    path.join(localAppData, 'Programs', 'Python', 'Python314', 'Scripts', 'yt-dlp.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python313', 'Scripts', 'yt-dlp.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python312', 'Scripts', 'yt-dlp.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python311', 'Scripts', 'yt-dlp.exe'),
    path.join(localAppData, 'Programs', 'Python', 'Python310', 'Scripts', 'yt-dlp.exe'),
    path.join(appData, 'Python', 'Python314', 'Scripts', 'yt-dlp.exe'),
    path.join(appData, 'Python', 'Python313', 'Scripts', 'yt-dlp.exe'),
    path.join(appData, 'Python', 'Python312', 'Scripts', 'yt-dlp.exe'),
    path.join(programFiles, 'yt-dlp', 'yt-dlp.exe'),
    path.join(programFilesX86, 'yt-dlp', 'yt-dlp.exe'),
    path.join(currentDir, 'yt-dlp.exe'),
    path.join(currentDir, '../bin/yt-dlp.exe'),
  ];

  // Scan PATH environment variable
  if (process.env.PATH) {
    const pathDirs = process.env.PATH.split(path.delimiter);
    for (const dir of pathDirs) {
      const cleanDir = dir.trim();
      if (cleanDir) {
        candidatePaths.push(path.join(cleanDir, 'yt-dlp.exe'));
        candidatePaths.push(path.join(cleanDir, 'yt-dlp'));
      }
    }
  }

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // Ignore filesystem access errors
    }
  }

  return 'yt-dlp';
}

// 7. Download a track to disk permanently
app.post('/api/download', async (req: Request, res: Response) => {
  const { track } = req.body;
  if (!track || !track.id) {
    return res.status(400).json({ error: 'Track is required' });
  }

  const cleanId = track.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanId}.mp3`;
  const targetPath = path.join(downloadsDir, filename);

  try {
    // If already downloaded and valid
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
      const stats = fs.statSync(targetPath);
      const list = getDownloadsManifest().filter(i => i.track.id !== track.id);
      list.unshift({
        track,
        filename,
        audioUrl: `/api/download-file/${filename}`,
        sizeBytes: stats.size,
        downloadedAt: new Date().toISOString(),
      });
      saveDownloadsManifest(list);
      return res.json({ success: true, audioUrl: `/api/download-file/${filename}`, sizeBytes: stats.size });
    }

    // Resolve YouTube video ID to download full-length audio (instead of 30s preview)
    let ytId = track.youtubeId;
    if (!ytId && track.title) {
      ytId = await resolveYouTubeId(track.title, track.artist || '');
    }

    if (ytId) {
      const ytDlpPath = findYtDlp();
      const outputTemplate = path.join(downloadsDir, `${cleanId}.%(ext)s`);

      const child = spawn(ytDlpPath, [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputTemplate,
        `https://www.youtube.com/watch?v=${ytId}`
      ], { windowsHide: true });

      let responseSent = false;

      // Handle spawn/process errors safely to prevent crashing Node
      child.on('error', async (err) => {
        console.error('yt-dlp spawn error:', err);
        if (responseSent) return;

        // Fallback to previewUrl only if full download process fails and previewUrl exists
        if (track.previewUrl) {
          try {
            const resp = await fetch(track.previewUrl);
            if (resp.ok) {
              const buffer = await resp.arrayBuffer();
              fs.writeFileSync(targetPath, Buffer.from(buffer));
              responseSent = true;
              const stats = fs.statSync(targetPath);
              const list = getDownloadsManifest().filter(i => i.track.id !== track.id);
              list.unshift({
                track,
                filename,
                audioUrl: `/api/download-file/${filename}`,
                sizeBytes: stats.size,
                downloadedAt: new Date().toISOString(),
              });
              saveDownloadsManifest(list);
              return res.json({ success: true, audioUrl: `/api/download-file/${filename}`, sizeBytes: stats.size });
            }
          } catch (fetchErr) {
            console.error('Fallback preview download error:', fetchErr);
          }
        }

        responseSent = true;
        return res.status(500).json({ error: `yt-dlp execution error: ${err.message}` });
      });

      child.on('close', async (code) => {
        if (responseSent) return;

        if (code === 0 && fs.existsSync(targetPath)) {
          responseSent = true;
          const stats = fs.statSync(targetPath);
          const list = getDownloadsManifest().filter(i => i.track.id !== track.id);
          list.unshift({
            track,
            filename,
            audioUrl: `/api/download-file/${filename}`,
            sizeBytes: stats.size,
            downloadedAt: new Date().toISOString(),
          });
          saveDownloadsManifest(list);
          return res.json({ success: true, audioUrl: `/api/download-file/${filename}`, sizeBytes: stats.size });
        } else {
          // If yt-dlp failed (e.g. non-zero exit code), fallback to previewUrl if available
          if (track.previewUrl) {
            try {
              const resp = await fetch(track.previewUrl);
              if (resp.ok) {
                const buffer = await resp.arrayBuffer();
                fs.writeFileSync(targetPath, Buffer.from(buffer));
                responseSent = true;
                const stats = fs.statSync(targetPath);
                const list = getDownloadsManifest().filter(i => i.track.id !== track.id);
                list.unshift({
                  track,
                  filename,
                  audioUrl: `/api/download-file/${filename}`,
                  sizeBytes: stats.size,
                  downloadedAt: new Date().toISOString(),
                });
                saveDownloadsManifest(list);
                return res.json({ success: true, audioUrl: `/api/download-file/${filename}`, sizeBytes: stats.size });
              }
            } catch (fallbackErr) {
              console.error('Fallback preview download error:', fallbackErr);
            }
          }

          responseSent = true;
          return res.status(500).json({ error: 'Download failed' });
        }
      });
      return;
    }

    // Fallback: If no YouTube audio could be resolved, check if previewUrl is available
    if (track.previewUrl) {
      const resp = await fetch(track.previewUrl);
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        fs.writeFileSync(targetPath, Buffer.from(buffer));
        const list = getDownloadsManifest().filter(i => i.track.id !== track.id);
        list.unshift({
          track,
          filename,
          audioUrl: `/api/download-file/${filename}`,
          sizeBytes: buffer.byteLength,
          downloadedAt: new Date().toISOString(),
        });
        saveDownloadsManifest(list);
        return res.json({ success: true, audioUrl: `/api/download-file/${filename}`, sizeBytes: buffer.byteLength });
      }
    }

    res.status(400).json({ error: 'Could not resolve audio stream for track' });
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 8. Delete downloaded track from disk
app.delete('/api/download/:id', (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : String(rawId || '');
  const list = getDownloadsManifest();
  const item = list.find(i => i.track.id === id);
  if (item) {
    const safeItemFilename = path.basename(item.filename);
    const filePath = path.join(downloadsDir, safeItemFilename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    const updated = list.filter(i => i.track.id !== id);
    saveDownloadsManifest(updated);
  }
  res.json({ success: true });
});

// 9. Serve physical downloaded audio file
app.get('/api/download-file/:filename', (req: Request, res: Response) => {
  const rawFilename = req.params.filename;
  const filenameStr = Array.isArray(rawFilename) ? rawFilename[0] : String(rawFilename || '');
  const cleanFilename = path.basename(filenameStr);

  if (!cleanFilename) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const resolvedDownloadsDir = path.resolve(downloadsDir);
  const filePath = path.resolve(resolvedDownloadsDir, cleanFilename);

  // Prevent path traversal outside downloads directory
  if (!filePath.startsWith(resolvedDownloadsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Static files serving for production
app.use(express.static(distPath));
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`[Music Backend] Server is running at http://localhost:${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`[Music Backend] Port ${PORT} already active, continuing.`);
  } else {
    console.error('[Music Backend] Server error:', err);
  }
});
