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
  Maximize2,
  Tv,
  Loader2,
  Sparkles,
  DownloadCloud
} from 'lucide-react';
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
    likedTracks,
    currentYoutubeId,
    isLoadingTrack,
    isQueueOpen,
    isVideoOpen,
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
    setCurrentTime,
    setDuration,
    setIsPlaying,
    ytPlayerRef,
  } = usePlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

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
          videoId: currentYoutubeId || '',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              e.target.setVolume(Math.round(volume * 100));
              if (isPlaying && currentYoutubeId) {
                e.target.playVideo();
              }
            },
            onStateChange: (e: any) => {
              // 1 = playing, 2 = paused, 0 = ended, 3 = buffering
              if (e.data === 1) {
                setIsPlaying(true);
                const d = e.target.getDuration();
                if (d) setDuration(Math.round(d));
              } else if (e.data === 2) {
                setIsPlaying(false);
              } else if (e.data === 0) {
                // Ended -> play next!
                playNext();
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error, trying next:', err);
              // If video playback fails, try next or preview
              setTimeout(() => playNext(), 1500);
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YT Player instance:', err);
      }
    }
  }, []);

  // Sync current video ID with player
  useEffect(() => {
    if (!currentYoutubeId) {
      // If no YouTube ID, but has previewUrl, use HTML5 audio preview
      if (currentTrack?.previewUrl && audioPreviewRef.current) {
        audioPreviewRef.current.src = currentTrack.previewUrl;
        audioPreviewRef.current.volume = isMuted ? 0 : volume;
        audioPreviewRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      ytPlayerRef.current.loadVideoById(currentYoutubeId);
      if (isPlaying) {
        ytPlayerRef.current.playVideo();
      }
    }
  }, [currentYoutubeId]);

  // Playback timer ticker (every 300ms)
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !isSeeking) {
      interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          const t = ytPlayerRef.current.getCurrentTime();
          if (typeof t === 'number' && !isNaN(t)) {
            setCurrentTime(Math.round(t));
          }
          const d = ytPlayerRef.current.getDuration();
          if (typeof d === 'number' && d > 0) {
            setDuration(Math.round(d));
          }
        } else if (audioPreviewRef.current && !audioPreviewRef.current.paused) {
          setCurrentTime(Math.round(audioPreviewRef.current.currentTime));
          setDuration(Math.round(audioPreviewRef.current.duration || 30));
        }
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isSeeking]);

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
      {/* Hidden audio element fallback */}
      <audio
        ref={audioPreviewRef}
        onEnded={() => playNext()}
        onTimeUpdate={() => {
          if (audioPreviewRef.current) {
            setCurrentTime(audioPreviewRef.current.currentTime);
          }
        }}
      />

      {/* Dockable YouTube Video Window */}
      <div
        className={`fixed z-30 transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl border border-white/10 ${
          isVideoOpen
            ? 'bottom-24 right-6 w-96 h-56 bg-black opacity-100 scale-100 pointer-events-auto'
            : 'bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none'
        }`}
      >
        <div id="youtube-player-element" className="w-full h-full" />
      </div>

      {/* Bottom Main Player Bar */}
      <footer className="h-24 bg-[#0d0d14]/95 backdrop-blur-2xl border-t border-white/10 px-6 flex items-center justify-between select-none z-40 relative">
        {/* Left Track Info */}
        <div className="flex items-center gap-4 w-1/4 min-w-[220px]">
          {currentTrack ? (
            <>
              <div className="relative group w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-lg bg-neutral-900 border border-white/10">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
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
                  <h4 className="text-sm font-semibold text-white truncate hover:underline cursor-pointer">
                    {currentTrack.title}
                  </h4>
                  {sourceBadge()}
                </div>
                <p className="text-xs text-neutral-400 truncate hover:text-white cursor-pointer mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleLike(currentTrack)}
                  className={`p-2 rounded-full transition-transform active:scale-125 ${
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
                  onClick={async () => {
                    await saveOfflineTrack(currentTrack);
                    alert(`"${currentTrack.title}" çevrim dışı kütüphaneye indirildi!`);
                  }}
                  className="p-2 rounded-full text-neutral-500 hover:text-cyan-400 transition-colors"
                  title="Şarkıyı Çevrim Dışı İndir"
                >
                  <DownloadCloud className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3 text-neutral-500">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-400">Şarkı seçilmedi</p>
                <p className="text-[11px] text-neutral-600">Herhangi bir parçaya tıkla</p>
              </div>
            </div>
          )}
        </div>

        {/* Center Controls & Timeline */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl px-4">
          {/* Action buttons */}
          <div className="flex items-center gap-5">
            <button
              onClick={toggleShuffle}
              title={`Karışık Çalma: ${isShuffle ? 'Açık' : 'Kapalı'}`}
              className={`p-1.5 rounded-lg transition-colors ${
                isShuffle ? 'text-emerald-400' : 'text-neutral-500 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={playPrevious}
              disabled={!currentTrack}
              title="Önceki Şarkı"
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-300 transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!currentTrack}
              title={isPlaying ? 'Durdur (Boşluk)' : 'Oynat (Boşluk)'}
              className="w-11 h-11 rounded-full bg-white hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-lg shadow-white/10 transition-all duration-200 disabled:opacity-50"
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
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-300 transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={cycleRepeatMode}
              title={`Tekrar: ${repeatMode}`}
              className={`p-1.5 rounded-lg transition-colors ${
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

        {/* Right Volume & Tools */}
        <div className="flex items-center justify-end gap-4 w-1/4 min-w-[200px]">
          {/* Video Toggle */}
          <button
            onClick={() => setIsVideoOpen(!isVideoOpen)}
            title="Video / Klip Modu"
            className={`p-2 rounded-lg transition-colors ${
              isVideoOpen ? 'text-red-400 bg-red-500/10' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>

          {/* Queue toggle */}
          <button
            onClick={() => setIsQueueOpen(!isQueueOpen)}
            title="Çalma Sırası"
            className={`relative p-2 rounded-lg transition-colors ${
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
          <div className="flex items-center gap-2 group">
            <button
              onClick={toggleMute}
              className="text-neutral-400 hover:text-white"
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
    </>
  );
};
