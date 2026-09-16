import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { Detection } from '../types/detection.ts';
import { BoundingBoxOverlay } from './BoundingBoxOverlay.tsx';

interface WebcamStreamProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isStreaming: boolean;
  isInferring: boolean;
  detections: Detection[];
  sourceWidth: number;
  sourceHeight: number;
  onStartCamera: () => void;
  onStopCamera: () => void;
  error: string | null;
}

export function WebcamStream({
  videoRef,
  isStreaming,
  isInferring,
  detections,
  sourceWidth,
  sourceHeight,
  onStartCamera,
  onStopCamera,
  error,
}: WebcamStreamProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 640,
    height: 480,
  });

  // Track container dimensions to scale overlay canvas precisely
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Quick check if any violation exists in current detections
  const hasViolation = detections.some((d) => {
    const name = d.class_name.toLowerCase();
    return name.includes('no-') || name.includes('hazard') || name.includes('violation');
  });

  return (
    <div className="webcam-card">
      <div className="webcam-header">
        <div className="webcam-title-group">
          <div className="status-indicator">
            <span className={`pulse-dot ${isStreaming ? 'online' : 'offline'}`} />
            <span className="status-label">
              {isStreaming ? (isInferring ? 'Live Inference Active' : 'Camera Feed Ready') : 'Camera Standby'}
            </span>
          </div>
          {isStreaming && (
            <span className="resolution-badge">
              {sourceWidth > 0 ? `${sourceWidth}×${sourceHeight}` : 'Active'}
            </span>
          )}
        </div>

        <div className="webcam-actions">
          {isStreaming ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onStopCamera}
              title="Stop Camera Stream"
            >
              <CameraOff size={16} />
              <span>Turn Off Camera</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onStartCamera}
              title="Start Camera Stream"
            >
              <Camera size={16} />
              <span>Turn On Camera</span>
            </button>
          )}
        </div>
      </div>

      <div className="webcam-viewport-wrapper" ref={containerRef}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`webcam-video ${isStreaming ? 'visible' : 'hidden'}`}
        />

        {isStreaming && (
          <BoundingBoxOverlay
            detections={detections}
            sourceWidth={sourceWidth || 640}
            sourceHeight={sourceHeight || 480}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
          />
        )}

        {/* Live Safety Status Banner */}
        {isStreaming && isInferring && detections.length > 0 && (
          <div className={`safety-banner ${hasViolation ? 'violation' : 'compliant'}`}>
            {hasViolation ? (
              <>
                <ShieldAlert size={18} />
                <span>PPE Violation Detected</span>
              </>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>PPE Compliant ({detections.length} items verified)</span>
              </>
            )}
          </div>
        )}

        {/* Standby / Inactive Overlay */}
        {!isStreaming && (
          <div className="webcam-placeholder">
            <div className="placeholder-icon">
              <Camera size={48} />
            </div>
            <h3>Webcam is Inactive</h3>
            <p>Click below or use the camera toggle to enable video capture for PPE detection.</p>
            <button type="button" className="btn btn-primary" onClick={onStartCamera}>
              <Camera size={18} />
              <span>Enable Camera</span>
            </button>
            {error && <div className="error-alert">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
