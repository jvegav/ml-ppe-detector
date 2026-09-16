import { useEffect, useRef } from 'react';
import type { Detection } from '../types/detection.ts';

interface BoundingBoxOverlayProps {
  detections: Detection[];
  sourceWidth: number;
  sourceHeight: number;
  containerWidth: number;
  containerHeight: number;
}

// Color palette for PPE classes
function getClassColor(className: string): { stroke: string; fill: string; text: string } {
  const normalized = className.toLowerCase().replace(/[-_]/g, '');

  // Violations / Missing PPE: Red / Alert
  if (
    normalized.includes('nohelmet') ||
    normalized.includes('novest') ||
    normalized.includes('nomask') ||
    normalized.includes('violation') ||
    normalized.includes('hazard') ||
    normalized.startsWith('no')
  ) {
    return {
      stroke: '#ef4444', // Red-500
      fill: 'rgba(239, 68, 68, 0.15)',
      text: '#ffffff',
    };
  }

  // Compliant PPE: Emerald / Green
  if (
    normalized.includes('helmet') ||
    normalized.includes('hardhat') ||
    normalized.includes('vest') ||
    normalized.includes('mask') ||
    normalized.includes('glove') ||
    normalized.includes('boot') ||
    normalized.includes('glass') ||
    normalized.includes('shield')
  ) {
    return {
      stroke: '#10b981', // Emerald-500
      fill: 'rgba(16, 185, 129, 0.15)',
      text: '#ffffff',
    };
  }

  // Person / Worker: Blue / Indigo
  if (normalized.includes('person') || normalized.includes('worker') || normalized.includes('human')) {
    return {
      stroke: '#3b82f6', // Blue-500
      fill: 'rgba(59, 130, 246, 0.12)',
      text: '#ffffff',
    };
  }

  // Default: Amber / Gold
  return {
    stroke: '#f59e0b', // Amber-500
    fill: 'rgba(245, 158, 11, 0.15)',
    text: '#ffffff',
  };
}

export function BoundingBoxOverlay({
  detections,
  sourceWidth,
  sourceHeight,
  containerWidth,
  containerHeight,
}: BoundingBoxOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detections || detections.length === 0 || !sourceWidth || !sourceHeight) {
      return;
    }

    const scaleX = canvas.width / sourceWidth;
    const scaleY = canvas.height / sourceHeight;

    detections.forEach((item) => {
      const [rawX1, rawY1, rawX2, rawY2] = item.bbox;
      const x1 = rawX1 * scaleX;
      const y1 = rawY1 * scaleY;
      const x2 = rawX2 * scaleX;
      const y2 = rawY2 * scaleY;
      const width = Math.max(0, x2 - x1);
      const height = Math.max(0, y2 - y1);

      const color = getClassColor(item.class_name);

      // Draw bounding box shadow / highlight
      ctx.fillStyle = color.fill;
      ctx.fillRect(x1, y1, width, height);

      // Draw bounding box outline
      ctx.strokeStyle = color.stroke;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.strokeRect(x1, y1, width, height);

      // Label text
      const percent = Math.round(item.confidence * 100);
      const labelText = `${item.class_name} ${percent}%`;

      // Measure text for badge
      ctx.font = 'bold 13px ui-sans-serif, system-ui, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const paddingX = 8;
      const badgeHeight = 22;
      const badgeWidth = textMetrics.width + paddingX * 2;

      // Position badge: prefer above the box, fallback to inside if at top edge
      let badgeY = y1 - badgeHeight;
      if (badgeY < 0) {
        badgeY = y1;
      }

      // Draw badge background
      ctx.fillStyle = color.stroke;
      ctx.beginPath();
      ctx.roundRect(x1, badgeY, badgeWidth, badgeHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Draw badge text
      ctx.fillStyle = color.text;
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, x1 + paddingX, badgeY + badgeHeight / 2);
    });
  }, [detections, sourceWidth, sourceHeight, containerWidth, containerHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={containerWidth || 640}
      height={containerHeight || 480}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        objectFit: 'contain',
      }}
    />
  );
}
