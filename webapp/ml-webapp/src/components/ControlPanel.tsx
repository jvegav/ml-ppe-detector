import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Play,
  Radio,
  Server,
  Sliders,
  Square,
  XCircle,
} from 'lucide-react';
import type { ConnectionStatus, PerformanceMetrics } from '../types/detection.ts';

interface ControlPanelProps {
  // Backend connection props
  connectionStatus: ConnectionStatus;
  serverUrl: string;
  onServerUrlChange: (url: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;

  // Inference props
  isInferring: boolean;
  onStartInference: () => void;
  onStopInference: () => void;
  targetFps: number;
  onTargetFpsChange: (fps: number) => void;

  // Camera & system state
  isCameraActive: boolean;
  metrics: PerformanceMetrics;
  errorMessage: string | null;
}

export function ControlPanel({
  connectionStatus,
  serverUrl,
  onServerUrlChange,
  onConnect,
  onDisconnect,
  isInferring,
  onStartInference,
  onStopInference,
  targetFps,
  onTargetFpsChange,
  isCameraActive,
  metrics,
  errorMessage,
}: ControlPanelProps) {
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';
  const canStartInference = isConnected && isCameraActive;

  return (
    <div className="control-panel-card">
      <div className="control-panel-header">
        <div className="title-with-icon">
          <Activity size={20} className="icon-accent" />
          <h2>Detection Controls</h2>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setShowSettings((prev) => !prev)}
          title="Toggle Backend & FPS Settings"
        >
          <Sliders size={16} />
          <span>Config</span>
          {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Primary Action Buttons (Requested by user) */}
      <div className="primary-buttons-grid">
        {/* BUTTON 1: Connect / Disconnect Backend */}
        <div className="control-button-wrapper">
          {isConnected ? (
            <button
              type="button"
              className="btn btn-connected btn-lg full-width"
              onClick={onDisconnect}
              id="disconnect-backend-btn"
            >
              <CheckCircle2 size={20} className="text-emerald" />
              <div className="btn-text-group">
                <span className="btn-main-text">Backend Connected</span>
                <span className="btn-sub-text">Click to Disconnect</span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-primary btn-lg full-width ${isConnecting ? 'loading' : ''}`}
              onClick={onConnect}
              disabled={isConnecting}
              id="connect-backend-btn"
            >
              {isConnecting ? (
                <>
                  <Loader2 size={20} className="spin-animation" />
                  <div className="btn-text-group">
                    <span className="btn-main-text">Connecting...</span>
                    <span className="btn-sub-text">Establishing WebSocket</span>
                  </div>
                </>
              ) : (
                <>
                  <Server size={20} />
                  <div className="btn-text-group">
                    <span className="btn-main-text">Connect Backend</span>
                    <span className="btn-sub-text">WebSocket API</span>
                  </div>
                </>
              )}
            </button>
          )}
          <div className="button-status-caption">
            <span className={`status-dot ${connectionStatus}`} />
            <span className="caption-text">
              Status: <strong>{connectionStatus.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* BUTTON 2: Start / Stop PPE Inference */}
        <div className="control-button-wrapper">
          {isInferring ? (
            <button
              type="button"
              className="btn btn-danger btn-lg full-width pulse-active"
              onClick={onStopInference}
              id="stop-inference-btn"
            >
              <Square size={20} />
              <div className="btn-text-group">
                <span className="btn-main-text">Stop Inference</span>
                <span className="btn-sub-text">Streaming @ {metrics.fpsSent} FPS</span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-accent btn-lg full-width"
              onClick={onStartInference}
              disabled={!canStartInference}
              id="start-inference-btn"
              title={
                !isConnected
                  ? 'Connect to the backend first'
                  : !isCameraActive
                  ? 'Turn on the webcam first'
                  : 'Start transmitting frames for PPE detection'
              }
            >
              <Play size={20} />
              <div className="btn-text-group">
                <span className="btn-main-text">Start Inference</span>
                <span className="btn-sub-text">Target: {targetFps} FPS</span>
              </div>
            </button>
          )}

          <div className="button-status-caption">
            <span className={`status-dot ${isInferring ? 'active' : 'idle'}`} />
            <span className="caption-text">
              {isInferring ? (
                <>
                  Inferring: <strong>{metrics.fpsSent} FPS Sent</strong> ({metrics.latencyMs}ms)
                </>
              ) : !isConnected ? (
                <span className="text-muted">Requires backend connection</span>
              ) : !isCameraActive ? (
                <span className="text-muted">Requires active camera</span>
              ) : (
                <span className="text-ready">Ready to start</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Error message banner */}
      {errorMessage && (
        <div className="control-error-banner">
          <XCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Expandable Configuration Drawer */}
      {showSettings && (
        <div className="control-settings-drawer">
          <div className="setting-group">
            <label htmlFor="ws-url-input" className="setting-label">
              <Radio size={14} />
              <span>Backend WebSocket URL:</span>
            </label>
            <div className="url-input-group">
              <input
                id="ws-url-input"
                type="text"
                className="input-text"
                value={serverUrl}
                onChange={(e) => onServerUrlChange(e.target.value)}
                placeholder="ws://localhost:8000/ws/predict"
                disabled={isConnected}
              />
              {isConnected && (
                <span className="badge badge-success">Locked while connected</span>
              )}
            </div>
            <p className="setting-helper">
              FastAPI WebSocket endpoint for YOLOv8 inference. Default: <code>ws://localhost:8000/ws/predict</code>
            </p>
          </div>

          <div className="setting-group">
            <div className="fps-label-row">
              <label htmlFor="fps-slider" className="setting-label">
                <span>Frame Sending Rate:</span>
              </label>
              <span className="fps-value-tag">{targetFps} FPS</span>
            </div>

            <div className="fps-slider-wrapper">
              <input
                id="fps-slider"
                type="range"
                min="10"
                max="15"
                step="1"
                value={targetFps}
                onChange={(e) => onTargetFpsChange(Number(e.target.value))}
                className="range-slider"
              />
              <div className="range-ticks">
                <span className={targetFps === 10 ? 'tick active' : 'tick'}>10 FPS</span>
                <span className={targetFps === 12 ? 'tick active' : 'tick'}>12 FPS</span>
                <span className={targetFps === 15 ? 'tick active' : 'tick'}>15 FPS</span>
              </div>
            </div>
            <p className="setting-helper">
              Sends 10 to 15 frames per second from the webcam to balance inference accuracy and network bandwidth.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
