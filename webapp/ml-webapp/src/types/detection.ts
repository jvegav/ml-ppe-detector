export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in source frame coordinates
}

export interface InferenceResponse {
  frame_width: number;
  frame_height: number;
  total_detections: number;
  detections: Detection[];
  error?: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface PerformanceMetrics {
  fpsSent: number;
  fpsReceived: number;
  latencyMs: number;
  totalFramesSent: number;
  totalFramesReceived: number;
}
