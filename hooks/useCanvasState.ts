import { useState, useCallback } from 'react';
import { CanvasState, Stroke, Point, ToolMode } from '@/types/canvas';

export function useCanvasState() {
  const [state, setState] = useState<CanvasState>({
    strokes: [],
    currentStroke: null,
  });

  const [toolMode, setToolMode] = useState<ToolMode>('pan');

  const startStroke = useCallback((point: Point, color: string = '#000000', width: number = 4) => {
    const newStroke: Stroke = {
      id: Math.random().toString(36).substr(2, 9),
      points: [point],
      color,
      width,
      type: toolMode === 'erase' ? 'erase' : 'draw',
    };

    setState(prev => ({
      ...prev,
      currentStroke: newStroke,
    }));

    return newStroke;
  }, [toolMode]);

  const addPointToStroke = useCallback((point: Point) => {
    setState(prev => {
      if (!prev.currentStroke) return prev;

      return {
        ...prev,
        currentStroke: {
          ...prev.currentStroke,
          points: [...prev.currentStroke.points, point],
        },
      };
    });
  }, []);

  const completeStroke = useCallback(() => {
    setState(prev => {
      if (!prev.currentStroke) return prev;

      const completedStroke = prev.currentStroke;
      
      // For erase strokes, remove intersecting strokes
      if (completedStroke.type === 'erase') {
        const remainingStrokes = prev.strokes.filter(stroke => 
          !isStrokeIntersecting(stroke, completedStroke)
        );
        
        return {
          strokes: remainingStrokes,
          currentStroke: null,
        };
      }

      return {
        strokes: [...prev.strokes, completedStroke],
        currentStroke: null,
      };
    });
  }, []);

  const isStrokeIntersecting = (stroke: Stroke, eraserStroke: Stroke): boolean => {
    // Simple hit-test: check if any point in the stroke is close to any point in the eraser stroke
    const ERASER_RADIUS = 20;
    
    return stroke.points.some(strokePoint =>
      eraserStroke.points.some(eraserPoint =>
        Math.sqrt(
          Math.pow(strokePoint.x - eraserPoint.x, 2) + 
          Math.pow(strokePoint.y - eraserPoint.y, 2)
        ) < ERASER_RADIUS
      )
    );
  };

  const clearCanvas = useCallback(() => {
    setState({
      strokes: [],
      currentStroke: null,
    });
  }, []);

  return {
    state,
    toolMode,
    setToolMode,
    startStroke,
    addPointToStroke,
    completeStroke,
    clearCanvas,
  };
}