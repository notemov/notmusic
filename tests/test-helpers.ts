import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const TEST_PORT = Number(process.env.TEST_PORT) || 3099;
export const BASE_URL = `http://localhost:${TEST_PORT}`;

export const WORKSPACE_ROOT = path.resolve(__dirname, '..');
export const SERVER_ENTRY = path.join(WORKSPACE_ROOT, 'server', 'index.ts');
export const TSX_CLI = path.join(WORKSPACE_ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
export const DOWNLOADS_DIR = path.join(WORKSPACE_ROOT, 'downloads');

/**
 * Creates a valid test download audio file (> 1000 bytes) in the downloads directory.
 */
export function createTestDownloadFile(trackId: string, sizeBytes = 2048): string {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
  const cleanId = trackId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanId}.mp3`;
  const targetPath = path.join(DOWNLOADS_DIR, filename);
  const buffer = Buffer.alloc(sizeBytes, 0xaa);
  fs.writeFileSync(targetPath, buffer);
  return filename;
}

/**
 * Cleans up a test download audio file from the downloads directory.
 */
export function cleanupTestDownloadFile(trackId: string): void {
  const cleanId = trackId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanId}.mp3`;
  const targetPath = path.join(DOWNLOADS_DIR, filename);
  if (fs.existsSync(targetPath)) {
    try {
      fs.unlinkSync(targetPath);
    } catch {
      // Ignore deletion errors
    }
  }
}

let serverProcess: ChildProcess | null = null;
let serverSpawnedByUs = false;

/**
 * Polls the test server health/charts endpoint to check if it is accepting requests.
 */
export async function isServerReady(port = TEST_PORT, timeoutMs = 1000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`http://localhost:${port}/api/charts`, { signal: controller.signal });
    clearTimeout(timer);
    return res.status === 200;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

/**
 * Spawns the Express server on isolated test port.
 */
export async function spawnTestServer(port = TEST_PORT, maxWaitMs = 15000): Promise<ChildProcess> {
  if (await isServerReady(port)) {
    return serverProcess as any;
  }

  const proc = spawn(process.execPath, [TSX_CLI, SERVER_ENTRY], {
    cwd: path.join(WORKSPACE_ROOT, 'server'),
    env: {
      ...process.env,
      PORT: String(port),
    },
    windowsHide: true,
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  serverProcess = proc;
  serverSpawnedByUs = true;

  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (await isServerReady(port, 600)) {
      return proc;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  // Timeout reached
  await stopTestServer();
  throw new Error(`Timed out waiting for test server to become ready on port ${port} after ${maxWaitMs}ms`);
}

/**
 * Ensures the test server is running. If not already up, spawns it.
 */
export async function ensureTestServerRunning(port = TEST_PORT): Promise<void> {
  const ready = await isServerReady(port);
  if (!ready) {
    await spawnTestServer(port);
  }
}

/**
 * Stops the test server cleanly using Windows taskkill for the process tree.
 */
export async function stopTestServer(): Promise<void> {
  if (!serverProcess || !serverSpawnedByUs) {
    serverProcess = null;
    return;
  }

  const pid = serverProcess.pid;
  serverProcess = null;
  serverSpawnedByUs = false;

  if (pid) {
    try {
      const killer = spawn('taskkill', ['/F', '/T', '/PID', String(pid)], {
        windowsHide: true,
        stdio: 'ignore',
      });
      await new Promise((resolve) => killer.on('close', resolve));
    } catch {
      // Ignore taskkill errors
    }
  }

  // Wait a moment for OS port release
  await new Promise((r) => setTimeout(r, 500));
}

// -------------------------------------------------------------
// Native HTTP Client Helpers
// -------------------------------------------------------------

export async function apiGet(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  return fetch(url, {
    method: 'GET',
    ...options,
  });
}

export async function apiPost(endpoint: string, body?: any, options?: RequestInit): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = new Headers(options?.headers);
  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, {
    method: 'POST',
    headers,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    ...options,
  });
}

export async function apiDelete(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  return fetch(url, {
    method: 'DELETE',
    ...options,
  });
}

export async function getJson(endpoint: string): Promise<any> {
  const res = await apiGet(endpoint);
  if (!res.ok) {
    throw new Error(`GET ${endpoint} returned status ${res.status}`);
  }
  return res.json();
}

// -------------------------------------------------------------
// Simulation Models: Audio State Machine
// -------------------------------------------------------------

export interface TrackModel {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  duration?: string;
  durationSec?: number;
  source: 'spotify' | 'apple' | 'youtube';
  previewUrl?: string;
  youtubeId?: string;
}

export class PlayerStateMachine {
  currentTrack: TrackModel | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 0.85;
  isMuted = false;
  isShuffle = false;
  repeatMode: 'off' | 'all' | 'one' = 'off';
  queue: TrackModel[] = [];
  queueIndex = -1;

  playTrack(track: TrackModel, newQueue?: TrackModel[]): void {
    this.currentTrack = track;
    this.currentTime = 0;
    this.duration = track.durationSec || 210;
    this.isPlaying = true;

    if (newQueue) {
      this.queue = [...newQueue];
      const idx = this.queue.findIndex((t) => t.id === track.id);
      this.queueIndex = idx >= 0 ? idx : 0;
    } else {
      if (this.queue.length === 0) {
        this.queue = [track];
        this.queueIndex = 0;
      }
    }
  }

  togglePlay(): void {
    if (!this.currentTrack) return;
    this.isPlaying = !this.isPlaying;
  }

  pause(): void {
    this.isPlaying = false;
  }

  playNext(): void {
    if (this.queue.length === 0) return;

    if (this.repeatMode === 'one' && this.currentTrack) {
      this.seekTo(0);
      this.isPlaying = true;
      return;
    }

    let nextIdx = this.queueIndex + 1;
    if (this.isShuffle) {
      nextIdx = Math.floor(Math.random() * this.queue.length);
    }

    if (nextIdx < this.queue.length) {
      this.queueIndex = nextIdx;
      this.playTrack(this.queue[nextIdx], this.queue);
    } else if (this.repeatMode === 'all') {
      this.queueIndex = 0;
      this.playTrack(this.queue[0], this.queue);
    } else {
      this.isPlaying = false;
    }
  }

  playPrevious(): void {
    if (this.currentTime > 4) {
      this.seekTo(0);
      return;
    }
    if (this.queue.length === 0) return;
    const prevIdx = this.queueIndex > 0 ? this.queueIndex - 1 : 0;
    this.queueIndex = prevIdx;
    this.playTrack(this.queue[prevIdx], this.queue);
  }

  seekTo(seconds: number): void {
    if (!this.currentTrack) return;
    const maxSec = this.duration > 0 ? this.duration : 0;
    const clamped = Math.max(0, Math.min(seconds, maxSec));
    this.currentTime = clamped;
  }

  setVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.volume = clamped;
    this.isMuted = clamped === 0;
  }

  toggleMute(): void {
    this.isMuted = !this.isMuted;
  }

  toggleShuffle(): void {
    this.isShuffle = !this.isShuffle;
  }

  cycleRepeatMode(): void {
    if (this.repeatMode === 'off') {
      this.repeatMode = 'all';
    } else if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
    } else {
      this.repeatMode = 'off';
    }
  }

  addToQueue(track: TrackModel): void {
    this.queue.push(track);
  }

  removeFromQueue(index: number): void {
    if (index < 0 || index >= this.queue.length) return;
    this.queue.splice(index, 1);
    if (index === this.queueIndex) {
      this.playNext();
    } else if (index < this.queueIndex) {
      this.queueIndex--;
    }
  }

  clearQueue(): void {
    this.queue = this.currentTrack ? [this.currentTrack] : [];
    this.queueIndex = this.currentTrack ? 0 : -1;
  }
}

// -------------------------------------------------------------
// Simulation Models: Keyboard Shortcuts
// -------------------------------------------------------------

export interface KeydownEventSimulation {
  key: string;
  code?: string;
  targetTag?: string;
  isContentEditable?: boolean;
}

export interface ShortcutCallbacks {
  onTogglePlay?: () => void;
  onToggleMute?: () => void;
  onSeekForward?: (delta: number) => void;
  onSeekBackward?: (delta: number) => void;
  onCloseModals?: () => void;
}

export function dispatchKeyboardShortcut(
  event: KeydownEventSimulation,
  callbacks: ShortcutCallbacks
): boolean {
  // Input elements must not trigger shortcuts
  if (event.targetTag === 'INPUT' || event.targetTag === 'TEXTAREA' || event.isContentEditable) {
    return false;
  }

  const key = event.key;
  const code = event.code;

  if (key === ' ' || code === 'Space') {
    callbacks.onTogglePlay?.();
    return true;
  }

  if (key === 'm' || key === 'M' || code === 'KeyM') {
    callbacks.onToggleMute?.();
    return true;
  }

  if (key === 'ArrowRight' || code === 'ArrowRight') {
    callbacks.onSeekForward?.(10);
    return true;
  }

  if (key === 'ArrowLeft' || code === 'ArrowLeft') {
    callbacks.onSeekBackward?.(10);
    return true;
  }

  if (key === 'Escape' || code === 'Escape') {
    callbacks.onCloseModals?.();
    return true;
  }

  return false;
}

// -------------------------------------------------------------
// Simulation Models: Electron IPC Bridge Contract
// -------------------------------------------------------------

export const ALLOWED_IPC_CHANNELS = [
  'media:togglePlay',
  'media:playNext',
  'media:playPrevious',
  'app:minimize',
  'app:maximize',
  'app:close',
];

export class IPCBridgeSimulator {
  private handlers = new Map<string, (...args: any[]) => void>();

  registerHandler(channel: string, handler: (...args: any[]) => void): void {
    this.handlers.set(channel, handler);
  }

  send(channel: string, ...args: any[]): boolean {
    if (!ALLOWED_IPC_CHANNELS.includes(channel)) {
      return false;
    }
    const handler = this.handlers.get(channel);
    if (handler) {
      handler(...args);
    }
    return true;
  }
}

// -------------------------------------------------------------
// User Data Backup & Restore
// -------------------------------------------------------------

export async function backupUserData(): Promise<any> {
  try {
    const res = await apiGet('/api/user-data');
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Return empty fallback
  }
  return { likedTracks: [], playlists: [], userProfile: null, historyItems: [] };
}

export async function restoreUserData(backupData: any): Promise<void> {
  try {
    await apiPost('/api/user-data', backupData);
  } catch {
    // Ignore restore error
  }
}
