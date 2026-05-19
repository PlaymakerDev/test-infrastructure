import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import Hls from 'hls.js';

interface Props extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
  hlsUrl?: string;
  figureClassName?: string;
  videoClassName?: string;
  videoStyle?: React.CSSProperties;
  extra?: React.ReactNode;
  muted?: boolean;
  autoPlay?: boolean;
  showLiveBadge?: boolean;
  hideLiveBadgeOnMobile?: boolean;
  maxRetries?: number
  retryDelay?: number,
  autoReconnectInterval?: number
  onStatusChange?: (status: string, error?: any) => void;
  onError?: (error: any) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  cameraId?: string;
  enableViewportPause?: boolean;
  viewportThreshold?: number;
}

// ── Loading indicator ─────────────────────────────────────────────────────────

const LOADING_STEPS = ['dots', 'Stream', 'Device'] as const
type LoadingStep = typeof LOADING_STEPS[number]

const LoadingIndicator: React.FC = () => {
  const [stepIdx, setStepIdx] = useState(0)
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter')

  useEffect(() => {
    let t: NodeJS.Timeout
    if (phase === 'enter') {
      t = setTimeout(() => setPhase('hold'), 350)
    } else if (phase === 'hold') {
      t = setTimeout(() => setPhase('exit'), 1500)
    } else {
      t = setTimeout(() => {
        setStepIdx((prev) => (prev + 1) % LOADING_STEPS.length)
        setPhase('enter')
      }, 300)
    }
    return () => clearTimeout(t)
  }, [phase])

  const step = LOADING_STEPS[stepIdx]

  return (
    <>
      <style>{`
        @keyframes hls-wave {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes hls-slide-in {
          from { transform: translateY(-14px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes hls-slide-out {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(14px); opacity: 0; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }}>
        <span style={{ color: '#ccc', fontSize: 12, letterSpacing: '0.05em' }}>Loading</span>
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', minWidth: 52, height: 18, overflow: 'hidden' }}>
          <span
            style={{
              position: 'absolute',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              animation: phase === 'exit'
                ? 'hls-slide-out 0.3s ease forwards'
                : phase === 'enter'
                  ? 'hls-slide-in 0.3s ease forwards'
                  : 'none',
            }}
          >
            {step === 'dots'
              ? [0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#E94C4C',
                    animation: phase !== 'exit'
                      ? `hls-wave 1.2s ease-in-out ${i * 0.18}s infinite`
                      : 'none',
                  }}
                />
              ))
              : (
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  color: '#E94C4C',
                }}>
                  {step}
                </span>
              )
            }
          </span>
        </span>
      </div>
    </>
  )
}

// ── Main player ───────────────────────────────────────────────────────────────

const HLSLivePlayer = React.forwardRef<any, Props>((props, ref) => {
  const {
    hlsUrl = '',
    figureClassName = '',
    videoClassName = '',
    videoStyle = {},
    extra = null,
    muted = true,
    autoPlay = true,
    showLiveBadge = true,
    hideLiveBadgeOnMobile = true,
    maxRetries = 3,
    retryDelay = 2000,
    autoReconnectInterval = 30000,
    onStatusChange,
    onError,
    onVisibilityChange,
    cameraId = 'unknown',
    enableViewportPause = true,
    viewportThreshold = 0.1,
    className = '',
    style = {},
    ...propsHLSLivePlayer
  } = props

  // Auto-detect: treat as HLS only if the URL points to a .m3u8 manifest
  const isHlsUrl = (url: string): boolean => {
    if (!url) return false;
    try {
      const pathname = new URL(url).pathname.toLowerCase();
      return pathname.endsWith('.m3u8');
    } catch {
      return url.toLowerCase().includes('.m3u8');
    }
  };
  const useHLS = isHlsUrl(hlsUrl);

  // COMPONENT STATE
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [wasConnectedBefore, setWasConnectedBefore] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isInViewport, setIsInViewport] = useState(false);
  const [isPausedByViewport, setIsPausedByViewport] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastFrameUrl, setLastFrameUrl] = useState<string>('');

  // REF
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoReconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCapturePaused = useRef(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const windowWithOpera = window as Window & { opera?: string };
      const userAgent = navigator.userAgent || navigator.vendor || windowWithOpera.opera || '';
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Viewport visibility detection
  useEffect(() => {
    if (!enableViewportPause || !containerRef.current) return;

    const options = {
      root: null,
      rootMargin: '50px',
      threshold: viewportThreshold
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const isVisible = entry.isIntersecting;
        setIsInViewport(isVisible);

        console.log(`📹 Camera [${cameraId}]: ${isVisible ? 'ENTERED' : 'LEFT'} viewport`, {
          intersectionRatio: entry.intersectionRatio,
          isVisible,
          timestamp: new Date().toISOString()
        });

        if (onVisibilityChange) {
          onVisibilityChange(isVisible);
        }

        if (isVisible) {
          handleVisibilityEnter();
        } else {
          handleVisibilityLeave();
        }
      });
    }, options);

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enableViewportPause, cameraId, hlsUrl]);

  const handleVisibilityEnter = () => {
    console.log(`✅ Camera [${cameraId}]: ACTIVATING`);
    setIsPausedByViewport(false);

    if (videoRef.current && videoRef.current.paused && !hasError) {
      if (!useHLS) {
        // For non-HLS, just resume playback
        videoRef.current.play().catch(err => {
          console.warn(`Camera [${cameraId}]: Resume failed:`, err);
        });
      } else if (hlsRef.current) {
        videoRef.current.play().catch(err => {
          console.warn(`Camera [${cameraId}]: Resume failed:`, err);
        });
      }
    }

    if (useHLS && !hlsRef.current && hlsUrl && !hasError) {
      console.log(`🔄 Camera [${cameraId}]: Reinitializing HLS`);
      initHLS();
    }

    if (!useHLS && hlsUrl && !hasError) {
      initDirectVideo();
    }
  };

  const handleVisibilityLeave = () => {
    console.log(`⏸️  Camera [${cameraId}]: PAUSING (out of viewport)`);
    setIsPausedByViewport(true);

    captureLastFrame();

    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    }

    if (useHLS && hlsRef.current) {
      try {
        console.log(`🗑️  Camera [${cameraId}]: Destroying HLS instance`);
        hlsRef.current.destroy();
        hlsRef.current = null;
      } catch (e) {
        console.warn(`Camera [${cameraId}]: Error destroying HLS:`, e);
      }
    }

    clearRetryTimeout();
    clearAutoReconnectTimer();
    clearStabilityTimer();
  };

  const captureLastFrame = () => {
    // Canvas capture requires crossOrigin="anonymous" — skip for non-HLS (CORS not set)
    if (!useHLS) return;
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState >= 2 && !frameCapturePaused.current) {
      try {
        const videoWidth = video.videoWidth || video.clientWidth;
        const videoHeight = video.videoHeight || video.clientHeight;

        if (videoWidth === 0 || videoHeight === 0) {
          console.warn(`Camera [${cameraId}]: Video dimensions are zero, skipping capture`);
          return;
        }

        canvas.width = videoWidth;
        canvas.height = videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameUrl = canvas.toDataURL('image/jpeg', 0.9);

          if (frameUrl && frameUrl.length > 1000) {
            setLastFrameUrl(frameUrl);
            console.log(`📸 Camera [${cameraId}]: Frame captured (${frameUrl.length} bytes)`);
          }
        }
      } catch (e) {
        console.warn(`Camera [${cameraId}]: Failed to capture frame`, e);
      }
    }
  };

  const updateStatus = (status: string, error: any = null) => {
    if ((status === 'error' || status === 'retrying') && connectionStatus === 'connected') {
      captureLastFrame();
    }

    setConnectionStatus(status);
    console.log(`📊 Camera [${cameraId}]: Status = ${status}`, error || '');
    if (onStatusChange) {
      onStatusChange(status, error);
    }
  };

  const handleErrorCallback = (error: any) => {
    console.error(`❌ Camera [${cameraId}]: Error`, error);
    if (onError) {
      onError(error);
    }
  };

  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };

  const clearAutoReconnectTimer = () => {
    if (autoReconnectTimerRef.current) {
      clearInterval(autoReconnectTimerRef.current);
      autoReconnectTimerRef.current = null;
    }
  };

  const clearStabilityTimer = () => {
    if (stabilityTimerRef.current) {
      clearInterval(stabilityTimerRef.current);
      stabilityTimerRef.current = null;
    }
  };

  const checkConnectionHealth = () => {
    if (!videoRef.current || !hlsUrl) return false;

    const video = videoRef.current;

    const isHealthy = (
      !video.error &&
      video.readyState >= 2 &&
      !video.ended &&
      video.networkState !== video.NETWORK_NO_SOURCE
    );

    return isHealthy;
  };

  const smartReconnect = () => {
    if (enableViewportPause && !isInViewport) {
      console.log(`⏭️  Camera [${cameraId}]: Skipping reconnect (not in viewport)`);
      return;
    }

    const isHealthy = checkConnectionHealth();
    if (isHealthy) {
      setRetryCount(0);
      setHasError(false);
      updateStatus('connecting');
      setErrorMessage('Reconnecting...');
      if (!useHLS) {
        initDirectVideo();
      } else {
        initHLS();
      }
    } else {
      setErrorMessage('Stream not available - checking again in 30s');
    }
  };

  const retryConnection = () => {
    if (enableViewportPause && !isInViewport) {
      console.log(`⏭️  Camera [${cameraId}]: Skipping retry (not in viewport)`);
      return;
    }

    if (retryCount < maxRetries) {
      clearRetryTimeout();
      setRetryCount(prev => prev + 1);
      setHasError(false);
      setIsReconnecting(true);
      updateStatus('retrying');
      setErrorMessage(`Reconnecting... (${retryCount + 1}/${maxRetries})`);

      retryTimeoutRef.current = setTimeout(() => {
        if (!useHLS) {
          initDirectVideo();
        } else {
          initHLS();
        }
      }, retryDelay);
    } else {
      updateStatus('failed');
      setErrorMessage('Max retries reached - Auto-reconnect in 30s');

      clearAutoReconnectTimer();
      autoReconnectTimerRef.current = setInterval(() => {
        smartReconnect();
      }, autoReconnectInterval);
    }
  };

  // ─── Direct video (non-HLS) initializer ───────────────────────────────────
  const initDirectVideo = () => {
    if (!hlsUrl || !videoRef.current) return;

    if (enableViewportPause && !isInViewport) {
      console.log(`⏭️  Camera [${cameraId}]: Skipping direct-video init (not in viewport)`);
      return;
    }

    console.log(`🎬 Camera [${cameraId}]: Initializing direct video`);
    setIsReconnecting(wasConnectedBefore);
    setIsLoading(!wasConnectedBefore);
    setHasError(false);
    updateStatus('connecting');

    const video = videoRef.current;

    // Remove previous listeners by cloning (simplest safe approach)
    // We'll attach named handlers so we can remove them properly
    const onCanPlay = () => {
      console.log(`✅ Camera [${cameraId}]: Can play (direct)`);
      setIsLoading(false);
      setIsReconnecting(false);
      updateStatus('connected');
      setRetryCount(0);
      setErrorMessage('');
      setWasConnectedBefore(true);
      clearAutoReconnectTimer();

      if (isActive && autoPlay && !isPausedByViewport) {
        video.muted = muted;
        video.play()
          .then(() => {
            setIsPlaying(true);
            console.log(`▶️  Camera [${cameraId}]: Playing (direct)`);
            setTimeout(() => {
              if (video.readyState >= 2) {
                setLastFrameUrl('');
                frameCapturePaused.current = false;
              }
            }, 1000);
          })
          .catch(err => {
            console.warn(`Camera [${cameraId}]: Auto-play failed (direct):`, err);
            updateStatus('ready');
          });
      }
    };

    const onError = (e: Event) => {
      console.error(`❌ Camera [${cameraId}]: Video error (direct)`, e);
      handleErrorCallback(e);
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
      updateStatus('error');
      setErrorMessage(wasConnectedBefore ? 'Connection lost - reconnecting...' : 'Video failed to load');
      retryConnection();
    };

    const onLoadStart = () => updateStatus('connecting');
    const onLoadedData = () => updateStatus('connected');

    const onEnded = () => {
      // For VOD mp4 that finished — mark as ended rather than error
      console.log(`🏁 Camera [${cameraId}]: Video ended`);
      setIsPlaying(false);
      updateStatus('ended');
    };

    // Clean up previous listeners
    video.removeEventListener('canplay', onCanPlay);
    video.removeEventListener('error', onError);
    video.removeEventListener('loadstart', onLoadStart);
    video.removeEventListener('loadeddata', onLoadedData);
    video.removeEventListener('ended', onEnded);

    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('error', onError);
    video.addEventListener('loadstart', onLoadStart);
    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('ended', onEnded);

    video.src = hlsUrl;
    video.load();
  };
  // ──────────────────────────────────────────────────────────────────────────

  // Initialize HLS
  const initHLS = async () => {
    if (!hlsUrl || !videoRef.current) return;

    if (enableViewportPause && !isInViewport) {
      console.log(`⏭️  Camera [${cameraId}]: Skipping HLS init (not in viewport)`);
      return;
    }

    console.log(`🚀 Camera [${cameraId}]: Initializing HLS`);
    setIsReconnecting(wasConnectedBefore);
    setIsLoading(!wasConnectedBefore);
    setHasError(false);
    updateStatus('connecting');

    try {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (e) {
          console.warn(`Camera [${cameraId}]: Error destroying HLS:`, e);
        }
        hlsRef.current = null;
      }

      let formattedUrl = hlsUrl;
      if (!hlsUrl.startsWith('https://') && !hlsUrl.startsWith('http://')) {
        if (hlsUrl.includes('.') || hlsUrl.includes('localhost')) {
          formattedUrl = `http://${hlsUrl}`;
          console.warn(`⚠️ Camera [${cameraId}]: URL missing protocol, auto-fixing to: ${formattedUrl}`);
        } else {
          const errMsg = 'Invalid stream URL (must start with http:// or https://)';
          console.warn(`❌ Camera [${cameraId}]: ${errMsg}`, hlsUrl);
          setHasError(true);
          setIsLoading(false);
          setErrorMessage(errMsg);
          updateStatus('failed');
          return;
        }
      }

      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          backBufferLength: 10,
          frontBufferFlushThreshold: 60,
          enableWorker: true,
          lowLatencyMode: false,
          progressive: true,
          capLevelToPlayerSize: true,
          capLevelOnFPSDrop: true,
          abrEwmaDefaultEstimate: 500000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.7,
          fragLoadingTimeOut: 45000,
          manifestLoadingTimeOut: 45000,
          levelLoadingTimeOut: 45000,
          fragLoadingMaxRetry: 10,
          levelLoadingMaxRetry: 6,
          manifestLoadingMaxRetry: 10,
          fragLoadingMaxRetryTimeout: 64000,
          levelLoadingMaxRetryTimeout: 64000,
          startPosition: -1,
          debug: false,
          highBufferWatchdogPeriod: 3,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 5,
          startFragPrefetch: true,
          testBandwidth: true
        });

        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log(`✅ Camera [${cameraId}]: Manifest parsed`);
          setIsLoading(false);
          setIsReconnecting(false);
          updateStatus('connected');
          setRetryCount(0);
          setErrorMessage('');
          setWasConnectedBefore(true);
          clearAutoReconnectTimer();

          if (isActive && videoRef.current && autoPlay && !isPausedByViewport) {
            videoRef.current.muted = muted;
            videoRef.current.play()
              .then(() => {
                setIsPlaying(true);
                console.log(`▶️  Camera [${cameraId}]: Playing`);

                setTimeout(() => {
                  if (videoRef.current && videoRef.current.readyState >= 2) {
                    setLastFrameUrl('');
                    frameCapturePaused.current = false;
                  }
                }, 1000);
              })
              .catch(err => {
                console.warn(`Camera [${cameraId}]: Auto-play failed:`, err);
                updateStatus('ready');
              });
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (!data.fatal && data.details === 'bufferStalledError') {
            return;
          }

          console.error(`❌ Camera [${cameraId}]: HLS Error`, data);
          handleErrorCallback(data);

          if (data.fatal) {
            setHasError(true);
            setIsLoading(false);
            setIsPlaying(false);
            updateStatus('error');

            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (data.details === 'manifestLoadTimeOut' || data.details === 'manifestLoadError') {
                  setErrorMessage('กำลังโหลดสตรีม กรุณารอสักครู่...');
                  console.log(`🔄 Camera [${cameraId}]: Manifest timeout - quick retry`);

                  if (retryCount < maxRetries) {
                    setTimeout(() => retryConnection(), 500);
                  } else {
                    console.log(`🔄 Camera [${cameraId}]: Max retries - fresh connection`);
                    setTimeout(() => {
                      setRetryCount(0);
                      setHasError(false);
                      initHLS();
                    }, 1000);
                  }
                } else {
                  setErrorMessage(wasConnectedBefore ? 'Connection lost - reconnecting...' : 'Network error - Check connection');
                  console.log(`🔄 Camera [${cameraId}]: Network error - recovery attempt`);
                  try {
                    hls.startLoad();
                    setTimeout(() => {
                      if (videoRef.current) {
                        videoRef.current.play().catch(() => { });
                      }
                    }, 1000);
                  } catch (e) {
                    if (retryCount < maxRetries) {
                      setTimeout(() => retryConnection(), 1000);
                    }
                  }
                }
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                setErrorMessage('Media error - Recovering...');
                console.log(`🔄 Camera [${cameraId}]: Media error - recovery attempt`);
                try {
                  hls.recoverMediaError();
                  setTimeout(() => {
                    if (videoRef.current && videoRef.current.paused) {
                      videoRef.current.play().catch(() => { });
                    }
                  }, 1000);
                } catch (e) {
                  console.error(`Camera [${cameraId}]: Media recovery failed`, e);
                  retryConnection();
                }
                break;

              default:
                setErrorMessage(`Stream error: ${data.type}`);
                retryConnection();
                break;
            }
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          if (connectionStatus !== 'connected') {
            updateStatus('connected');
          }
        });

        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          if (!isPlaying && videoRef.current && !videoRef.current.paused) {
            setIsPlaying(true);
          }

          if (videoRef.current && videoRef.current.readyState >= 2) {
            setTimeout(() => captureLastFrame(), 100);
          }
        });

        hls.on(Hls.Events.BUFFER_FLUSHING, () => {
          console.log(`🔄 Camera [${cameraId}]: Buffer flushing`);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          console.log(`📊 Camera [${cameraId}]: Quality switched to level ${data.level}`);
        });

        hls.on(Hls.Events.FRAG_PARSING_METADATA, () => {
          if (hasError) {
            setHasError(false);
            setErrorMessage('');
          }
        });

        hls.loadSource(formattedUrl);
        hls.attachMedia(videoRef.current);

      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = formattedUrl;

        const handleCanPlay = () => {
          console.log(`✅ Camera [${cameraId}]: Can play`);
          setIsLoading(false);
          setIsReconnecting(false);
          updateStatus('connected');
          setRetryCount(0);
          setErrorMessage('');
          setWasConnectedBefore(true);
          clearAutoReconnectTimer();

          if (isActive && autoPlay && videoRef.current && !isPausedByViewport) {
            videoRef.current.muted = muted;
            videoRef.current.play()
              .then(() => {
                setIsPlaying(true);
                console.log(`▶️  Camera [${cameraId}]: Playing`);

                setTimeout(() => {
                  if (videoRef.current && videoRef.current.readyState >= 2) {
                    setLastFrameUrl('');
                    frameCapturePaused.current = false;
                  }
                }, 1000);
              })
              .catch(err => {
                console.warn(`Camera [${cameraId}]: Auto-play failed`, err);
                updateStatus('ready');
              });
          }
        };

        const handleVideoError = (e: Event) => {
          console.error(`❌ Camera [${cameraId}]: Video error`, e);
          handleErrorCallback(e);
          setHasError(true);
          setIsLoading(false);
          setIsPlaying(false);
          updateStatus('error');
          setErrorMessage(wasConnectedBefore ? 'Connection lost - reconnecting...' : 'Stream loading failed');

          if (retryCount < maxRetries) {
            setTimeout(() => retryConnection(), 2000);
          }
        };

        const handleLoadStart = () => {
          updateStatus('connecting');
        };

        const handleLoadedData = () => {
          updateStatus('connected');
        };

        if (videoRef.current) {
          videoRef.current.addEventListener('canplay', handleCanPlay);
          videoRef.current.addEventListener('error', handleVideoError);
          videoRef.current.addEventListener('loadstart', handleLoadStart);
          videoRef.current.addEventListener('loadeddata', handleLoadedData);
        }

        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('canplay', handleCanPlay);
            videoRef.current.removeEventListener('error', handleVideoError);
            videoRef.current.removeEventListener('loadstart', handleLoadStart);
            videoRef.current.removeEventListener('loadeddata', handleLoadedData);
          }
        };
      } else {
        throw new Error('HLS not supported in this browser');
      }
    } catch (error: any) {
      console.error(`❌ Camera [${cameraId}]: Init HLS error`, error);
      handleErrorCallback(error);
      setHasError(true);
      setIsLoading(false);
      updateStatus('error');
      setErrorMessage(error.message || 'Unknown error');

      if (retryCount < maxRetries) {
        setTimeout(() => retryConnection(), 3000);
      }
    }
  };

  // Capture frame periodically when playing
  useEffect(() => {
    if (!videoRef.current || isPausedByViewport) return;

    const captureNow = () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && !videoRef.current.paused) {
        captureLastFrame();
      }
    };

    setTimeout(captureNow, 100);

    const interval = setInterval(() => {
      captureLastFrame();
    }, 500);

    return () => clearInterval(interval);
  }, [isPausedByViewport]);

  // Additional capture when video starts playing
  useEffect(() => {
    if (isPlaying && videoRef.current && !isPausedByViewport) {
      const captureTimer = setTimeout(() => {
        captureLastFrame();
      }, 500);
      return () => clearTimeout(captureTimer);
    }
  }, [isPlaying, isPausedByViewport]);

  // Connection stability monitoring
  useEffect(() => {
    clearStabilityTimer();

    if (enableViewportPause && !isInViewport) {
      return;
    }

    if (connectionStatus === 'connected' && isPlaying && videoRef.current) {
      stabilityTimerRef.current = setInterval(() => {
        const video = videoRef.current;
        if (!video) return;

        const hasRealProblem = (
          video.error ||
          video.ended ||
          video.networkState === video.NETWORK_NO_SOURCE ||
          (video.readyState < 2 && video.networkState === video.NETWORK_LOADING)
        );

        if (hasRealProblem) {
          console.log(`⚠️ Camera [${cameraId}]: Real connection problem detected`);
          updateStatus('error');
          setHasError(true);
          setErrorMessage('Connection lost - reconnecting...');
          smartReconnect();
        } else {
          if (connectionStatus !== 'connected') {
            updateStatus('connected');
            setHasError(false);
            setErrorMessage('');
          }
        }
      }, 120000);
    }

    return () => clearStabilityTimer();
  }, [connectionStatus, isPlaying, isInViewport]);

  // Initialize video when URL changes or comes into viewport
  useEffect(() => {
    if (hlsUrl && (!enableViewportPause || isInViewport)) {
      if (!useHLS) {
        initDirectVideo();
      } else {
        initHLS();
      }
    }

    return () => {
      clearRetryTimeout();
      clearAutoReconnectTimer();
      clearStabilityTimer();

      // Only destroy HLS if using HLS mode
      if (useHLS && hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch (error) {
          console.error(`Camera [${cameraId}]: Error destroying HLS`, error);
        }
        hlsRef.current = null;
      }

      // For direct video, just pause and clear src
      if (!useHLS && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    };
  }, [hlsUrl, isInViewport, useHLS]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-emerald-400';
      case 'connecting': return 'text-blue-400';
      case 'retrying': return 'text-yellow-400';
      case 'error': case 'failed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const manualRetry = () => {
    setRetryCount(0);
    setHasError(false);
    clearAutoReconnectTimer();
    if (!useHLS) {
      initDirectVideo();
    } else {
      initHLS();
    }
  };

  useImperativeHandle(ref, () => ({
    retry: manualRetry,
    getStatus: () => connectionStatus,
    isConnected: () => connectionStatus === 'connected',
    isPlaying: () => isPlaying,
    isInViewport: () => isInViewport,
    isPaused: () => isPausedByViewport,
    getCameraId: () => cameraId
  }));

  if (hasError && retryCount >= maxRetries && connectionStatus === 'failed') {
    return (
      <div className={`w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${className}`} style={style}>
        <div className="text-center text-slate-400 p-4">
          <div className="text-sm text-red-400 font-bold mb-1">Connection Failed</div>
          <div className="text-xs text-slate-500 mb-3">{errorMessage}</div>
          <button
            onClick={manualRetry}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <figure
      ref={containerRef as any}
      className={`relative overflow-hidden bg-black ${figureClassName}`}
      {...propsHLSLivePlayer}
    >
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      <video
        ref={videoRef}
        className={`w-full h-full aspect-video ${videoClassName}`}
        playsInline
        muted={muted}
        autoPlay={autoPlay}
        preload="auto"
        {...(useHLS ? { crossOrigin: 'anonymous' as const } : {})}
        style={{
          backgroundColor: '#000',
          ...videoStyle,
        }}
      />

      {/* Frozen frame overlay when reconnecting */}
      {isReconnecting && lastFrameUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${lastFrameUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.95,
            zIndex: 5
          }}
        />
      )}
      {extra}

      {/* Loading overlay - only for initial load */}
      {isLoading && !wasConnectedBefore && isInViewport && (
        <div className="absolute inset-0 flex items-center justify-center z-20" style={{ background: '#0e0e0e' }}>
          <LoadingIndicator />
        </div>
      )}

      {/* Reconnecting indicator */}
      {isReconnecting && wasConnectedBefore && isInViewport && (
        <div className="absolute top-2 right-2 z-30 bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-lg">
          <div className="flex items-center space-x-2 text-white text-xs">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            <span className="font-medium">Reconnecting...</span>
            {retryCount > 0 && (
              <span className="text-[10px] opacity-80">({retryCount}/{maxRetries})</span>
            )}
          </div>
        </div>
      )}

      {/* Paused by viewport overlay */}
      {isPausedByViewport && !isInViewport && (
        <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center z-20">
          <div className="text-center text-slate-400">
            <div className="text-xs">Paused (not visible)</div>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {connectionStatus === 'error' && hasError && !isReconnecting && isInViewport && (
        <div className="absolute top-2 right-2 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs z-30">
          <div className="flex items-center space-x-1 text-white">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <span className="font-bold uppercase">ERROR</span>
          </div>
        </div>
      )}
    </figure>
  )
});

HLSLivePlayer.displayName = 'HLSLivePlayer';

export default React.memo(HLSLivePlayer);