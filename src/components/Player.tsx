import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Volume2, 
  VolumeX, 
  Volume1,
  Heart, 
  ListMusic, 
  Tv,
  Loader2,
  Sparkles,
  DownloadCloud,
  Mic2,
  Activity,
  X,
  ListPlus,
  Plus,
  Check
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { usePlayer } from '../context/PlayerContext';
import { saveOfflineTrack } from '../services/offlineStorage';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const Player: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    queue,
    currentYoutubeId,
    isLoadingTrack,
    isQueueOpen,
    isVideoOpen,
    isLyricsOpen,
    isVisualizerOpen,
    activeSourceTab,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeatMode,
    toggleLike,
    isLiked,
    setIsQueueOpen,
    setIsVideoOpen,
    setIsLyricsOpen,
    setIsVisualizerOpen,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    ytPlayerRef,
    audioPreviewRef,
    userPausedRef,
    showToast,
    playlists,
    addTrackToPlaylist,
    createPlaylist,
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [newPlName, setNewPlName] = useState('');

  const playNextRef = useRef(playNext);
  playNextRef.current = playNext;

  const currentYoutubeIdRef = useRef(currentYoutubeId);
  currentYoutubeIdRef.current = currentYoutubeId;

  const hasTriggeredEndRef = useRef<string | null>(null);

  useEffect(() => {
    hasTriggeredEndRef.current = null;
  }, [currentTrack?.id]);

  // Video modu yalnızca YouTube kaynaklı parçalarda (ve Spotify/Apple sekmesi dışında) kullanılabilir
  const canWatchVideo =
    currentTrack?.source === 'youtube' &&
    activeSourceTab !== 'spotify' &&
    activeSourceTab !== 'apple';
  const showVideoWindow = isVideoOpen && canWatchVideo;

  // Arka planda kesintisiz çalma dinleyicisi & Güvenlik kalp atışı
  useEffect(() => {
    (window as any)._togglePlay = togglePlay;
    (window as any)._playNext = () => playNextRef.current();
    (window as any)._resumePlayback = () => {
      if (!userPausedRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        ytPlayerRef.current.playVideo();
      }
    };

    const handleBackground = () => {
      if (!userPausedRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
        setTimeout(() => {
          if (!userPausedRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
            if (ytPlayerRef.current.getPlayerState() === 2) {
              ytPlayerRef.current.playVideo();
            }
          }
        }, 100);
      }
    };

    const resumeHeartbeat = setInterval(() => {
      if (!userPausedRef.current && currentYoutubeIdRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
        const state = ytPlayerRef.current.getPlayerState();
        const cur = typeof ytPlayerRef.current.getCurrentTime === 'function' ? ytPlayerRef.current.getCurrentTime() : 0;
        const dur = typeof ytPlayerRef.current.getDuration === 'function' ? ytPlayerRef.current.getDuration() : 0;

        if (dur > 0 && cur >= dur - 1.2 && hasTriggeredEndRef.current !== currentTrack?.id) {
          hasTriggeredEndRef.current = currentTrack?.id || null;
          playNextRef.current();
          return;
        }

        if (state === 2) {
          ytPlayerRef.current.playVideo();
        }
      }
    }, 600);

    window.addEventListener('blur', handleBackground);
    document.addEventListener('visibilitychange', handleBackground);
    return () => {
      clearInterval(resumeHeartbeat);
      window.removeEventListener('blur', handleBackground);
      document.removeEventListener('visibilitychange', handleBackground);
    };
  }, [currentYoutubeId, currentTrack?.id]);

  // Android Native Background Service + Web MediaSession API (Kilit ekranı & arka plan)
  useEffect(() => {
    const nativeBridge = (window as any).NotMusicNative;
    if (Capacitor.isNativePlatform() && nativeBridge) {
      try {
        if (currentTrack && isPlaying) {
          nativeBridge.startBackgroundPlayback(currentTrack.title, currentTrack.artist);
        } else if (!isPlaying) {
          nativeBridge.stopBackgroundPlayback();
        }
      } catch {}
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && currentTrack) {
      try {
        const MediaMeta = (window as any).MediaMetadata;
        if (MediaMeta) {
          navigator.mediaSession.metadata = new MediaMeta({
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album || 'NotMusic',
            artwork: currentTrack.coverUrl
              ? [{ src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }]
              : [],
          });
        }
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        navigator.mediaSession.setActionHandler('play', () => {
          userPausedRef.current = false;
          togglePlay();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          userPausedRef.current = true;
          togglePlay();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => playNextRef.current());
        navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
      } catch {}
    }
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artist, currentTrack?.coverUrl, isPlaying]);

  // Initialize YouTube Iframe API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      if (ytPlayerRef.current) return;
      try {
        ytPlayerRef.current = new window.YT.Player('youtube-player-element', {
          height: '100%',
          width: '100%',
          videoId: currentYoutubeIdRef.current || '',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            ...(Capacitor.isNativePlatform() ? {} : { origin: window.location.origin }),
          },
          events: {
            onReady: (e: any) => {
              e.target.setVolume(Math.round(volume * 100));
              if (isPlaying && currentYoutubeIdRef.current) {
                e.target.playVideo();
              }
            },
            onStateChange: (e: any) => {
              if (e.data === 1) {
                userPausedRef.current = false;
                setIsPlaying(true);
                const d = e.target.getDuration();
                if (d) setDuration(Math.round(d));
              } else if (e.data === 2) {
                const cur = typeof e.target.getCurrentTime === 'function' ? e.target.getCurrentTime() : 0;
                const dur = typeof e.target.getDuration === 'function' ? e.target.getDuration() : 0;
                if (dur > 0 && cur >= dur - 1.5 && hasTriggeredEndRef.current !== currentTrack?.id) {
                  hasTriggeredEndRef.current = currentTrack?.id || null;
                  userPausedRef.current = false;
                  playNextRef.current();
                  return;
                }

                if (!userPausedRef.current && currentYoutubeIdRef.current) {
                  setTimeout(() => {
                    if (!userPausedRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
                      ytPlayerRef.current.playVideo();
                    }
                  }, 80);
                } else {
                  setIsPlaying(false);
                }
              } else if (e.data === 0) {
                if (hasTriggeredEndRef.current !== currentTrack?.id) {
                  hasTriggeredEndRef.current = currentTrack?.id || null;
                }
                userPausedRef.current = false;
                playNextRef.current();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error, trying next:', err);
              setTimeout(() => playNextRef.current(), 1500);
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YT Player instance:', err);
      }
    }
  }, []);

  // Sync current audio / video playback
  useEffect(() => {
    if (!currentYoutubeId) {
      if (currentTrack?.previewUrl && audioPreviewRef.current && !isLoadingTrack) {
        audioPreviewRef.current.src = currentTrack.previewUrl;
        audioPreviewRef.current.load();
        audioPreviewRef.current.volume = isMuted ? 0 : volume;
        audioPreviewRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.removeAttribute('src');
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById(currentYoutubeId);
      if (isPlaying) {
        ytPlayerRef.current.playVideo();
      }
    }
  }, [currentYoutubeId, currentTrack?.id, currentTrack?.previewUrl, isLoadingTrack]);

  // Playback timer ticker (every 300ms) with End-of-Track auto-detector
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !isSeeking) {
      interval = setInterval(() => {
        if (currentYoutubeIdRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          const t = ytPlayerRef.current.getCurrentTime();
          if (typeof t === 'number' && !isNaN(t)) {
            setCurrentTime(Math.round(t));
          }
          const d = ytPlayerRef.current.getDuration();
          if (typeof d === 'number' && d > 0) {
            setDuration(Math.round(d));
            if (t >= d - 0.8 && hasTriggeredEndRef.current !== currentTrack?.id && !userPausedRef.current) {
              hasTriggeredEndRef.current = currentTrack?.id || null;
              playNextRef.current();
            }
          }
        } else if (audioPreviewRef.current && !audioPreviewRef.current.paused) {
          const cur = audioPreviewRef.current.currentTime;
          const dur = audioPreviewRef.current.duration;
          setCurrentTime(Math.round(cur));
          if (dur && !isNaN(dur)) {
            setDuration(Math.round(dur));
            if (cur >= dur - 0.5 && hasTriggeredEndRef.current !== currentTrack?.id && !userPausedRef.current) {
              hasTriggeredEndRef.current = currentTrack?.id || null;
              playNextRef.current();
            }
          }
        }
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking, currentTrack?.id]);

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    setSeekVal(Number(e.target.value));
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    seekTo(seekVal);
  };

  const sourceBadge = () => {
    if (!currentTrack) return null;
    if (currentTrack.source === 'spotify') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          SPOTIFY
        </span>
      );
    }
    if (currentTrack.source === 'apple') {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
          APPLE MUSIC
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
        YOUTUBE
      </span>
    );
  };

  return (
    <>
      {/* Hidden audio element for offline MP3s / previews */}
      <audio
        ref={audioPreviewRef}
        onEnded={() => {
          userPausedRef.current = false;
          playNextRef.current();
        }}
        onTimeUpdate={() => {
          if (audioPreviewRef.current && !isSeeking) {
            setCurrentTime(Math.round(audioPreviewRef.current.currentTime));
            if (audioPreviewRef.current.duration && !isNaN(audioPreviewRef.current.duration)) {
              setDuration(Math.round(audioPreviewRef.current.duration));
            }
          }
        }}
      />

      {/* YouTube Video Window - Visually shown ONLY when YouTube video mode is active; hidden 1px audio engine otherwise */}
      <div
        style={showVideoWindow ? {} : { opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
        className={`fixed z-30 transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black flex flex-col ${
          showVideoWindow
            ? 'bottom-36 left-3 right-3 sm:left-auto sm:bottom-28 sm:right-6 sm:w-96 h-52 sm:h-60 opacity-100 scale-100 pointer-events-auto'
            : 'bottom-0 right-0'
        }`}
      >
        {showVideoWindow && (
          <div className="h-8 px-3 bg-[#101018] border-b border-white/10 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" />
              YouTube Video Modu
            </span>
            <button
              onClick={() => setIsVideoOpen(false)}
              title="Videoyu Kapat"
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex-1 w-full relative overflow-hidden">
          <div id="youtube-player-element" className="w-full h-full" />
        </div>
      </div>

      {/* Bottom Main Player Bar */}
      <footer className="h-auto py-2 px-3 md:py-0 md:h-24 md:px-6 bg-[#0d0d14]/95 backdrop-blur-2xl border-t border-white/10 flex flex-wrap md:flex-nowrap items-center justify-between gap-y-1.5 select-none z-40 relative">
        {/* Left Track Info */}
        <div className="flex items-center gap-2.5 md:gap-4 w-[58%] md:w-1/4 md:min-w-[220px] min-w-0">
          {currentTrack ? (
            <>
              <div className="relative group w-11 h-11 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg bg-neutral-900 border border-white/10">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                {isLoadingTrack && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {currentTrack.title}
                  </h4>
                  {sourceBadge()}
                </div>
                <p className="text-xs text-neutral-400 truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleLike(currentTrack)}
                  className={`p-2 rounded-full transition-transform active:scale-125 cursor-pointer ${
                    isLiked(currentTrack.id)
                      ? 'text-pink-500 hover:text-pink-400'
                      : 'text-neutral-500 hover:text-white'
                  }`}
                  title={isLiked(currentTrack.id) ? 'Beğenilenlerden Kaldır' : 'Beğen'}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isLiked(currentTrack.id) ? 'fill-pink-500' : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => setShowPlaylistPicker(true)}
                  className="p-1.5 md:p-2 rounded-full text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
                  title="Çalma Listesine Ekle"
                >
                  <ListPlus className="w-4 h-4" />
                </button>

                <button
                  onClick={async () => {
                    showToast(`"${currentTrack.title}" indiriliyor...`);
                    const ok = await saveOfflineTrack(currentTrack);
                    if (ok) showToast(`"${currentTrack.title}" çevrim dışı indirildi!`);
                    else showToast(`"${currentTrack.title}" indirilemedi.`);
                  }}
                  className="p-1.5 md:p-2 rounded-full text-neutral-400 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Şarkıyı Çevrim Dışı İndir"
                >
                  <DownloadCloud className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-neutral-500">
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-neutral-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-400 truncate">Şarkı seçilmedi</p>
                <p className="hidden sm:block text-[11px] text-neutral-600">Herhangi bir parçaya tıkla</p>
              </div>
            </div>
          )}
        </div>

        {/* Center Controls & Timeline */}
        <div className="flex flex-col items-center gap-1 md:gap-2 order-3 md:order-2 w-full md:w-auto md:flex-1 md:max-w-2xl px-0 md:px-4">
          {/* Action buttons */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={toggleShuffle}
              title={`Karışık Çalma: ${isShuffle ? 'Açık' : 'Kapalı'}`}
              className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors cursor-pointer ${
                isShuffle ? 'text-emerald-400' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={playPrevious}
              disabled={!currentTrack}
              title="Önceki Şarkı"
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-300 transition-colors cursor-pointer"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              title={isPlaying ? 'Durdur (Boşluk)' : 'Oynat (Boşluk)'}
              className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-lg shadow-white/10 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isLoadingTrack ? (
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              disabled={!currentTrack}
              title="Sonraki Şarkı"
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-300 transition-colors cursor-pointer"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={cycleRepeatMode}
              title={`Tekrar: ${repeatMode}`}
              className={`hidden sm:inline-flex p-1.5 rounded-lg transition-colors cursor-pointer ${
                repeatMode !== 'off'
                  ? 'text-emerald-400'
                  : 'text-neutral-500 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Timeline Bar */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono text-neutral-500 w-10 text-right">
              {formatTime(isSeeking ? seekVal : currentTime)}
            </span>
            <div className="relative flex-1 flex items-center group py-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={isSeeking ? seekVal : currentTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekEnd}
                onTouchEnd={handleSeekEnd}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400 group-hover:h-2 transition-all duration-150"
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-500 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Volume & Functional Tools */}
        <div className="flex items-center justify-end gap-1 md:gap-2.5 order-2 md:order-3 w-[42%] md:w-1/4 md:min-w-[230px]">
          {/* Lyrics Toggle */}
          <button
            onClick={() => {
              const next = !isLyricsOpen;
              setIsLyricsOpen(next);
              if (next) setIsVisualizerOpen(false);
            }}
            title="Canlı Şarkı Sözleri"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLyricsOpen ? 'text-emerald-400 bg-emerald-500/15' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Visualizer Toggle */}
          <button
            onClick={() => {
              const next = !isVisualizerOpen;
              setIsVisualizerOpen(next);
              if (next) setIsLyricsOpen(false);
            }}
            title="Ses Spektrum Görselleştirici"
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isVisualizerOpen ? 'text-violet-400 bg-violet-500/15' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Video Toggle - Strictly only available on YouTube tracks & non-Spotify/Apple tabs */}
          {canWatchVideo && (
            <button
              onClick={() => setIsVideoOpen(!isVideoOpen)}
              title="YouTube Video Modu"
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isVideoOpen ? 'text-red-400 bg-red-500/15' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
            </button>
          )}

          {/* Queue toggle */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            title="Çalma Sırası"
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              isQueueOpen ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </button>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2 group pl-1">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white cursor-pointer"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat (M)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400 group-hover:h-1.5 transition-all"
            />
          </div>
        </div>
      </footer>

      {/* Playlist Picker Modal for Current Track */}
      {showPlaylistPicker && currentTrack && (
        <div
          onClick={() => setShowPlaylistPicker(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#14141e] border border-white/10 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListPlus className="w-4 h-4 text-emerald-400" />
                  Çalma Listesine Ekle
                </h3>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{currentTrack.title}</p>
              </div>
              <button
                onClick={() => setShowPlaylistPicker(false)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5">
              {playlists.map(pl => {
                const alreadyIn = pl.tracks.some(t => t.id === currentTrack.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => {
                      addTrackToPlaylist(pl.id, currentTrack);
                      setShowPlaylistPicker(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500/15 border border-white/5 hover:border-emerald-500/30 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{pl.name}</p>
                      <p className="text-[10px] text-neutral-400">{pl.tracks.length} parça</p>
                    </div>
                    {alreadyIn ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlName.trim()) return;
                createPlaylist(newPlName.trim());
                setNewPlName('');
              }}
              className="flex gap-2 pt-2 border-t border-white/5"
            >
              <input
                type="text"
                value={newPlName}
                onChange={(e) => setNewPlName(e.target.value)}
                placeholder="Yeni liste adı..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold cursor-pointer"
              >
                Oluştur
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
