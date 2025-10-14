import { useRef, useCallback } from "react";
import Konva from "konva";
import { Tool, Action } from "../types/board-types";

function getRelativePointerPosition(stage: Konva.Stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  return transform.point(pos);
}

// Helper function to check if a point is near a line segment
function isPointNearLine(
  point: { x: number; y: number },
  linePoints: number[],
  threshold: number = 10
): boolean {
  for (let i = 0; i < linePoints.length - 2; i += 2) {
    const x1 = linePoints[i];
    const y1 = linePoints[i + 1];
    const x2 = linePoints[i + 2];
    const y2 = linePoints[i + 3];

    // Calculate distance from point to line segment
    const A = point.x - x1;
    const B = point.y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= threshold) {
      return true;
    }
  }
  return false;
}

export const useKonvaTools = (
  stageRef: React.RefObject<Konva.Stage | null>,
  activeTool: Tool | null,
  scale: number,
  position: { x: number; y: number },
  drawingMode: 'brush' | 'eraser',
  lines: Array<{tool: 'brush' | 'eraser', points: number[]}>,
  connectionStart: { x: number; y: number } | null,
  tempConnection: Konva.Line | null,
  isConnecting: boolean,
  selectedNodeId: string | null,
  setActiveTool: (tool: Tool | null) => void,
  setDrawingMode: (mode: 'brush' | 'eraser') => void,
  setLines: React.Dispatch<React.SetStateAction<Array<{tool: 'brush' | 'eraser', points: number[]}>>>,
  setConnectionStart: (start: { x: number; y: number } | null) => void,
  setTempConnection: (connection: Konva.Line | null) => void,
  setIsConnecting: (connecting: boolean) => void,
  setSelectedNodeId: (id: string | null) => void,
  addAction: (action: Action) => void
) => {
  const isDrawing = useRef(false);
  const lastErasedLines = useRef<number[]>([]); // Track recently erased lines to avoid duplicate detection

  // NEW: Function to detect and erase lines that intersect with current eraser position
  const detectAndEraseLines = useCallback((currentPoint: { x: number; y: number }) => {
    setLines(prevLines => {
      const linesToKeep: Array<{tool: 'brush' | 'eraser', points: number[]}> = [];
      const erasedLineIndices: number[] = [];

      prevLines.forEach((line, index) => {
        // Only check brush lines (not eraser lines) and lines not recently erased
        if (line.tool === 'brush' && !lastErasedLines.current.includes(index)) {
          if (isPointNearLine(currentPoint, line.points, 15 / scale)) {
            // This line is near the eraser - mark it for erasure
            erasedLineIndices.push(index);
            addAction({ type: "delete-line", lineIndex: index });
          } else {
            linesToKeep.push(line);
          }
        } else {
          linesToKeep.push(line);
        }
      });

      // Update recently erased lines
      if (erasedLineIndices.length > 0) {
        lastErasedLines.current = [...lastErasedLines.current, ...erasedLineIndices];
        
        // Clear the recently erased lines after a short delay to allow continuous erasing
        setTimeout(() => {
          lastErasedLines.current = lastErasedLines.current.filter(
            idx => !erasedLineIndices.includes(idx)
          );
        }, 100);
      }

      return linesToKeep;
    });
  }, [setLines, addAction, scale]);

  // ---------- Connection Tool Logic ----------
  const handleConnectionStart = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect") return;
    
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    setConnectionStart({ x: pos.x, y: pos.y });
    setIsConnecting(true);
    
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (drawLayer) {
      const line = new Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: '#007bff',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [5, 5],
        listening: false,
      });
      drawLayer.add(line);
      setTempConnection(line);
      drawLayer.batchDraw();
    }
  }, [activeTool, stageRef, setConnectionStart, setIsConnecting, setTempConnection]);

  const handleConnectionMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect" || !isConnecting || !tempConnection || !connectionStart) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = getRelativePointerPosition(stage);
    if (!point) return;

    tempConnection.points([connectionStart.x, connectionStart.y, point.x, point.y]);
    tempConnection.getLayer()?.batchDraw();
  }, [activeTool, isConnecting, tempConnection, connectionStart, stageRef]);

  const handleConnectionEnd = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect" || !isConnecting || !tempConnection || !connectionStart) return;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = getRelativePointerPosition(stage);
    if (!point) return;

    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    
    const connectionLine = new Konva.Arrow({
      points: [connectionStart.x, connectionStart.y, point.x, point.y],
      stroke: '#6c757d',
      strokeWidth: 3,
      fill: '#6c757d',
      pointerLength: 12,
      pointerWidth: 12,
      draggable: true,
      lineCap: 'round',
      lineJoin: 'round',
      name: 'selectable-shape',
    });
    
    if (drawLayer) {
      drawLayer.add(connectionLine);
      addAction({ type: "add", node: connectionLine });
    }
    
    if (drawLayer && tempConnection) {
      tempConnection.destroy();
      drawLayer.batchDraw();
    }
    
    setTempConnection(null);
    setConnectionStart(null);
    setIsConnecting(false);
  }, [activeTool, isConnecting, tempConnection, connectionStart, stageRef, addAction]);

  const handleConnectionHover = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect" || isConnecting) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    container.style.cursor = 'crosshair';
  }, [activeTool, isConnecting, stageRef]);

  // ---------- Pen Tool Logic ----------
  const handleDrawingMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'pen') return;

    e.cancelBubble = true;
    isDrawing.current = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    // For eraser mode, detect lines immediately on mouse down
    if (drawingMode === 'eraser') {
      detectAndEraseLines(pos);
    } else {
      // For brush mode, start a new line
      setLines(prevLines => [...prevLines, { 
        tool: drawingMode, 
        points: [pos.x, pos.y]
      }]);
    }
  }, [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]);

  const handleDrawingMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'pen' || !isDrawing.current) return;

    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = getRelativePointerPosition(stage);
    if (!point) return;

    if (drawingMode === 'eraser') {
      // For eraser mode, detect and erase lines as we move
      detectAndEraseLines(point);
    } else {
      // For brush mode, continue drawing the current line
      setLines(prevLines => {
        if (prevLines.length === 0) return prevLines;
        
        const lastLineIndex = prevLines.length - 1;
        const lastLine = prevLines[lastLineIndex];
        
        const updatedLine = {
          ...lastLine,
          points: [...lastLine.points, point.x, point.y]
        };
        
        const newLines = [...prevLines];
        newLines[lastLineIndex] = updatedLine;
        
        return newLines;
      });
    }
  }, [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]);

  const handleDrawingMouseUp = useCallback(() => {
    if (activeTool !== 'pen') return;
    
    if (isDrawing.current && drawingMode === 'brush') {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    
    isDrawing.current = false;
    // Clear recently erased lines when finishing erasing
    if (drawingMode === 'eraser') {
      lastErasedLines.current = [];
    }
  }, [activeTool, drawingMode, lines, addAction]);

  // Touch handlers for pen tool
  const handleDrawingTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool !== 'pen') return;
    
    e.evt.preventDefault();
    isDrawing.current = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    if (drawingMode === 'eraser') {
      detectAndEraseLines(pos);
    } else {
      setLines(prevLines => [...prevLines, { 
        tool: drawingMode, 
        points: [pos.x, pos.y]
      }]);
    }
  }, [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]);

  const handleDrawingTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool !== 'pen' || !isDrawing.current) return;

    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = getRelativePointerPosition(stage);
    if (!point) return;

    if (drawingMode === 'eraser') {
      detectAndEraseLines(point);
    } else {
      setLines(prevLines => {
        if (prevLines.length === 0) return prevLines;
        
        const lastLineIndex = prevLines.length - 1;
        const lastLine = prevLines[lastLineIndex];
        
        const updatedLine = {
          ...lastLine,
          points: [...lastLine.points, point.x, point.y]
        };
        
        const newLines = [...prevLines];
        newLines[lastLineIndex] = updatedLine;
        
        return newLines;
      });
    }
  }, [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]);

  const handleDrawingTouchEnd = useCallback(() => {
    if (activeTool !== 'pen') return;
    
    if (isDrawing.current && drawingMode === 'brush') {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    
    isDrawing.current = false;
    if (drawingMode === 'eraser') {
      lastErasedLines.current = [];
    }
  }, [activeTool, drawingMode, lines, addAction]);

  // ---------- Centralized Mouse Handlers ----------
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingMouseDown(e);
    } else if (activeTool === 'connect') {
      handleConnectionStart(e);
    }
  }, [activeTool, handleDrawingMouseDown, handleConnectionStart]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingMouseMove(e);
    } else if (activeTool === 'connect') {
      handleConnectionMove(e);
      handleConnectionHover(e);
    }
  }, [activeTool, handleDrawingMouseMove, handleConnectionMove, handleConnectionHover]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingMouseUp();
    } else if (activeTool === 'connect') {
      handleConnectionEnd(e);
    }
  }, [activeTool, handleDrawingMouseUp, handleConnectionEnd]);

  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingTouchStart(e);
    }
  }, [activeTool, handleDrawingTouchStart]);

  const handleTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingTouchEnd();
    }
  }, [activeTool, handleDrawingTouchEnd]);

  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingTouchMove(e);
    }
  }, [activeTool, handleDrawingTouchMove]);

  // ---------- Wheel Handler ----------
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? 1 : -1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();
  }, [stageRef]);

  // ---------- Tool Change Handler ----------
  const handleToolChange = useCallback((tool: Tool | null) => {
    if (activeTool === 'pen' && tool !== 'pen') {
      isDrawing.current = false;
      lastErasedLines.current = [];
    }
    
    setActiveTool(tool);
    
    if (!stageRef.current) return;
    
    const drawLayer = stageRef.current.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    const shapes = drawLayer.find('.selectable-shape');
    shapes.forEach((shape: Konva.Node) => {
      shape.draggable(tool === "select");
    });
    
    const container = stageRef.current.container();
    container.style.cursor = tool === "connect" ? 'crosshair' : 
                            tool === "select" ? 'move' : 
                            tool === "pen" ? (drawingMode === 'eraser' ? 'cell' : 'crosshair') : 'default';
    
    drawLayer.batchDraw();
  }, [activeTool, drawingMode, setActiveTool, stageRef]);
  const handleZoomIn = useCallback(() => {
  const stage = stageRef.current;
  if (!stage) return;

  const scaleBy = 1.2;
  const oldScale = stage.scaleX();
  const newScale = Math.min(oldScale * scaleBy, 5); // Max zoom 500%

  stage.scale({ x: newScale, y: newScale });
  stage.batchDraw();
}, [stageRef]);

const handleZoomOut = useCallback(() => {
  const stage = stageRef.current;
  if (!stage) return;

  const scaleBy = 1.2;
  const oldScale = stage.scaleX();
  const newScale = Math.max(oldScale / scaleBy, 0.1); // Min zoom 10%

  stage.scale({ x: newScale, y: newScale });
  stage.batchDraw();
}, [stageRef]);


  return {
    // Handlers
    handleToolChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleConnectionStart,
    handleConnectionMove,
    handleConnectionEnd,
    handleDrawingMouseDown,
    handleDrawingMouseMove,
    handleDrawingMouseUp,
    handleWheel,
    handleZoomIn,    // ← ADD THIS
    handleZoomOut,
    // Refs
    isDrawing,
  };
};