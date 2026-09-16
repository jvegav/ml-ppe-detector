import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectionStatus, InferenceResponse, PerformanceMetrics } from '../types/detection.ts';

export interface UseInferenceWebSocketOptions {
  defaultUrl?: string;
  defaultFps?: number; // 10 to 15 FPS
}

export interface UseInferenceWebSocketReturn {
  status: ConnectionStatus;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  connect: (url?: string) => void;
  disconnect: () => void;
  isInferring: boolean;
  startInference: () => void;
  stopInference: () => void;
  targetFps: number;
  setTargetFps: (fps: number) => void;
  latestResponse: InferenceResponse | null;
  errorMessage: string | null;
  metrics: PerformanceMetrics;
  clearDetections: () => void;
}

export function useInferenceWebSocket(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseInferenceWebSocketOptions = {}
): UseInferenceWebSocketReturn {
  const { defaultUrl = 'ws://localhost:8000/ws/predict', defaultFps = 12 } = options;

  const [serverUrl, setServerUrl] = useState<string>(defaultUrl);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [targetFps, setTargetFpsState] = useState<number>(Math.min(15, Math.max(10, defaultFps)));
  const [latestResponse, setLatestResponse] = useState<InferenceResponse | null>(null);

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fpsSent: 0,
    fpsReceived: 0,
    latencyMs: 0,
    totalFramesSent: 0,
    totalFramesReceived: 0,
  });

  // Internal references
  const wsRef = useRef<WebSocket | null>(null);
  const sendLoopTimeoutRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetFpsRef = useRef<number>(targetFps);
  const isInferringRef = useRef<boolean>(false);

  // Performance tracking refs (initialized with 0 for pure render)
  const sentFramesCountRef = useRef<number>(0);
  const receivedFramesCountRef = useRef<number>(0);
  const lastMetricsResetRef = useRef<number>(0);
  const pendingTimestampRef = useRef<number>(0);

  // Keep targetFps ref synced
  useEffect(() => {
    targetFpsRef.current = targetFps;
  }, [targetFps]);

  const setTargetFps = useCallback((fps: number) => {
    const clamped = Math.min(15, Math.max(10, Math.round(fps)));
    setTargetFpsState(clamped);
    targetFpsRef.current = clamped;
  }, []);

  const clearDetections = useCallback(() => {
    setLatestResponse(null);
  }, []);

  // Frame sender runner ref to avoid recursive closure declarations
  const loopStepRef = useRef<() => void>(() => {});

  // Define the loop step implementation
  useEffect(() => {
    loopStepRef.current = () => {
      if (!isInferringRef.current) return;

      const ws = wsRef.current;
      const video = videoRef.current;
      const intervalMs = 1000 / targetFpsRef.current;

      if (
        ws &&
        ws.readyState === WebSocket.OPEN &&
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        // Drop frame if WebSocket is backpressured with queued bytes
        if (ws.bufferedAmount === 0) {
          if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas');
          }

          const canvas = offscreenCanvasRef.current;
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);

            // Convert frame to binary JPEG blob to send over WebSocket
            canvas.toBlob(
              (blob) => {
                if (
                  blob &&
                  isInferringRef.current &&
                  wsRef.current &&
                  wsRef.current.readyState === WebSocket.OPEN
                ) {
                  pendingTimestampRef.current = performance.now();
                  wsRef.current.send(blob);
                  sentFramesCountRef.current += 1;
                }
              },
              'image/jpeg',
              0.85
            );
          }
        }
      }

      // Schedule next frame
      if (isInferringRef.current) {
        sendLoopTimeoutRef.current = window.setTimeout(() => {
          loopStepRef.current();
        }, intervalMs);
      }
    };
  }, [videoRef]);

  // Connect to the WebSocket backend
  const connect = useCallback(
    (urlToConnect?: string) => {
      const targetUrl = urlToConnect || serverUrl;

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      setStatus('connecting');
      setErrorMessage(null);

      try {
        const ws = new WebSocket(targetUrl);
        ws.binaryType = 'blob';

        ws.onopen = () => {
          setStatus('connected');
          setErrorMessage(null);
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const now = performance.now();
            if (pendingTimestampRef.current > 0) {
              const latency = Math.round(now - pendingTimestampRef.current);
              setMetrics((prev) => ({ ...prev, latencyMs: latency }));
            }

            receivedFramesCountRef.current += 1;

            if (typeof event.data === 'string') {
              const parsed = JSON.parse(event.data) as InferenceResponse;
              if (parsed.error) {
                setErrorMessage(`Server: ${parsed.error}`);
              } else {
                setLatestResponse(parsed);
              }
            }
          } catch (err) {
            console.error('Failed to parse backend detection response:', err);
          }
        };

        ws.onerror = () => {
          setStatus('error');
          setErrorMessage(`WebSocket connection failed for ${targetUrl}`);
        };

        ws.onclose = (event) => {
          setStatus('disconnected');
          setIsInferring(false);
          isInferringRef.current = false;
          if (!event.wasClean && event.code !== 1000) {
            setErrorMessage(`Connection closed (code ${event.code})`);
          }
        };

        wsRef.current = ws;
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Invalid WebSocket URL');
      }
    },
    [serverUrl]
  );

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    setIsInferring(false);
    isInferringRef.current = false;
    if (sendLoopTimeoutRef.current !== null) {
      window.clearTimeout(sendLoopTimeoutRef.current);
      sendLoopTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  // Start PPE inference
  const startInference = useCallback(() => {
    if (status !== 'connected') {
      setErrorMessage('Please connect to the backend before starting inference.');
      return;
    }
    if (!videoRef.current || videoRef.current.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      setErrorMessage('Webcam stream is not ready.');
      return;
    }

    setErrorMessage(null);
    setIsInferring(true);
    isInferringRef.current = true;

    // Begin capture loop
    loopStepRef.current();
  }, [status, videoRef]);

  // Stop PPE inference
  const stopInference = useCallback(() => {
    setIsInferring(false);
    isInferringRef.current = false;
    if (sendLoopTimeoutRef.current !== null) {
      window.clearTimeout(sendLoopTimeoutRef.current);
      sendLoopTimeoutRef.current = null;
    }
    setLatestResponse(null);
  }, []);

  // Rolling 1-second metrics calculation (FPS Sent & Received)
  useEffect(() => {
    lastMetricsResetRef.current = performance.now();

    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = (now - lastMetricsResetRef.current) / 1000;

      if (elapsed >= 0.9) {
        const sentRate = Math.round(sentFramesCountRef.current / elapsed);
        const receivedRate = Math.round(receivedFramesCountRef.current / elapsed);

        setMetrics((prev) => ({
          ...prev,
          fpsSent: isInferringRef.current ? sentRate : 0,
          fpsReceived: isInferringRef.current ? receivedRate : 0,
          totalFramesSent: prev.totalFramesSent + sentFramesCountRef.current,
          totalFramesReceived: prev.totalFramesReceived + receivedFramesCountRef.current,
        }));

        sentFramesCountRef.current = 0;
        receivedFramesCountRef.current = 0;
        lastMetricsResetRef.current = now;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isInferringRef.current = false;
      if (sendLoopTimeoutRef.current !== null) {
        window.clearTimeout(sendLoopTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    status,
    serverUrl,
    setServerUrl,
    connect,
    disconnect,
    isInferring,
    startInference,
    stopInference,
    targetFps,
    setTargetFps,
    latestResponse,
    errorMessage,
    metrics,
    clearDetections,
  };
}
