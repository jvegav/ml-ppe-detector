import { HardHat, LogOut, Radio, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/useAuth.ts';
import { useWebcam } from '../hooks/useWebcam.ts';
import { useInferenceWebSocket } from '../hooks/useInferenceWebSocket.ts';
import { WebcamStream } from './WebcamStream.tsx';
import { ControlPanel } from './ControlPanel.tsx';
import { DetectionList } from './DetectionList.tsx';
import { StatsPanel } from './StatsPanel.tsx';

export function DashboardScreen() {
  const { user, logout } = useAuth();

  // Webcam hook
  const {
    videoRef,
    isStreaming,
    error: cameraError,
    startCamera,
    stopCamera,
    videoDimensions,
  } = useWebcam();

  // Inference WebSocket hook with frame rate throttling (10 to 15 FPS)
  const {
    status: connectionStatus,
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
    errorMessage: wsError,
    metrics,
  } = useInferenceWebSocket(videoRef, {
    defaultUrl: 'ws://localhost:8000/ws/predict',
    defaultFps: 12,
  });

  const detections = latestResponse?.detections || [];
  const totalDetections = latestResponse?.total_detections || 0;
  const sourceWidth = latestResponse?.frame_width || videoDimensions.width || 640;
  const sourceHeight = latestResponse?.frame_height || videoDimensions.height || 480;

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <header className="dashboard-navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <HardHat size={22} />
          </div>
          <div className="navbar-title-group">
            <span className="navbar-title">PPE Vision System</span>
            <span className="navbar-subtitle">Live Safety AI Inspection</span>
          </div>
        </div>

        {/* Status Indicators in Header */}
        <div className="navbar-status-group">
          <div className={`nav-pill ${connectionStatus}`}>
            <Radio size={13} />
            <span>Backend: {connectionStatus.toUpperCase()}</span>
          </div>

          <div className={`nav-pill ${isStreaming ? 'connected' : 'disconnected'}`}>
            <span className={`status-dot ${isStreaming ? 'connected' : 'disconnected'}`} />
            <span>Camera: {isStreaming ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          <div className={`nav-pill ${isInferring ? 'active' : 'idle'}`}>
            <span className={`status-dot ${isInferring ? 'active' : 'idle'}`} />
            <span>Inference: {isInferring ? `${metrics.fpsSent} FPS` : 'STANDBY'}</span>
          </div>
        </div>

        {/* User Profile & Logout */}
        <div className="navbar-user-group">
          <div className="user-profile-badge">
            <div className="user-avatar">
              <UserIcon size={16} />
            </div>
            <div className="user-info">
              <span className="user-name">{user?.username || 'Operator'}</span>
              <span className="user-role">{user?.role || 'Safety Inspector'}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={logout}
            title="Sign out and return to login"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-content">
        {/* Performance & Metrics Bar */}
        <section className="dashboard-stats-section">
          <StatsPanel
            metrics={metrics}
            isInferring={isInferring}
            targetFps={targetFps}
            totalDetections={totalDetections}
          />
        </section>

        {/* Core Detection Grid: Camera + Controls on Left, Detections on Right */}
        <div className="dashboard-grid">
          {/* Column 1: Video Feed & Inference Controls */}
          <div className="dashboard-main-col">
            <WebcamStream
              videoRef={videoRef}
              isStreaming={isStreaming}
              isInferring={isInferring}
              detections={detections}
              sourceWidth={sourceWidth}
              sourceHeight={sourceHeight}
              onStartCamera={startCamera}
              onStopCamera={stopCamera}
              error={cameraError}
            />

            <ControlPanel
              connectionStatus={connectionStatus}
              serverUrl={serverUrl}
              onServerUrlChange={setServerUrl}
              onConnect={() => connect()}
              onDisconnect={disconnect}
              isInferring={isInferring}
              onStartInference={startInference}
              onStopInference={stopInference}
              targetFps={targetFps}
              onTargetFpsChange={setTargetFps}
              isCameraActive={isStreaming}
              metrics={metrics}
              errorMessage={wsError}
            />
          </div>

          {/* Column 2: Real-time Detections & System Telemetry */}
          <aside className="dashboard-side-col">
            <DetectionList
              detections={detections}
              totalDetections={totalDetections}
              isInferring={isInferring}
            />

            {/* Quick Inspection Guide Card */}
            <div className="info-card">
              <div className="info-card-header">
                <Shield size={18} className="text-accent" />
                <h3>PPE Detection Guide</h3>
              </div>
              <ul className="guide-list">
                <li>
                  <span className="legend-dot compliant" />
                  <strong>Green:</strong> Verified PPE equipment (Helmets, Safety Vests, Masks, Gloves)
                </li>
                <li>
                  <span className="legend-dot violation" />
                  <strong>Red:</strong> Missing required PPE or Safety Violation detected
                </li>
                <li>
                  <span className="legend-dot neutral" />
                  <strong>Blue:</strong> Detected Personnel / Worker bounding box
                </li>
                <li>
                  <span className="legend-dot rate" />
                  <strong>Streaming:</strong> Frame rate throttled to {targetFps} FPS for low-latency YOLO processing
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
