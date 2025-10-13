// hooks/useShapes.ts
import { Tool } from '@/types/board-types';

export interface KonvaShape {
  id: string;
  type: Tool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  radiusX?: number;
  radiusY?: number;
  points?: number[];
  fill: string;
  draggable: boolean;
  // REMOVED: zIndex?: number; - We're using array order now
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}
