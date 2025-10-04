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

    setLines(prevLines => [...prevLines, { 
      tool: drawingMode, 
      points: [pos.x, pos.y]
    }]);
  }, [activeTool, drawingMode, stageRef, setLines]);

  const handleDrawingMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'pen' || !isDrawing.current) return;

    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = getRelativePointerPosition(stage);
    if (!point) return;

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
  }, [activeTool, stageRef, setLines]);

  const handleDrawingMouseUp = useCallback(() => {
    if (activeTool !== 'pen') return;
    
    if (isDrawing.current) {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    
    isDrawing.current = false;
  }, [activeTool, lines, addAction]);

  // Touch handlers for pen tool
  const handleDrawingTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool !== 'pen') return;
    
    e.evt.preventDefault();
    isDrawing.current = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    setLines(prevLines => [...prevLines, { 
      tool: drawingMode, 
      points: [pos.x, pos.y]
    }]);
  }, [activeTool, drawingMode, stageRef, setLines]);

  const handleDrawingTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool !== 'pen' || !isDrawing.current) return;

    e.evt.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = getRelativePointerPosition(stage);
    if (!point) return;

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
  }, [activeTool, stageRef, setLines]);

  const handleDrawingTouchEnd = useCallback(() => {
    if (activeTool !== 'pen') return;
    
    if (isDrawing.current) {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    
    isDrawing.current = false;
  }, [activeTool, lines, addAction]);

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
                            tool === "pen" ? 'crosshair' : 'default';
    
    drawLayer.batchDraw();
  }, [activeTool, setActiveTool, stageRef]);

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
    
    // Refs
    isDrawing,
  };
};
