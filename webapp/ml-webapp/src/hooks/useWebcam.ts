import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  error: string | null;
  startCamera: (deviceId?: string) => Promise<void>;
  stopCamera: () => void;
  videoDimensions: { width: number; height: number };
  availableDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  selectDevice: (deviceId: string) => Promise<void>;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({
    width: 640,
    height: 480,
  });
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Stop current camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Update list of video devices
  const updateDeviceList = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch {
      // Ignore device enumeration errors
    }
  }, [selectedDeviceId]);

  // Start webcam stream with fallback constraints
  const startCamera = useCallback(
    async (deviceIdToUse?: string) => {
      setError(null);
      stopCamera();

      // Check secure context (getUserMedia requires HTTPS or localhost)
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setError(
          'Camera access requires a Secure Context (HTTPS or http://localhost). If you are accessing via IP address or network domain, use https:// or localhost.'
        );
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          'Webcam API (navigator.mediaDevices.getUserMedia) is not supported or is blocked by your browser settings.'
        );
        return;
      }

      const activeDeviceId = deviceIdToUse || selectedDeviceId;

      // Strategy: Try ideal high resolution first, then fall back to plain { video: true }
      const constraintAttempts: MediaStreamConstraints[] = [
        // 1. Try with device ID if chosen, or user facing mode with ideal resolution
        activeDeviceId
          ? {
              video: {
                deviceId: { exact: activeDeviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            }
          : {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user',
              },
              audio: false,
            },
        // 2. Fallback without deviceId restriction if exact device failed
        {
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        // 3. Fallback to basic generic video request (maximum compatibility)
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastCaughtError: unknown = null;

      for (const constraints of constraintAttempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (attemptErr) {
          lastCaughtError = attemptErr;
          console.warn('getUserMedia attempt failed, trying fallback...', attemptErr);
        }
      }

      if (!stream) {
        let message = 'Failed to access camera.';
        if (lastCaughtError instanceof DOMException) {
          if (
            lastCaughtError.name === 'NotAllowedError' ||
            lastCaughtError.name === 'PermissionDeniedError'
          ) {
            message =
              'Camera permission was denied. Please allow camera permissions in your browser address bar.';
          } else if (
            lastCaughtError.name === 'NotFoundError' ||
            lastCaughtError.name === 'DevicesNotFoundError'
          ) {
            message = 'No camera device found on your system.';
          } else if (
            lastCaughtError.name === 'NotReadableError' ||
            lastCaughtError.name === 'TrackStartError'
          ) {
            message =
              'Camera is already in use by another application or operating system process.';
          } else if (lastCaughtError.name === 'OverconstrainedError') {
            message = 'Camera does not support requested constraints.';
          } else {
            message = `Camera error: ${lastCaughtError.name} - ${lastCaughtError.message || 'Unknown error'}`;
          }
        } else if (lastCaughtError instanceof Error) {
          message = lastCaughtError.message || `Error: ${String(lastCaughtError)}`;
        } else if (lastCaughtError) {
          message = `Error: ${JSON.stringify(lastCaughtError)}`;
        }
        setError(message);
        setIsStreaming(false);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('video.play() failed:', playErr);
        }
        setIsStreaming(true);

        const handleLoadedMetadata = () => {
          if (videoRef.current) {
            setVideoDimensions({
              width: videoRef.current.videoWidth || 640,
              height: videoRef.current.videoHeight || 480,
            });
          }
        };

        if (videoRef.current.videoWidth > 0) {
          handleLoadedMetadata();
        } else {
          videoRef.current.onloadedmetadata = handleLoadedMetadata;
        }
      }

      await updateDeviceList();
    },
    [selectedDeviceId, stopCamera, updateDeviceList]
  );

  // Switch camera device
  const selectDevice = useCallback(
    async (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      if (isStreaming) {
        await startCamera(deviceId);
      }
    },
    [isStreaming, startCamera]
  );

  // Cleanup tracks on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    videoDimensions,
    availableDevices,
    selectedDeviceId,
    selectDevice,
  };
}
