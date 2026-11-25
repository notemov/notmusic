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
  backupUserData,
  restoreUserData,
} from './test-helpers.js';

describe('Tier 2: Boundary & Corner Cases Suite', () => {
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
  // Area 1: Search Queries Boundaries
  // =========================================================================
  describe('Area 1: Search Queries Boundaries', () => {
    it('1.1 empty search query ?q= should return empty results array without crashing', async () => {
      const res = await apiGet('/api/search?q=');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data.results, []);
    });

    it('1.2 whitespace-only search query ?q=%20%20%20 should return empty results', async () => {
      const res = await apiGet('/api/search?q=%20%20%20');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data.results, []);
    });

    it('1.3 search query with Turkish Unicode characters (ş, ğ, ç, ı, ö, ü) should succeed', async () => {
      const query = encodeURIComponent('şarkı söyle güneş');
      const res = await apiGet(`/api/search?q=${query}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results));
    });

    it('1.4 search query with Turkish uppercase Unicode (İ, Ğ, Ş, Ç, Ö, Ü) should succeed', async () => {
      const query = encodeURIComponent('İSTANBUL ÖZLEM ÇAĞLAYAN');
      const res = await apiGet(`/api/search?q=${query}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results));
    });

    it('1.5 search query with special punctuation symbols (!@#$%^&*()_+) should not crash', async () => {
      const query = encodeURIComponent('!@#$%^&*()_+');
      const res = await apiGet(`/api/search?q=${query}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results));
    });

    it('1.6 search query with emoji characters (🎵🎶🎧) should not crash', async () => {
      const query = encodeURIComponent('🎵🎶🎧');
      const res = await apiGet(`/api/search?q=${query}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results));
    });

    it('1.7 very long search query (1000+ characters) should be handled safely', async () => {
      const longQuery = encodeURIComponent('A'.repeat(1200));
      const res = await apiGet(`/api/search?q=${longQuery}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.results));
    });

    it('1.8 invalid source parameter ?source=nonexistent should handle gracefully', async () => {
      const res = await apiGet('/api/search?q=test&source=nonexistent');
      assert([200, 400].includes(res.status));
    });
  });

  // =========================================================================
  // Area 2: Autocomplete / Suggest Boundaries
  // =========================================================================
  describe('Area 2: Autocomplete / Suggest Boundaries', () => {
    it('2.1 empty suggest query ?q= should return empty suggestions array', async () => {
      const res = await apiGet('/api/suggest?q=');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data.suggestions, []);
    });

    it('2.2 whitespace suggest query ?q=%20%20 should return empty suggestions array', async () => {
      const res = await apiGet('/api/suggest?q=%20%20');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data.suggestions, []);
    });

    it('2.3 suggest query with Turkish Unicode characters should execute without error', async () => {
      const query = encodeURIComponent('türkçe pop');
      const res = await apiGet(`/api/suggest?q=${query}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.suggestions));
    });

    it('2.4 suggest query with HTML/script characters should be safely handled', async () => {
      const query = encodeURIComponent('<script>alert("xss")</script>');
      const res = await apiGet(`/api/suggest?q=${query}`);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert(Array.isArray(data.suggestions));
    });

    it('2.5 missing query parameter GET /api/suggest should return empty suggestions', async () => {
      const res = await apiGet('/api/suggest');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.deepEqual(data.suggestions, []);
    });
  });

  // =========================================================================
  // Area 3: Missing Required Query Parameters & 400 Handling
  // =========================================================================
  describe('Area 3: Missing Required Query Parameters & 400 Handling', () => {
    it('3.1 GET /api/lyrics with missing title parameter should return 400', async () => {
      const res = await apiGet('/api/lyrics?artist=Queen');
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Title required');
    });

    it('3.2 GET /api/lyrics with empty title ?title= should return 400', async () => {
      const res = await apiGet('/api/lyrics?title=&artist=Queen');
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Title required');
    });

    it('3.3 GET /api/lyrics with whitespace-only title ?title=%20%20 should return 400', async () => {
      const res = await apiGet('/api/lyrics?title=%20%20&artist=Queen');
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Title required');
    });

    it('3.4 GET /api/resolve-youtube with missing title parameter should return 400', async () => {
      const res = await apiGet('/api/resolve-youtube?artist=Queen');
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Title required');
    });

    it('3.5 GET /api/resolve-youtube with empty title ?title= should return 400', async () => {
      const res = await apiGet('/api/resolve-youtube?title=&artist=Queen');
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Title required');
    });

    it('3.6 GET /api/resolve-youtube with whitespace title should return 400', async () => {
      const res = await apiGet('/api/resolve-youtube?title=%20%20%20');
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Title required');
    });
  });

  // =========================================================================
  // Area 4: Security & Path Traversal Sanitization
  // =========================================================================
  describe('Area 4: Security & Path Traversal Sanitization', () => {
    it('4.1 GET /api/download-file/non-existent-file-xyz.mp3 should return 404', async () => {
      const res = await apiGet('/api/download-file/non-existent-file-xyz.mp3');
      assert.equal(res.status, 404);
      const data = await res.json();
      assert.equal(data.error, 'File not found');
    });

    it('4.2 Path Traversal: ..%2f..%2fpackage.json should not expose project files', async () => {
      const res = await apiGet('/api/download-file/..%2f..%2fpackage.json');
      assert.notEqual(res.status, 200);
      assert([400, 403, 404].includes(res.status));
    });

    it('4.3 Deep Path Traversal: ..%2f..%2f..%2fWindows%2fwin.ini should be blocked', async () => {
      const res = await apiGet('/api/download-file/..%2f..%2f..%2fWindows%2fwin.ini');
      assert.notEqual(res.status, 200);
      assert([400, 403, 404].includes(res.status));
    });

    it('4.4 Encoded Path Traversal: %2e%2e%2f%2e%2e%2fpackage.json should be blocked', async () => {
      const res = await apiGet('/api/download-file/%2e%2e%2f%2e%2e%2fpackage.json');
      assert.notEqual(res.status, 200);
      assert([400, 403, 404].includes(res.status));
    });

    it('4.5 Windows Path Traversal: ..%5C..%5Cpackage.json should be blocked', async () => {
      const res = await apiGet('/api/download-file/..%5C..%5Cpackage.json');
      assert.notEqual(res.status, 200);
      assert([400, 403, 404].includes(res.status));
    });

    it('4.6 Unencoded path traversal must not leak package.json contents', async () => {
      const res = await apiGet('/api/download-file/../../package.json');
      const text = await res.text();
      assert(!text.includes('"name": "notmusic"'), 'Must never leak raw package.json contents');
    });

    it('4.7 Whitespace-only filename /api/download-file/%20 should return 400 or 404', async () => {
      const res = await apiGet('/api/download-file/%20');
      assert([400, 404].includes(res.status));
    });
  });

  // =========================================================================
  // Area 5: Malformed Payloads & Express Request Safety
  // =========================================================================
  describe('Area 5: Malformed Payloads & Express Request Safety', () => {
    it('5.1 POST /api/download with empty JSON body should return 400', async () => {
      const res = await apiPost('/api/download', {});
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Track is required');
    });

    it('5.2 POST /api/download with track missing id should return 400', async () => {
      const res = await apiPost('/api/download', { track: { title: 'No ID' } });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.equal(data.error, 'Track is required');
    });

    it('5.3 POST /api/download with null body should return 400', async () => {
      const res = await apiPost('/api/download', null);
      assert.equal(res.status, 400);
    });

    it('5.4 POST /api/user-data with empty body {} should succeed safely', async () => {
      const res = await apiPost('/api/user-data', {});
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('5.5 POST /api/user-data with extra unexpected fields should not crash', async () => {
      const res = await apiPost('/api/user-data', {
        unexpectedCustomKey: { nested: 123 },
        anotherKey: 'test',
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });

    it('5.6 DELETE /api/download/:id with special characters in id should respond safely', async () => {
      const res = await apiDelete('/api/download/special_%21%40%23%24');
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
    });
  });

  // =========================================================================
  // Area 6: Audio Volume Clamping Boundaries
  // =========================================================================
  describe('Area 6: Audio Volume Clamping Boundaries', () => {
    it('6.1 negative volume value (-0.5) should clamp to 0 and mute', () => {
      const sm = new PlayerStateMachine();
      sm.setVolume(-0.5);
      assert.equal(sm.volume, 0);
      assert.equal(sm.isMuted, true);
    });

    it('6.2 extreme negative volume (-999) should clamp to 0 and mute', () => {
      const sm = new PlayerStateMachine();
      sm.setVolume(-999);
      assert.equal(sm.volume, 0);
      assert.equal(sm.isMuted, true);
    });

    it('6.3 volume greater than 1.0 (1.5) should clamp to 1.0', () => {
      const sm = new PlayerStateMachine();
      sm.setVolume(1.5);
      assert.equal(sm.volume, 1.0);
      assert.equal(sm.isMuted, false);
    });

    it('6.4 extreme positive volume (9999) should clamp to 1.0', () => {
      const sm = new PlayerStateMachine();
      sm.setVolume(9999);
      assert.equal(sm.volume, 1.0);
    });

    it('6.5 exact boundary values 0.0 and 1.0 should be respected without mutation', () => {
      const sm = new PlayerStateMachine();
      sm.setVolume(0.0);
      assert.equal(sm.volume, 0.0);
      assert.equal(sm.isMuted, true);

      sm.setVolume(1.0);
      assert.equal(sm.volume, 1.0);
      assert.equal(sm.isMuted, false);
    });
  });

  // =========================================================================
  // Area 7: Seek Clamping Boundaries
  // =========================================================================
  describe('Area 7: Seek Clamping Boundaries', () => {
    it('7.1 negative seek value (-20s) should clamp to 0', () => {
      const sm = new PlayerStateMachine();
      const track: TrackModel = { id: 't1', title: 'Song', artist: 'A', source: 'spotify', durationSec: 180 };
      sm.playTrack(track);

      sm.seekTo(-20);
      assert.equal(sm.currentTime, 0);
    });

    it('7.2 seeking past duration (500s on 180s track) should clamp to duration', () => {
      const sm = new PlayerStateMachine();
      const track: TrackModel = { id: 't1', title: 'Song', artist: 'A', source: 'spotify', durationSec: 180 };
      sm.playTrack(track);

      sm.seekTo(500);
      assert.equal(sm.currentTime, 180);
    });

    it('7.3 seeking when no track is loaded should be a safe no-op', () => {
      const sm = new PlayerStateMachine();
      assert.equal(sm.currentTrack, null);
      sm.seekTo(50);
      assert.equal(sm.currentTime, 0);
    });

    it('7.4 seeking to exact boundaries 0 and duration should succeed exactly', () => {
      const sm = new PlayerStateMachine();
      const track: TrackModel = { id: 't1', title: 'Song', artist: 'A', source: 'apple', durationSec: 240 };
      sm.playTrack(track);

      sm.seekTo(0);
      assert.equal(sm.currentTime, 0);

      sm.seekTo(240);
      assert.equal(sm.currentTime, 240);
    });

    it('7.5 playPrevious on first track should not produce negative queueIndex', () => {
      const sm = new PlayerStateMachine();
      const track: TrackModel = { id: 't1', title: 'Song', artist: 'A', source: 'apple', durationSec: 100 };
      sm.playTrack(track);
      sm.currentTime = 2; // <= 4s threshold

      sm.playPrevious();
      assert.equal(sm.queueIndex, 0);
    });
  });
});
