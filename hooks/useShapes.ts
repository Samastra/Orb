import { useState, useCallback } from 'react';
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
  points?: number[]; // Add this for triangle and arrow
  fill: string;
  draggable: boolean;
}

export const useShapes = () => {
  const [shapes, setShapes] = useState<KonvaShape[]>([]);

  const addShape = useCallback((type: Tool, center: { x: number; y: number }, draggable: boolean) => {
  const shapeId = `shape-${Date.now()}`;
    
    const baseShape = {
    id: shapeId,
    type,
    x: center.x,
    y: center.y,
    fill: "#aae3ff",
    draggable: draggable, // Use the passed parameter
  };

    let newShape: KonvaShape;

    switch (type) {
      case "rect":
        newShape = {
          ...baseShape,
          x: center.x - 50,
          y: center.y - 50,
          width: 100,
          height: 100,
        };
        break;
        case "triangle":
        newShape = {
          ...baseShape,
          points: [0, 0, 100, 0, 50, 86.6], // Equilateral triangle points
          fill: "#ffaae3", // Different color for triangle
        };
        break;
      case "circle":
        newShape = {
          ...baseShape,
          radius: 50,
        };
        break;
      case "ellipse":
        newShape = {
          ...baseShape,
          radiusX: 80,
          radiusY: 50,
          fill: "pink",
        };
        break;
      case "arrow":
        newShape = {
          ...baseShape,
          points: [0, 0, 100, 0],
          fill: "black",
        };
        break;
      default:
        return null;
    }

    setShapes(prev => [...prev, newShape]);
    return shapeId;
  }, []);

  const updateShape = useCallback((id: string, attrs: Partial<KonvaShape>) => {
    setShapes(prev => prev.map(shape => 
      shape.id === id ? { ...shape, ...attrs } : shape
    ));
  }, []);

  const removeShape = useCallback((id: string) => {
    setShapes(prev => prev.filter(shape => shape.id !== id));
  }, []);

  return {
    shapes,
    addShape,
    updateShape,
    removeShape,
    setShapes,
  };
};