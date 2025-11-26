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
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  rotation?: number;
}
