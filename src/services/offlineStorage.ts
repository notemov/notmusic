import { Track } from '../types';

export interface OfflineTrackItem {
  track: Track;
  filename?: string;
  audioUrl: string;
  downloadedAt: string;
  sizeBytes: number;
}

export async function saveOfflineTrack(track: Track): Promise<boolean> {
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
    const tracks = await getOfflineTracks();
    return tracks.some(item => item.track.id === trackId);
  } catch {
    return false;
  }
}

export async function deleteOfflineTrack(trackId: string): Promise<boolean> {
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
