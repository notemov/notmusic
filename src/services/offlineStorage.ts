import { Capacitor } from '@capacitor/core';
import { Track } from '../types';
import { resolveYouTubeId } from './api';

const isNative = (): boolean => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

export interface OfflineTrackItem {
  track: Track;
  filename?: string;
  audioUrl: string;
  downloadedAt: string;
  sizeBytes: number;
}

const DB_NAME = 'notmusic_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';
const blobUrlCache = new Map<string, string>();

interface StoredOfflineRecord {
  id: string;
  track: Track;
  blob: Blob;
  sizeBytes: number;
  downloadedAt: string;
}

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getOrCreateBlobUrl(id: string, blob: Blob): string {
  const existing = blobUrlCache.get(id);
  if (existing) return existing;
  const url = URL.createObjectURL(blob);
  blobUrlCache.set(id, url);
  return url;
}

async function resolveNativeAudioDownloadUrl(track: Track): Promise<string | null> {
  let ytId = track.youtubeId;
  if (!ytId) {
    ytId = (await resolveYouTubeId(track.title, track.artist)) || undefined;
  }

  // 1. Try YouTube InnerTube iOS player API for direct audio stream
  if (ytId) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X)',
        },
        body: JSON.stringify({
          videoId: ytId,
          context: {
            client: {
              clientName: 'IOS',
              clientVersion: '19.29.1',
              deviceMake: 'Apple',
              deviceModel: 'iPhone16,2',
              osName: 'iPhone',
              osVersion: '17.5.1',
              hl: 'en',
              gl: 'US',
            },
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const formats = data?.streamingData?.adaptiveFormats || [];
        const audioFormat =
          formats.find((f: any) => f.mimeType?.startsWith('audio/mp4') && f.url) ||
          formats.find((f: any) => f.mimeType?.startsWith('audio/') && f.url);
        if (audioFormat?.url) {
          return audioFormat.url;
        }
      }
    } catch {}

    // 2. Fallback to Piped public audio stream API
    const pipedInstances = [
      'https://pipedapi.kavin.rocks',
      'https://api.piped.private.coffee',
    ];
    for (const base of pipedInstances) {
      try {
        const pr = await fetch(`${base}/streams/${ytId}`);
        if (pr.ok) {
          const pData = await pr.json();
          const streams = Array.isArray(pData?.audioStreams) ? pData.audioStreams : [];
          const best = streams.find((s: any) => s.url) || null;
          if (best?.url) return best.url;
        }
      } catch {}
    }
  }

  // 3. Fallback to track previewUrl or quick iTunes lookup
  if (track.previewUrl && !track.previewUrl.startsWith('blob:')) {
    return track.previewUrl;
  }

  try {
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(`${track.artist} ${track.title}`)}&entity=song&limit=1`
    );
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (itunesData?.results?.[0]?.previewUrl) {
        return itunesData.results[0].previewUrl;
      }
    }
  } catch {}

  return null;
}

export async function saveOfflineTrack(track: Track): Promise<boolean> {
  if (isNative()) {
    try {
      const streamUrl = await resolveNativeAudioDownloadUrl(track);
      if (!streamUrl) return false;

      const audioRes = await fetch(streamUrl);
      if (!audioRes.ok) return false;

      const buf = await audioRes.arrayBuffer();
      if (!buf || buf.byteLength < 1024) return false;

      const contentType = audioRes.headers.get('content-type') || 'audio/mp4';
      const blob = new Blob([buf], { type: contentType });

      const db = await openOfflineDB();
      const record: StoredOfflineRecord = {
        id: track.id,
        track: { ...track },
        blob,
        sizeBytes: buf.byteLength,
        downloadedAt: new Date().toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });

      getOrCreateBlobUrl(track.id, blob);
      return true;
    } catch (err) {
      console.error('Native offline download error:', err);
      return false;
    }
  }

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Failed to download track:', err);
    return false;
  }
}

export async function getOfflineTracks(): Promise<{ track: Track; downloadedAt: string; sizeBytes: number; audioUrl: string }[]> {
  if (isNative()) {
    try {
      const db = await openOfflineDB();
      const records = await new Promise<StoredOfflineRecord[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve((req.result || []) as StoredOfflineRecord[]);
        req.onerror = () => reject(req.error);
      });
      return records
        .sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
        .map(rec => {
          const audioUrl = getOrCreateBlobUrl(rec.id, rec.blob);
          return {
            track: { ...rec.track, previewUrl: audioUrl },
            downloadedAt: rec.downloadedAt,
            sizeBytes: rec.sizeBytes,
            audioUrl,
          };
        });
    } catch (err) {
      console.error('Failed to read native downloads:', err);
      return [];
    }
  }

  try {
    const res = await fetch('/api/downloads');
    const data = await res.json();
    return data.downloads || [];
  } catch (err) {
    console.error('Failed to fetch downloads:', err);
    return [];
  }
}

export async function getOfflineAudioUrl(trackId: string): Promise<string | null> {
  if (isNative()) {
    try {
      const cached = blobUrlCache.get(trackId);
      if (cached) return cached;
      const db = await openOfflineDB();
      const rec = await new Promise<StoredOfflineRecord | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(trackId);
        req.onsuccess = () => resolve(req.result as StoredOfflineRecord | undefined);
        req.onerror = () => reject(req.error);
      });
      return rec ? getOrCreateBlobUrl(rec.id, rec.blob) : null;
    } catch {
      return null;
    }
  }

  try {
    const tracks = await getOfflineTracks();
    const match = tracks.find(item => item.track.id === trackId);
    return match ? match.audioUrl : null;
  } catch {
    return null;
  }
}

export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  try {
    if (isNative()) {
      const url = await getOfflineAudioUrl(trackId);
      return !!url;
    }
    const tracks = await getOfflineTracks();
    return tracks.some(item => item.track.id === trackId);
  } catch {
    return false;
  }
}

export async function deleteOfflineTrack(trackId: string): Promise<boolean> {
  if (isNative()) {
    try {
      const existingUrl = blobUrlCache.get(trackId);
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl);
        blobUrlCache.delete(trackId);
      }
      const db = await openOfflineDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(trackId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch {
      return false;
    }
  }

  try {
    const res = await fetch(`/api/download/${encodeURIComponent(trackId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}
