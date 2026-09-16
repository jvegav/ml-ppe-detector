import { AlertTriangle, CheckCircle, Crosshair, ShieldCheck, Tag } from 'lucide-react';
import type { Detection } from '../types/detection.ts';

interface DetectionListProps {
  detections: Detection[];
  totalDetections: number;
  isInferring: boolean;
}

export function DetectionList({ detections, totalDetections, isInferring }: DetectionListProps) {
  const violations = detections.filter((d) => {
    const name = d.class_name.toLowerCase();
    return name.includes('no-') || name.includes('hazard') || name.includes('violation');
  });

  const compliantItems = detections.filter((d) => {
    const name = d.class_name.toLowerCase();
    return !name.includes('no-') && !name.includes('hazard') && !name.includes('violation');
  });

  return (
    <div className="detection-list-card">
      <div className="detection-list-header">
        <div className="title-with-icon">
          <Crosshair size={20} className="icon-accent" />
          <h2>Real-Time Detections</h2>
        </div>
        <span className="count-pill">{totalDetections} found</span>
      </div>

      {/* Breakdown summary */}
      <div className="summary-chips-row">
        <div className="chip chip-compliant">
          <ShieldCheck size={14} />
          <span>Compliant: {compliantItems.length}</span>
        </div>
        <div className="chip chip-violation">
          <AlertTriangle size={14} />
          <span>Violations: {violations.length}</span>
        </div>
      </div>

      {/* Detection item list */}
      <div className="detection-items-container">
        {!isInferring ? (
          <div className="empty-state">
            <Crosshair size={32} className="text-muted" />
            <p>Start inference to see live PPE detections</p>
          </div>
        ) : detections.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={32} className="text-muted" />
            <p>No objects or PPE detected in the current frame</p>
          </div>
        ) : (
          detections.map((item, index) => {
            const isViolation =
              item.class_name.toLowerCase().includes('no-') ||
              item.class_name.toLowerCase().includes('hazard') ||
              item.class_name.toLowerCase().includes('violation');
            const percent = Math.round(item.confidence * 100);

            return (
              <div
                key={`${item.class_id}-${index}-${item.bbox.join(',')}`}
                className={`detection-item-row ${isViolation ? 'violation' : 'compliant'}`}
              >
                <div className="item-info-top">
                  <div className="item-name-group">
                    <Tag size={14} className={isViolation ? 'text-danger' : 'text-emerald'} />
                    <span className="item-class-name">{item.class_name}</span>
                    <span className="item-id-badge">ID: {item.class_id}</span>
                  </div>
                  <span className="item-confidence-text">{percent}%</span>
                </div>

                {/* Confidence bar */}
                <div className="confidence-track">
                  <div
                    className={`confidence-bar ${isViolation ? 'bar-danger' : 'bar-success'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="item-bbox-caption">
                  BBox: [{item.bbox.map((n) => Math.round(n)).join(', ')}]
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
