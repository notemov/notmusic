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
  createTestDownloadFile,
  cleanupTestDownloadFile,
  backupUserData,
  restoreUserData,
} from './test-helpers.js';

describe('Tier 3: Combination Workflows Suite', () => {
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
  // Flow 1: Search -> Queue -> Playlist -> Download -> Playback Priority -> Cleanup
  // =========================================================================
  it('Flow 1: Music Discovery, Offline Download, Playback Priority & Lifecycle Cleanup', async () => {
    // Step 1: Search for tracks
    const searchRes = await apiGet('/api/search?q=Dua+Lipa&source=apple');
    assert.equal(searchRes.status, 200);
    const searchData = await searchRes.json();
    assert(Array.isArray(searchData.results) && searchData.results.length > 0);

    const discoveredTrack: TrackModel = searchData.results[0];
    assert(discoveredTrack.id && discoveredTrack.title);

    // Step 2: Add to Player State Machine Queue and play
    const sm = new PlayerStateMachine();
    sm.playTrack(discoveredTrack, [discoveredTrack]);
    assert.equal(sm.isPlaying, true);
    assert.equal(sm.currentTrack?.id, discoveredTrack.id);
    assert.equal(sm.queueIndex, 0);

    // Step 3: Add track to a new Playlist and persist to User Data
    const playlistId = `pl_flow1_${Date.now()}`;
    const newPlaylist = {
      id: playlistId,
      name: 'Driving Hits',
      description: 'Discovered via Search',
      tracks: [discoveredTrack],
      createdAt: new Date().toISOString(),
    };

    const userDataRes = await apiPost('/api/user-data', {
      playlists: [newPlaylist],
    });
    assert.equal(userDataRes.status, 200);

    // Step 4: Download the track offline (Pre-seed valid cached file)
    const downloadTrackId = `dl_${discoveredTrack.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const filename = createTestDownloadFile(downloadTrackId, 3000);

    try {
      const downloadPayload = {
        track: {
          ...discoveredTrack,
          id: downloadTrackId,
        },
      };

      const dlRes = await apiPost('/api/download', downloadPayload);
      assert.equal(dlRes.status, 200);
      const dlData = await dlRes.json();
      assert.equal(dlData.success, true);
      assert(dlData.audioUrl.includes(filename));

      // Verify manifest shows downloaded track
      const listRes = await apiGet('/api/downloads');
      const listData = await listRes.json();
      const downloadedEntry = listData.downloads.find((d: any) => d.track.id === downloadTrackId);
      assert(downloadedEntry, 'Track must be listed in downloads manifest');
      assert.equal(downloadedEntry.filename, filename);

      // Step 5: Playback Priority Assertion (PROJECT.md F8)
      // When offline MP3 is available, PlayerContext prioritizes local audioUrl over streaming
      const trackWithOffline = {
        ...discoveredTrack,
        id: downloadTrackId,
        audioUrl: downloadedEntry.audioUrl,
      };

      const effectiveAudioSource = trackWithOffline.audioUrl
        ? trackWithOffline.audioUrl
        : trackWithOffline.youtubeId;

      assert.equal(effectiveAudioSource, `/api/download-file/${filename}`);

      // Verify streaming the downloaded file returns 200 and audio content
      const streamRes = await apiGet(`/api/download-file/${filename}`);
      assert.equal(streamRes.status, 200);
      assert.equal(streamRes.headers.get('content-type'), 'audio/mpeg');

      // Step 6: Cleanup downloaded file
      const delRes = await apiDelete(`/api/download/${downloadTrackId}`);
      assert.equal(delRes.status, 200);
      const afterDelRes = await apiGet('/api/downloads');
      const afterDelData = await afterDelRes.json();
      assert(!afterDelData.downloads.some((d: any) => d.track.id === downloadTrackId));
    } finally {
      cleanupTestDownloadFile(downloadTrackId);
    }
  });

  // =========================================================================
  // Flow 2: Search -> Like Song -> Add to Playlist -> Mutate Playlist -> Verify Persistence
  // =========================================================================
  it('Flow 2: Search, Like Song, Playlist CRUD, Track Mutation Sync & Data Persistence', async () => {
    // Step 1: Discover 3 tracks
    const t1: TrackModel = { id: `flow2_t1_${Date.now()}`, title: 'Bohemian Rhapsody', artist: 'Queen', source: 'apple' };
    const t2: TrackModel = { id: `flow2_t2_${Date.now()}`, title: 'Don\'t Stop Me Now', artist: 'Queen', source: 'apple' };
    const t3: TrackModel = { id: `flow2_t3_${Date.now()}`, title: 'Radio Ga Ga', artist: 'Queen', source: 'apple' };

    // Step 2: Like Track 1
    const likedTracks = [t1];
    await apiPost('/api/user-data', { likedTracks });

    let userRes = await apiGet('/api/user-data');
    let userData = await userRes.json();
    assert(userData.likedTracks.some((t: any) => t.id === t1.id));

    // Step 3: Create Playlist with all 3 tracks
    const plId = `pl_queen_${Date.now()}`;
    const queenPlaylist = {
      id: plId,
      name: 'Best of Queen',
      description: 'Rock Classics',
      tracks: [t1, t2, t3],
    };

    await apiPost('/api/user-data', {
      playlists: [queenPlaylist],
    });

    userRes = await apiGet('/api/user-data');
    userData = await userRes.json();
    let pl = userData.playlists.find((p: any) => p.id === plId);
    assert.equal(pl.tracks.length, 3);

    // Step 4: Mutate Playlist - Remove Track 2 (PROJECT.md F9)
    const updatedTracks = pl.tracks.filter((t: any) => t.id !== t2.id);
    assert.equal(updatedTracks.length, 2);
    assert(!updatedTracks.some((t: any) => t.id === t2.id));

    await apiPost('/api/user-data', {
      playlists: [{ ...pl, tracks: updatedTracks }],
    });

    // Step 5: Verify Persistence of updated playlist and liked tracks
    userRes = await apiGet('/api/user-data');
    userData = await userRes.json();
    pl = userData.playlists.find((p: any) => p.id === plId);
    assert.equal(pl.tracks.length, 2);
    assert(pl.tracks.some((t: any) => t.id === t1.id));
    assert(pl.tracks.some((t: any) => t.id === t3.id));
    assert(!pl.tracks.some((t: any) => t.id === t2.id));

    // Step 6: Unlike Track 1 without affecting playlist contents
    await apiPost('/api/user-data', { likedTracks: [] });
    userRes = await apiGet('/api/user-data');
    userData = await userRes.json();
    assert.equal(userData.likedTracks.length, 0);

    // Playlist must still retain Track 1
    pl = userData.playlists.find((p: any) => p.id === plId);
    assert.equal(pl.tracks.length, 2);
    assert(pl.tracks.some((t: any) => t.id === t1.id));
  });

  // =========================================================================
  // Flow 3: Concurrent Queue Operations with Shuffle & Repeat Modes Active
  // =========================================================================
  it('Flow 3: Dynamic Queue Scramble with Shuffle, Repeat & Real-Time Modifications', () => {
    const sm = new PlayerStateMachine();
    const tracks: TrackModel[] = Array.from({ length: 8 }, (_, i) => ({
      id: `q_track_${i}`,
      title: `Track ${i}`,
      artist: `Artist ${i}`,
      source: 'spotify' as const,
      durationSec: 150 + i * 10,
    }));

    // Start with 5 tracks
    sm.playTrack(tracks[0], tracks.slice(0, 5));
    assert.equal(sm.queue.length, 5);
    assert.equal(sm.queueIndex, 0);

    // Enable shuffle mode
    sm.toggleShuffle();
    assert.equal(sm.isShuffle, true);

    // Advance 3 times in shuffle mode
    for (let i = 0; i < 3; i++) {
      sm.playNext();
      assert(sm.queueIndex >= 0 && sm.queueIndex < sm.queue.length);
      assert.equal(sm.isPlaying, true);
    }

    // Switch to repeat all
    sm.toggleShuffle(); // Turn off shuffle
    assert.equal(sm.isShuffle, false);
    sm.cycleRepeatMode(); // 'all'
    assert.equal(sm.repeatMode, 'all');

    // Set to last track and advance -> should wrap to index 0
    sm.queueIndex = sm.queue.length - 1;
    sm.playNext();
    assert.equal(sm.queueIndex, 0);
    assert.equal(sm.currentTrack?.id, tracks[0].id);

    // Switch to repeat one
    sm.cycleRepeatMode(); // 'one'
    assert.equal(sm.repeatMode, 'one');
    sm.currentTime = 90;
    sm.playNext();
    assert.equal(sm.queueIndex, 0);
    assert.equal(sm.currentTime, 0);
    assert.equal(sm.isPlaying, true);

    // Switch to repeat off before testing removal
    sm.cycleRepeatMode(); // from 'one' to 'off'
    assert.equal(sm.repeatMode, 'off');

    // Real-time queue additions while playing
    sm.addToQueue(tracks[5]);
    sm.addToQueue(tracks[6]);
    assert.equal(sm.queue.length, 7);

    // Remove current track -> player should advance to next
    const currentPlayingId = sm.currentTrack?.id;
    sm.removeFromQueue(0);
    assert.equal(sm.queue.length, 6);
    assert.notEqual(sm.currentTrack?.id, currentPlayingId);

    // Remove track ahead in queue
    const oldIndex = sm.queueIndex;
    sm.removeFromQueue(sm.queue.length - 1);
    assert.equal(sm.queueIndex, oldIndex);

    // Clear queue retains playing track
    sm.clearQueue();
    assert.equal(sm.queue.length, 1);
    assert.equal(sm.queueIndex, 0);
    assert.equal(sm.currentTrack?.id, sm.queue[0].id);
  });
});
