export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  type: 'draw' | 'erase';
}

export interface CanvasState {
  strokes: Stroke[];
  currentStroke: Stroke | null;
}

export type ToolMode = 'pan' | 'draw' | 'erase';