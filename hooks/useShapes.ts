// hooks/useShapes.ts
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
  points?: number[];
  fill: string;
  draggable: boolean;
  zIndex?: number;
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
      draggable: draggable,
      zIndex: Date.now(), // Use timestamp for initial zIndex
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
          points: [0, 0, 100, 0, 50, 86.6],
          fill: "#ffaae3",
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
    return { shapeId, shapeData: newShape }; // Return both ID and data
  }, []);

  const updateShape = useCallback((id: string, attrs: Partial<KonvaShape>) => {
    setShapes(prev => prev.map(shape => 
      shape.id === id ? { ...shape, ...attrs } : shape
    ));
  }, []);

  const removeShape = useCallback((id: string) => {
    setShapes(prev => prev.filter(shape => shape.id !== id));
  }, []);

  // FIXED: Z-index operations - only modify zIndex, preserve all other properties
  const bringForward = useCallback((shapeId: string) => {
    setShapes(prev => {
      const index = prev.findIndex(s => s.id === shapeId);
      if (index === -1 || index === prev.length - 1) return prev;
      const newShapes = [...prev];
      const currZ = newShapes[index].zIndex ?? 0;
      const nextZ = newShapes[index + 1].zIndex ?? 0;
      newShapes[index] = { ...newShapes[index], zIndex: nextZ };
      newShapes[index + 1] = { ...newShapes[index + 1], zIndex: currZ };
      return newShapes;
    });
  }, []);

  const sendBackward = useCallback((shapeId: string) => {
    setShapes(prev => {
      const index = prev.findIndex(s => s.id === shapeId);
      if (index <= 0) return prev;
      const newShapes = [...prev];
      const currZ = newShapes[index].zIndex ?? 0;
      const prevZ = newShapes[index - 1].zIndex ?? 0;
      newShapes[index] = { ...newShapes[index], zIndex: prevZ };
      newShapes[index - 1] = { ...newShapes[index - 1], zIndex: currZ };
      return newShapes;
    });
  }, []);

  const bringToFront = useCallback((shapeId: string) => {
    setShapes(prev => {
      const maxZ = Math.max(...prev.map(s => s.zIndex ?? 0)) + 1;
      return prev.map(shape => shape.id === shapeId ? { ...shape, zIndex: maxZ } : shape);
    });
  }, []);

  const sendToBack = useCallback((shapeId: string) => {
    setShapes(prev => {
      const minZ = Math.min(...prev.map(s => s.zIndex ?? 0)) - 1;
      return prev.map(shape => shape.id === shapeId ? { ...shape, zIndex: minZ } : shape);
    });
  }, []);

  return {
    shapes,
    addShape,
    updateShape,
    removeShape,
    setShapes,
    // Z-index operations
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
  };
};
