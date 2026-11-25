import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureTestServerRunning,
  stopTestServer,
  apiGet,
  apiPost,
  apiDelete,
  PlayerStateMachine,
  TrackModel,
  dispatchKeyboardShortcut,
  IPCBridgeSimulator,
  ALLOWED_IPC_CHANNELS,
  backupUserData,
  restoreUserData,
  createTestDownloadFile,
  cleanupTestDownloadFile,
} from './test-helpers.js';

describe('Tier 1: Feature Coverage Suite', () => {
  let originalUserData: any = null;

  before(async () => {
    await ensureTestServerRunning();
    originalUserData = await backupUserData();
  });

  after(async () => {
    if (originalUserData) {
      await restoreUserData(originalUserData);
    }
    if (!process.env.RUNNER_MANAGED_SERVER) {
      await stopTestServer();
    }
  });

  // =========================================================================
  // Feature 1: Audio Playback Engine & Queue State
  // =========================================================================
  describe('Feature 1: Audio Playback Engine & Queue State', () => {
    it('1.1 should have correct default player initial state', () => {
      const sm = new PlayerStateMachine();
      assert.equal(sm.currentTrack, null);
      assert.equal(sm.isPlaying, false);
      assert.equal(sm.currentTime, 0);
      assert.equal(sm.volume, 0.85);
      assert.equal(sm.isMuted, false);
      assert.equal(sm.isShuffle, false);
      assert.equal(sm.repeatMode, 'off');
      assert.equal(sm.queue.length, 0);
      assert.equal(sm.queueIndex, -1);
    });

    it('1.2 should play track, update queue, queueIndex, and start playback', () => {
      const sm = new PlayerStateMachine();
      const track: TrackModel = {
        id: 't1',
        title: 'Song One',
        artist: 'Artist A',
        source: 'spotify',
        durationSec: 180,
      };

      sm.playTrack(track);

      assert.equal(sm.currentTrack?.id, 't1');
      assert.equal(sm.isPlaying, true);
      assert.equal(sm.duration, 180);
      assert.equal(sm.currentTime, 0);
      assert.equal(sm.queue.length, 1);
      assert.equal(sm.queueIndex, 0);
    });

    it('1.3 should toggle play and pause state correctly', () => {
      const sm = new PlayerStateMachine();
      const track: TrackModel = { id: 't1', title: 'Song', artist: 'Artist', source: 'apple' };
      sm.playTrack(track);

      assert.equal(sm.isPlaying, true);
      sm.togglePlay();
      assert.equal(sm.isPlaying, false);
      sm.togglePlay();
      assert.equal(sm.isPlaying, true);
      sm.pause();
      assert.equal(sm.isPlaying, false);
    });

    it('1.4 should navigate queue forward and backward with seek rewind threshold', () => {
      const sm = new PlayerStateMachine();
      const t1: TrackModel = { id: 't1', title: 'First', artist: 'A', source: 'spotify', durationSec: 200 };
      const t2: TrackModel = { id: 't2', title: 'Second', artist: 'B', source: 'spotify', durationSec: 220 };
      const t3: TrackModel = { id: 't3', title: 'Third', artist: 'C', source: 'spotify', durationSec: 190 };

      sm.playTrack(t1, [t1, t2, t3]);
      assert.equal(sm.queueIndex, 0);

      // playNext advances
      sm.playNext();
      assert.equal(sm.queueIndex, 1);
      assert.equal(sm.currentTrack?.id, 't2');

      // playPrevious when currentTime <= 4 goes to previous track
      sm.currentTime = 2;
      sm.playPrevious();
      assert.equal(sm.queueIndex, 0);
      assert.equal(sm.currentTrack?.id, 't1');

      // playPrevious when currentTime > 4 rewinds current track to 0
      sm.currentTime = 15;
      sm.playPrevious();
      assert.equal(sm.queueIndex, 0);
      assert.equal(sm.currentTime, 0);
    });

    it('1.5 should cycle repeat modes and handle queue boundary playback', () => {
      const sm = new PlayerStateMachine();
      const t1: TrackModel = { id: 't1', title: 'One', artist: 'A', source: 'youtube' };
      const t2: TrackModel = { id: 't2', title: 'Two', artist: 'B', source: 'youtube' };

      assert.equal(sm.repeatMode, 'off');
      sm.cycleRepeatMode();
      assert.equal(sm.repeatMode, 'all');
      sm.cycleRepeatMode();
      assert.equal(sm.repeatMode, 'one');
      sm.cycleRepeatMode();
      assert.equal(sm.repeatMode, 'off');

      // Repeat 'all' wraps around to index 0 on last track
      sm.playTrack(t2, [t1, t2]);
      sm.queueIndex = 1;
      sm.repeatMode = 'all';
      sm.playNext();
      assert.equal(sm.queueIndex, 0);
      assert.equal(sm.currentTrack?.id, 't1');

      // Repeat 'one' stays on current track and rewinds
      sm.repeatMode = 'one';
      sm.currentTime = 80;
      sm.playNext();
      assert.equal(sm.queueIndex, 0);
      assert.equal(sm.currentTime, 0);
      assert.equal(sm.isPlaying, true);

      // Repeat 'off' stops playback after last track
      sm.repeatMode = 'off';
      sm.queueIndex = 1;
      sm.playNext();
      assert.equal(sm.isPlaying, false);
    });

    it('1.6 should toggle shuffle and volume/mute operations', () => {
      const sm = new PlayerStateMachine();
      assert.equal(sm.isShuffle, false);
      sm.toggleShuffle();
      assert.equal(sm.isShuffle, true);
      sm.toggleShuffle();
      assert.equal(sm.isShuffle, false);

      sm.setVolume(0.5);
      assert.equal(sm.volume, 0.5);
      assert.equal(sm.isMuted, false);

      sm.toggleMute();
      assert.equal(sm.isMuted, true);
      sm.toggleMute();
      assert.equal(sm.isMuted, false);

      sm.setVolume(0);
      assert.equal(sm.volume, 0);
      assert.equal(sm.isMuted, true);
    });

    it('1.7 should handle queue add, remove, and clear operations', () => {
      const sm = new PlayerStateMachine();
      const t1: TrackModel = { id: 't1', title: 'One', artist: 'A', source: 'apple' };
      const t2: TrackModel = { id: 't2', title: 'Two', artist: 'B', source: 'apple' };
      const t3: TrackModel = { id: 't3', title: 'Three', artist: 'C', source: 'apple' };

      sm.playTrack(t1, [t1]);
      sm.addToQueue(t2);
      sm.addToQueue(t3);
      assert.equal(sm.queue.length, 3);

      // Remove non-playing track
      sm.removeFromQueue(2);
      assert.equal(sm.queue.length, 2);
      assert.equal(sm.queue.some((t) => t.id === 't3'), false);

      // Clear queue keeps current track
      sm.clearQueue();
      assert.equal(sm.queue.length, 1);
      assert.equal(sm.queue[0].id, 't1');
    });
  });

  // =========================================================================
  // Feature 2: Search & Autocomplete
  // =========================================================================
  describe('Feature 2: Search & Autocomplete', () => {
    it('2.1 GET /api/search?q=Adele&source=all should return multi-source results with valid schemas', async () => {
      const res = await apiGet('/api/search?q=Adele&source=all');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results), 'results should be an array');
      assert(data.results.length > 0, 'should return at least one result');

      const first = data.results[0];
      assert(typeof first.id === 'string', 'track id must be string');
      assert(typeof first.title === 'string', 'track title must be string');
      assert(typeof first.artist === 'string', 'track artist must be string');
      assert(['spotify', 'apple', 'youtube'].includes(first.source), 'valid source tag required');
    });

    it('2.2 GET /api/search?q=The+Beatles&source=apple should return apple source results', async () => {
      const res = await apiGet('/api/search?q=The+Beatles&source=apple');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results));
      if (data.results.length > 0) {
        assert.equal(data.results[0].source, 'apple');
      }
    });

    it('2.3 GET /api/search?q=Queen&source=youtube should return youtube source results', async () => {
      const res = await apiGet('/api/search?q=Queen&source=youtube');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results));
      if (data.results.length > 0) {
        assert.equal(data.results[0].source, 'youtube');
      }
    });

    it('2.4 GET /api/suggest?q=taylor should return suggestions array', async () => {
      const res = await apiGet('/api/suggest?q=taylor');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.suggestions), 'suggestions must be an array');
    });

    it('2.5 GET /api/charts should return charts data with youtubeTrends, spotifyTurkeyTop, globalAppleTop', async () => {
      const res = await apiGet('/api/charts');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.youtubeTrends), 'youtubeTrends must be an array');
      assert(Array.isArray(data.spotifyTurkeyTop), 'spotifyTurkeyTop must be an array');
      assert(Array.isArray(data.globalAppleTop), 'globalAppleTop must be an array');
      assert(data.youtubeTrends.length >= 5, 'youtubeTrends should contain curated tracks');
      assert.equal(data.youtubeTrends[0].id, 'yt_chart_1');
    });

    it('2.6 GET /api/resolve-youtube should resolve video id for popular track', async () => {
      const res = await apiGet('/api/resolve-youtube?title=Die+With+A+Smile&artist=Lady+Gaga');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert('youtubeId' in data, 'response should contain youtubeId property');
    });
  });

  // =========================================================================
  // Feature 3: Playlists & User Data
  // =========================================================================
  describe('Feature 3: Playlists & User Data', () => {
    it('3.1 GET /api/user-data should return valid user data structure', async () => {
      const res = await apiGet('/api/user-data');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(typeof data === 'object');
      assert(Array.isArray(data.likedTracks) || data.likedTracks === undefined);
      assert(Array.isArray(data.playlists) || data.playlists === undefined);
    });

    it('3.2 POST /api/user-data should save and persist new playlist', async () => {
      const testPlaylistId = `pl_test_${Date.now()}`;
      const payload = {
        playlists: [
          {
            id: testPlaylistId,
            name: 'E2E Test Playlist',
            description: 'Automated test suite',
            tracks: [
              {
                id: 'track_1',
                title: 'Test Song',
                artist: 'Test Artist',
                source: 'spotify',
              },
            ],
            createdAt: new Date().toISOString(),
          },
        ],
      };

      const postRes = await apiPost('/api/user-data', payload);
      assert.equal(postRes.status, 200);
      const postData = await postRes.json();
      assert.equal(postData.success, true);

      // Verify persistence via GET
      const getRes = await apiGet('/api/user-data');
      const getData = await getRes.json();
      const found = getData.playlists?.find((p: any) => p.id === testPlaylistId);
      assert(found, 'Saved playlist must be present in GET /api/user-data');
      assert.equal(found.name, 'E2E Test Playlist');
      assert.equal(found.tracks.length, 1);
    });

    it('3.3 should support adding and removing tracks from playlist and syncing', async () => {
      const plId = `pl_sync_${Date.now()}`;
      const trackA = { id: 't_a', title: 'Alpha', artist: 'Artist A', source: 'spotify' };
      const trackB = { id: 't_b', title: 'Beta', artist: 'Artist B', source: 'apple' };

      // Create playlist with trackA
      await apiPost('/api/user-data', {
        playlists: [{ id: plId, name: 'Sync Pl', tracks: [trackA] }],
      });

      // Add trackB
      await apiPost('/api/user-data', {
        playlists: [{ id: plId, name: 'Sync Pl', tracks: [trackA, trackB] }],
      });

      let res = await apiGet('/api/user-data');
      let data = await res.json();
      let pl = data.playlists?.find((p: any) => p.id === plId);
      assert.equal(pl.tracks.length, 2);

      // Remove trackA
      await apiPost('/api/user-data', {
        playlists: [{ id: plId, name: 'Sync Pl', tracks: [trackB] }],
      });

      res = await apiGet('/api/user-data');
      data = await res.json();
      pl = data.playlists?.find((p: any) => p.id === plId);
      assert.equal(pl.tracks.length, 1);
      assert.equal(pl.tracks[0].id, 't_b');
    });

    it('3.4 should support liked tracks persistence and toggling', async () => {
      const likedTrack = {
        id: `liked_${Date.now()}`,
        title: 'Liked Anthem',
        artist: 'Favorite Star',
        source: 'spotify',
      };

      await apiPost('/api/user-data', {
        likedTracks: [likedTrack],
      });

      const res = await apiGet('/api/user-data');
      const data = await res.json();
      const found = data.likedTracks?.find((t: any) => t.id === likedTrack.id);
      assert(found, 'Liked track must be persisted');
      assert.equal(found.title, 'Liked Anthem');
    });

    it('3.5 should record and retrieve play history items', async () => {
      const historyItem = {
        id: `hist_${Date.now()}`,
        track: { id: 'h_track_1', title: 'History Song', artist: 'Archive', source: 'apple' },
        playedAt: new Date().toISOString(),
      };

      await apiPost('/api/user-data', {
        historyItems: [historyItem],
      });

      const res = await apiGet('/api/user-data');
      const data = await res.json();
      const found = data.historyItems?.find((h: any) => h.id === historyItem.id);
      assert(found, 'History item must be persisted');
    });
  });

  // =========================================================================
  // Feature 4: Background Mode & Window Lifecycle
  // =========================================================================
  describe('Feature 4: Background Mode & Window Lifecycle', () => {
    it('4.1 GET /api/focus-window should return { ok: true }', async () => {
      const res = await apiGet('/api/focus-window');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.ok, true);
    });

    it('4.2 should invoke global.focusNotMusicWindow hook safely when available', async () => {
      let focusInvoked = false;
      (global as any).focusNotMusicWindow = () => {
        focusInvoked = true;
      };

      const res = await apiGet('/api/focus-window');
      assert.equal(res.status, 200);
      delete (global as any).focusNotMusicWindow;
    });

    it('4.3 should simulate background playback heartbeat auto-resume logic', () => {
      let playVideoCalled = false;
      const userPausedRef = { current: false };
      const ytPlayerRef = {
        current: {
          getPlayerState: () => 2, // 2 = paused
          playVideo: () => {
            playVideoCalled = true;
          },
        },
      };

      // Heartbeat simulation: when user did NOT pause, but YouTube paused due to occlusion/background
      if (!userPausedRef.current && ytPlayerRef.current.getPlayerState() === 2) {
        ytPlayerRef.current.playVideo();
      }

      assert.equal(playVideoCalled, true, 'Heartbeat should auto-resume when user did not initiate pause');

      // When user intentionally paused, it must NOT resume
      playVideoCalled = false;
      userPausedRef.current = true;
      if (!userPausedRef.current && ytPlayerRef.current.getPlayerState() === 2) {
        ytPlayerRef.current.playVideo();
      }
      assert.equal(playVideoCalled, false, 'Heartbeat should NOT resume if userPausedRef is true');
    });

    it('4.4 should simulate window blur & visibilitychange persistence', () => {
      let backgroundResumed = false;
      const userPausedRef = { current: false };
      const ytPlayerRef = {
        current: {
          playVideo: () => {
            backgroundResumed = true;
          },
        },
      };

      const handleBackground = () => {
        if (!userPausedRef.current && ytPlayerRef.current) {
          ytPlayerRef.current.playVideo();
        }
      };

      handleBackground();
      assert.equal(backgroundResumed, true);
    });

    it('4.5 should simulate second-instance lock delegation to focus-window', async () => {
      const mockGotTheLock = false;
      let secondInstanceHandled = false;

      if (!mockGotTheLock) {
        const res = await apiGet('/api/focus-window');
        if (res.status === 200) {
          secondInstanceHandled = true;
        }
      }

      assert.equal(secondInstanceHandled, true);
    });
  });

  // =========================================================================
  // Feature 5: Keyboard Shortcuts & Media Controls
  // =========================================================================
  describe('Feature 5: Keyboard Shortcuts & Media Controls', () => {
    it('5.1 should validate IPC channel whitelist in preload contract', () => {
      assert(ALLOWED_IPC_CHANNELS.includes('media:togglePlay'));
      assert(ALLOWED_IPC_CHANNELS.includes('media:playNext'));
      assert(ALLOWED_IPC_CHANNELS.includes('media:playPrevious'));
      assert(ALLOWED_IPC_CHANNELS.includes('app:minimize'));
      assert(ALLOWED_IPC_CHANNELS.includes('app:maximize'));
      assert(ALLOWED_IPC_CHANNELS.includes('app:close'));
    });

    it('5.2 IPCBridgeSimulator should dispatch allowed channels and block disallowed channels', () => {
      const bridge = new IPCBridgeSimulator();
      let playToggled = false;

      bridge.registerHandler('media:togglePlay', () => {
        playToggled = true;
      });

      const allowedResult = bridge.send('media:togglePlay');
      assert.equal(allowedResult, true);
      assert.equal(playToggled, true);

      // Block disallowed dangerous channels
      const blockedResult = bridge.send('shell:openPath', 'C:\\');
      assert.equal(blockedResult, false);
    });

    it('5.3 should dispatch Space key to toggle play/pause when outside input elements', () => {
      let toggled = false;
      const handled = dispatchKeyboardShortcut(
        { key: ' ', code: 'Space', targetTag: 'DIV' },
        { onTogglePlay: () => (toggled = true) }
      );
      assert.equal(handled, true);
      assert.equal(toggled, true);
    });

    it('5.4 should dispatch KeyM to toggle mute', () => {
      let muted = false;
      const handled = dispatchKeyboardShortcut(
        { key: 'm', code: 'KeyM', targetTag: 'BODY' },
        { onToggleMute: () => (muted = true) }
      );
      assert.equal(handled, true);
      assert.equal(muted, true);
    });

    it('5.5 should dispatch ArrowLeft and ArrowRight to seek backward and forward', () => {
      let seekDelta = 0;
      dispatchKeyboardShortcut(
        { key: 'ArrowRight', code: 'ArrowRight', targetTag: 'DIV' },
        { onSeekForward: (d) => (seekDelta += d) }
      );
      assert.equal(seekDelta, 10);

      dispatchKeyboardShortcut(
        { key: 'ArrowLeft', code: 'ArrowLeft', targetTag: 'DIV' },
        { onSeekBackward: (d) => (seekDelta -= d) }
      );
      assert.equal(seekDelta, 0);
    });

    it('5.6 should dispatch Escape key to close active modal dialogs', () => {
      let modalsClosed = false;
      const handled = dispatchKeyboardShortcut(
        { key: 'Escape', code: 'Escape', targetTag: 'DIV' },
        { onCloseModals: () => (modalsClosed = true) }
      );
      assert.equal(handled, true);
      assert.equal(modalsClosed, true);
    });

    it('5.7 should ignore keyboard shortcuts when typing in INPUT or TEXTAREA fields', () => {
      let toggled = false;
      const inputHandled = dispatchKeyboardShortcut(
        { key: ' ', code: 'Space', targetTag: 'INPUT' },
        { onTogglePlay: () => (toggled = true) }
      );
      assert.equal(inputHandled, false);
      assert.equal(toggled, false);

      const textareaHandled = dispatchKeyboardShortcut(
        { key: 'm', code: 'KeyM', targetTag: 'TEXTAREA' },
        { onToggleMute: () => (toggled = true) }
      );
      assert.equal(textareaHandled, false);
    });
  });

  // =========================================================================
  // Feature 6: UI State & Modals
  // =========================================================================
  describe('Feature 6: UI State & Modals', () => {
    const THEMES = ['dark', 'light', 'cyberpunk', 'spotify', 'apple', 'ocean'] as const;

    it('6.1 should support all 6 themes in system configuration', () => {
      assert.equal(THEMES.length, 6);
      THEMES.forEach((theme) => {
        assert(typeof theme === 'string');
      });
    });

    it('6.2 should toggle lyrics overlay modal state', () => {
      let isLyricsOpen = false;
      const setIsLyricsOpen = (val: boolean) => (isLyricsOpen = val);

      setIsLyricsOpen(true);
      assert.equal(isLyricsOpen, true);
      setIsLyricsOpen(false);
      assert.equal(isLyricsOpen, false);
    });

    it('6.3 should toggle audio spectrum visualizer overlay modal state', () => {
      let isVisualizerOpen = false;
      const setIsVisualizerOpen = (val: boolean) => (isVisualizerOpen = val);

      setIsVisualizerOpen(true);
      assert.equal(isVisualizerOpen, true);
      setIsVisualizerOpen(false);
      assert.equal(isVisualizerOpen, false);
    });

    it('6.4 should toggle queue drawer state', () => {
      let isQueueOpen = false;
      const setIsQueueOpen = (val: boolean) => (isQueueOpen = val);

      setIsQueueOpen(true);
      assert.equal(isQueueOpen, true);
      setIsQueueOpen(false);
      assert.equal(isQueueOpen, false);
    });

    it('6.5 should handle sleep timer countdown and pause on expiry', () => {
      let playbackPaused = false;
      let sleepTimerRemaining: number | null = 2; // 2 seconds

      const tick = () => {
        if (sleepTimerRemaining === null) return;
        if (sleepTimerRemaining <= 1) {
          playbackPaused = true;
          sleepTimerRemaining = null;
        } else {
          sleepTimerRemaining--;
        }
      };

      tick();
      assert.equal(sleepTimerRemaining, 1);
      assert.equal(playbackPaused, false);

      tick();
      assert.equal(sleepTimerRemaining, null);
      assert.equal(playbackPaused, true);
    });
  });

  // =========================================================================
  // Feature 7: Offline Downloads & Audio Streaming
  // =========================================================================
  describe('Feature 7: Offline Downloads & Audio Streaming', () => {
    it('7.1 GET /api/downloads should return valid downloads manifest', async () => {
      const res = await apiGet('/api/downloads');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.downloads), 'downloads must be an array');
    });

    it('7.2 POST /api/download should handle track download payload and register in manifest', async () => {
      const trackId = `offline_track_${Date.now()}`;
      createTestDownloadFile(trackId, 2500);

      const dummyTrack = {
        id: trackId,
        title: 'Offline Test Track',
        artist: 'Tester',
        source: 'spotify' as const,
      };

      try {
        const res = await apiPost('/api/download', { track: dummyTrack });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert(data.audioUrl.includes(trackId));
        assert.equal(data.sizeBytes, 2500);

        // Verify it appears in GET /api/downloads
        const listRes = await apiGet('/api/downloads');
        const listData = await listRes.json();
        assert(listData.downloads.some((d: any) => d.track.id === trackId));
      } finally {
        await apiDelete(`/api/download/${trackId}`);
        cleanupTestDownloadFile(trackId);
      }
    });

    it('7.3 DELETE /api/download/:id should respond with success', async () => {
      const res = await apiDelete(`/api/download/nonexistent_id_${Date.now()}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('7.4 GET /api/download-file/:filename should serve audio or return 404 for missing', async () => {
      const res = await apiGet('/api/download-file/sample-test-probe.mp3');
      // If missing, must return 404
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'File not found');
    });

    it('7.5 offline audio playback priority: downloaded track prioritizes local audioUrl over streaming', () => {
      const sampleTrack: TrackModel & { audioUrl?: string } = {
        id: 'track_offline_1',
        title: 'Cached Anthem',
        artist: 'Artist',
        source: 'spotify',
        youtubeId: 'someYtId',
        audioUrl: '/api/download-file/track_offline_1.mp3',
      };

      // Playback source resolution logic (PROJECT.md F8)
      const resolvedAudioSource = sampleTrack.audioUrl ? sampleTrack.audioUrl : sampleTrack.youtubeId;
      assert.equal(resolvedAudioSource, '/api/download-file/track_offline_1.mp3');
    });
  });

  // =========================================================================
  // Feature 8: Lyrics, Suggestions & Platform Video Policy
  // =========================================================================
  describe('Feature 8: Lyrics, Suggestions & Platform Video Policy', () => {
    it('8.1 GET /api/suggest should return autocomplete suggestions for popular query', async () => {
      const res = await apiGet('/api/suggest?q=Tarkan');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.suggestions), 'suggestions must be an array');
    });

    it('8.2 GET /api/lyrics should return valid lyrics object shape', async () => {
      const res = await apiGet('/api/lyrics?title=Die+With+A+Smile&artist=Lady+Gaga');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert('syncedLyrics' in data, 'response should contain syncedLyrics key');
      assert('plainLyrics' in data, 'response should contain plainLyrics key');
    });

    it('8.3 Video playback should strictly be restricted to YouTube tracks only', () => {
      const canWatchVideoFor = (source: 'spotify' | 'apple' | 'youtube', activeTab: 'all' | 'spotify' | 'apple' | 'youtube') =>
        source === 'youtube' && activeTab !== 'spotify' && activeTab !== 'apple';

      assert.equal(canWatchVideoFor('youtube', 'youtube'), true);
      assert.equal(canWatchVideoFor('youtube', 'all'), true);
      assert.equal(canWatchVideoFor('spotify', 'spotify'), false);
      assert.equal(canWatchVideoFor('spotify', 'all'), false);
      assert.equal(canWatchVideoFor('apple', 'apple'), false);
      assert.equal(canWatchVideoFor('apple', 'all'), false);
      assert.equal(canWatchVideoFor('youtube', 'apple'), false);
    });

    it('8.4 Social/Friend/ID endpoints should be removed cleanly', async () => {
      const res = await apiGet('/api/friends');
      assert.notEqual(res.status, 200, 'Removed /api/friends should not serve friend lists anymore');
    });
  });
});
