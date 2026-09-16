import { Cpu, Gauge, Layers, Zap } from 'lucide-react';
import type { PerformanceMetrics } from '../types/detection.ts';

interface StatsPanelProps {
  metrics: PerformanceMetrics;
  isInferring: boolean;
  targetFps: number;
  totalDetections: number;
}

export function StatsPanel({ metrics, isInferring, targetFps, totalDetections }: StatsPanelProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Streaming Rate</span>
          <Gauge size={16} className="text-accent" />
        </div>
        <div className="stat-card-value">
          {isInferring ? metrics.fpsSent : 0} <span className="stat-unit">FPS</span>
        </div>
        <div className="stat-card-footer">
          Target: <strong>{targetFps} FPS</strong> (10-15 range)
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Inference Latency</span>
          <Zap size={16} className="text-amber" />
        </div>
        <div className="stat-card-value">
          {isInferring && metrics.latencyMs > 0 ? metrics.latencyMs : '--'}{' '}
          <span className="stat-unit">ms</span>
        </div>
        <div className="stat-card-footer">
          {metrics.latencyMs > 0 && metrics.latencyMs < 100
            ? 'Optimal speed (<100ms)'
            : 'Roundtrip ping + YOLO'}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Active Detections</span>
          <Layers size={16} className="text-emerald" />
        </div>
        <div className="stat-card-value">
          {totalDetections} <span className="stat-unit">objects</span>
        </div>
        <div className="stat-card-footer">In current video frame</div>
      </div>

      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">Total Processed</span>
          <Cpu size={16} className="text-cyan" />
        </div>
        <div className="stat-card-value">
          {metrics.totalFramesSent} <span className="stat-unit">frames</span>
        </div>
        <div className="stat-card-footer">Sent to backend session</div>
      </div>
    </div>
  );
}
