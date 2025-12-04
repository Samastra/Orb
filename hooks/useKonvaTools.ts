// hooks/useKonvaTools.ts
import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import Konva from "konva";
import { Tool, Action, ReactShape, ImageShape } from "../types/board-types";
import { Connection, Side } from "./useBoardState";
import { getAnchorPoint, Rect } from "@/lib/connection-utils"; 
import { KonvaShape } from "./useShapes";
import { getRichCursor } from "@/lib/cursor-config"; 

const SNAP_THRESHOLD_SIDES: Side[] = ["top", "right", "bottom", "left"];
const THROTTLE_MS = 16; 

// Helper: Get Pointer Position relative to stage (accounts for zoom/pan)
function getRelativePointerPosition(stage: Konva.Stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  return transform.point(pos);
}

// Helper: Check if input is focused (to disable shortcuts)
const isTextInputFocused = (): boolean => {
  if (typeof document === 'undefined') return false;
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  const tagName = activeElement.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
  return isInput || isContentEditable;
};

// ⚡ OPTIMIZATION: Bounding Box Check for Eraser
function isPointInLineBBox(point: {x: number, y: number}, linePoints: number[], threshold: number): boolean {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Fast loop to find bounds
    for (let i = 0; i < linePoints.length; i += 2) {
        const x = linePoints[i];
        const y = linePoints[i+1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    
    // Check bounds with threshold
    return (
        point.x >= minX - threshold &&
        point.x <= maxX + threshold &&
        point.y >= minY - threshold &&
        point.y <= maxY + threshold
    );
}

// Detailed Geometry Check (Only runs if BBox check passes)
function isPointNearLine(point: { x: number; y: number }, linePoints: number[], threshold: number = 10): boolean {
  for (let i = 0; i < linePoints.length - 2; i += 2) {
    const x1 = linePoints[i];
    const y1 = linePoints[i + 1];
    const x2 = linePoints[i + 2];
    const y2 = linePoints[i + 3];
    const A = point.x - x1;
    const B = point.y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = point.x - xx;
    const dy = point.y - yy;
    if (Math.sqrt(dx * dx + dy * dy) <= threshold) return true;
  }
  return false;
}

export const useKonvaTools = (
  stageRef: React.RefObject<Konva.Stage | null>,
  activeTool: Tool | null,
  scale: number,
  position: { x: number; y: number },
  drawingMode: "brush" | "eraser",
  lines: Array<{ tool: "brush" | "eraser"; points: number[] }>,
  connectionStart: { nodeId: string; side: Side; x: number; y: number } | null,
  tempConnection: Connection | null,
  isConnecting: boolean,
  selectedNodeIds: string[],
  setActiveTool: (tool: Tool | null) => void,
  setDrawingMode: (mode: "brush" | "eraser") => void,
  setLines: React.Dispatch<React.SetStateAction<Array<{ tool: "brush" | "eraser"; points: number[] }>>>,
  setConnectionStart: (start: { nodeId: string; side: Side; x: number; y: number } | null) => void,
  setTempConnection: (connection: Connection | null) => void,
  setIsConnecting: (connecting: boolean) => void,
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>,
  addAction: (action: Action) => void,
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>,
  updateConnection: (id: string, updates: Partial<Connection>) => void,
  addShape: (type: Tool, addAction: (action: Action) => void, position: { x: number; y: number }) => void,
  allShapes: Array<ReactShape | KonvaShape | ImageShape>
) => {
  const isDrawing = useRef(false);
  const lastErasedLines = useRef<number[]>([]);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);
  const isSelecting = useRef(false);
  const selectionStart = useRef({ x: 0, y: 0 });
  const selectionRect = useRef<Konva.Rect | null>(null);
  const lastFrameTime = useRef<number>(0);
  
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // --- DRAG PERMISSIONS ---
  const updateDraggables = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;
    
    // Enable drag only if: Select Tool (or null) AND Spacebar is NOT pressed
    const enableDrag = (activeTool === "select" || activeTool === null) && !isSpacePressed;
    
    const shapes = drawLayer.find(".selectable-shape");
    shapes.forEach((shape: Konva.Node) => {
      shape.draggable(enableDrag);
    });
  }, [activeTool, isSpacePressed, stageRef]);

  useEffect(() => {
    updateDraggables();
  }, [updateDraggables, activeTool, isSpacePressed]);

  // --- CURSOR SYNC EFFECT ---
  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    
    const cursor = getRichCursor(activeTool, drawingMode, isSpacePressed, isPanning.current);
    stage.container().style.cursor = cursor;
    
  }, [activeTool, drawingMode, isSpacePressed, isPanning.current]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && isTextInputFocused()) return;
      if (e.key === ' ') {
        if (!isSpacePressed) {
            setIsSpacePressed(true); 
            e.preventDefault();
            
            if (stageRef.current) {
                stageRef.current.container().style.cursor = getRichCursor(activeTool, drawingMode, true, false);
                const layer = stageRef.current.findOne(".draw-layer") as Konva.Layer;
                if(layer) layer.find(".selectable-shape").forEach(s => s.draggable(false));
            }
        }
      }
    };
    const handleGlobalKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && isTextInputFocused()) return;
      if (e.key === ' ') {
        setIsSpacePressed(false);
        isPanning.current = false;
        
        if (stageRef.current) {
            stageRef.current.container().style.cursor = getRichCursor(activeTool, drawingMode, false, false);
            const layer = stageRef.current.findOne(".draw-layer") as Konva.Layer;
            if(layer) layer.find(".selectable-shape").forEach(s => s.draggable(true));
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('keyup', handleGlobalKeyUp);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('keyup', handleGlobalKeyUp);
    };
  }, [activeTool, drawingMode, stageRef, isSpacePressed]);

  // --- PANNING ---
  const handlePanningMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSpacePressed) return;
    const stage = stageRef.current;
    if (!stage) return;
    isPanning.current = true;
    const pointerPos = stage.getPointerPosition();
    if (pointerPos) lastPointerPosition.current = pointerPos;
    stage.container().style.cursor = getRichCursor(activeTool, drawingMode, true, true);
    e.cancelBubble = true;
  }, [stageRef, isSpacePressed, activeTool, drawingMode]);

  const handlePanningMouseUp = useCallback(() => {
    if (!isSpacePressed) return;
    isPanning.current = false;
    if (stageRef.current) {
        stageRef.current.container().style.cursor = getRichCursor(activeTool, drawingMode, true, false);
    }
  }, [stageRef, isSpacePressed, activeTool, drawingMode]);

  const handlePanningMouseMove = useCallback(() => {
    if (!isSpacePressed || !isPanning.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    
    const now = Date.now();
    if (now - lastFrameTime.current < 8) return; 
    lastFrameTime.current = now;

    const point = stage.getPointerPosition();
    if (!point || !lastPointerPosition.current) return;
    
    const dx = point.x - lastPointerPosition.current.x;
    const dy = point.y - lastPointerPosition.current.y;
    
    stage.position({ x: stage.x() + dx, y: stage.y() + dy });
    stage.batchDraw();
    lastPointerPosition.current = point;
  }, [stageRef, isSpacePressed]);

  // --- SELECTION RECTANGLE ---
  const handleSelectionStart = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "select" || isSpacePressed) return;
    if (e.target !== stageRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;
    
    isSelecting.current = true;
    selectionStart.current = { x: pos.x, y: pos.y };

    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    if (selectionRect.current) selectionRect.current.destroy();

    selectionRect.current = new Konva.Rect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      fill: 'rgba(0, 119, 255, 0.2)',
      stroke: '#0077ff',
      strokeWidth: 1,
      dash: [5, 5],
      name: 'selection-rect',
      listening: false,
    });
    drawLayer.add(selectionRect.current);
    drawLayer.batchDraw();
    e.cancelBubble = true;
  }, [activeTool, stageRef, isSpacePressed]);

  const handleSelectionMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting.current || !selectionRect.current || !stageRef.current) return;
    const stage = stageRef.current;
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    const x = Math.min(selectionStart.current.x, pos.x);
    const y = Math.min(selectionStart.current.y, pos.y);
    const width = Math.abs(pos.x - selectionStart.current.x);
    const height = Math.abs(pos.y - selectionStart.current.y);
    
    selectionRect.current.setAttrs({ x, y, width, height });
    selectionRect.current.getLayer()?.batchDraw();
    e.cancelBubble = true;
  }, [stageRef]);

  const handleSelectionEnd = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting.current || !selectionRect.current || !stageRef.current) return;
    const stage = stageRef.current;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    
    if (selectionRect.current) {
      const selectionBox = selectionRect.current.getClientRect();
      const selectedShapes: string[] = [];
      const allNodes = drawLayer?.getChildren() || [];
      
      allNodes.forEach((node: Konva.Node) => {
        if (node.name().includes('selection-rect') || !node.id()) return;
        const shapeRect = node.getClientRect();
        if (Konva.Util.haveIntersection(selectionBox, shapeRect)) {
          selectedShapes.push(node.id());
        }
      });
      setSelectedNodeIds(selectedShapes);
      selectionRect.current.destroy();
      selectionRect.current = null;
      drawLayer?.batchDraw();
    }
    isSelecting.current = false;
    e.cancelBubble = true;
  }, [stageRef, setSelectedNodeIds]);

  // --- DRAWING / ERASING ---
  const detectAndEraseLines = useCallback((currentPoint: { x: number; y: number }) => {
    const threshold = 15 / scale;

    setLines(prevLines => {
      const linesToKeep: Array<{ tool: "brush" | "eraser"; points: number[] }> = [];
      const erasedLineIndices: number[] = [];
      
      prevLines.forEach((line, index) => {
        if (line.tool === "brush" && !lastErasedLines.current.includes(index)) {
          const isInBBox = isPointInLineBBox(currentPoint, line.points, threshold + 5);
          if (isInBBox && isPointNearLine(currentPoint, line.points, threshold)) {
            erasedLineIndices.push(index);
            // FIX: Pass the 'data' (the line being deleted) so Undo can restore it
            addAction({ type: "delete-line", lineIndex: index, data: line });
          } else {
            linesToKeep.push(line);
          }
        } else {
          linesToKeep.push(line);
        }
      });
      
      if (erasedLineIndices.length > 0) {
        lastErasedLines.current = [...lastErasedLines.current, ...erasedLineIndices];
        setTimeout(() => {
          lastErasedLines.current = lastErasedLines.current.filter(idx => !erasedLineIndices.includes(idx));
        }, 100);
      }
      return linesToKeep;
    });
  }, [setLines, addAction, scale]);

  const handleDrawingMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "pen") return;
    e.cancelBubble = true;
    isDrawing.current = true;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;
    
    if (drawingMode === "eraser") {
      detectAndEraseLines(pos);
    } else {
      setLines(prev => [...prev, { tool: drawingMode, points: [pos.x, pos.y] }]);
    }
  }, [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]);

  const handleDrawingMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "pen" || !isDrawing.current) return;
    e.cancelBubble = true;
    const stage = stageRef.current;
    if (!stage) return;
    
    const now = Date.now();
    if (now - lastFrameTime.current < THROTTLE_MS) return;
    lastFrameTime.current = now;

    const point = getRelativePointerPosition(stage);
    if (!point) return;

    if (drawingMode === "eraser") {
      detectAndEraseLines(point);
    } else {
      setLines(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const updated = { ...last, points: [...last.points, point.x, point.y] };
        return [...prev.slice(0, -1), updated];
      });
    }
  }, [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]);

  const handleDrawingMouseUp = useCallback(() => {
    if (activeTool !== "pen") return;
    if (isDrawing.current && drawingMode === "brush") {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    isDrawing.current = false;
    if (drawingMode === "eraser") lastErasedLines.current = [];
  }, [activeTool, drawingMode, lines, addAction]);

  // --- ZOOM ---
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.min(oldScale * scaleBy, 5);
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  }, [stageRef]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.max(oldScale / scaleBy, 0.1);
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  }, [stageRef]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;
    
    const now = Date.now();
    if (now - lastFrameTime.current < 8) return; 
    lastFrameTime.current = now;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const direction = e.evt.deltaY > 0 ? 1 : -1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    stage.scale({ x: newScale, y: newScale });
    const newPos = { x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale };
    stage.position(newPos);
    stage.batchDraw();
  }, [stageRef]);

  // --- CONNECTION LOGIC ---
  const handleAnchorMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>, nodeId: string, side: Side, anchorPos: { x: number; y: number }) => {
    e.cancelBubble = true;
    e.evt.stopPropagation(); 
    setIsConnecting(true);
    setConnectionStart({ nodeId, side, x: anchorPos.x, y: anchorPos.y });
    const temp: Connection = {
      id: "temp-connection",
      type: "connection",
      from: { nodeId, side, x: anchorPos.x, y: anchorPos.y },
      to: { nodeId: null, side: undefined, x: anchorPos.x, y: anchorPos.y },
      stroke: "#64748B",
      strokeWidth: 4,
      draggable: false
    };
    setTempConnection(temp);
  }, [setIsConnecting, setConnectionStart, setTempConnection]);

  // --- CONNECTION MOUSE MOVE ---
  const handleConnectionMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isConnecting || !connectionStart || !tempConnection) return;
    
    const now = Date.now();
    if (now - lastFrameTime.current < THROTTLE_MS) return;
    lastFrameTime.current = now;

    const stage = stageRef.current;
    if (!stage) return;
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    let endX = pos.x;
    let endY = pos.y;
    let endNodeId: string | null = null;
    let endSide: Side | undefined = undefined;

    for (let i = 0; i < allShapes.length; i++) {
        const s = allShapes[i];
        if (s.id === connectionStart.nodeId) continue; 
        if (s.type === 'text' || s.type === 'stickyNote') continue;

        let x = (s as any).x;
        let y = (s as any).y;
        let w = (s as any).width || 100;
        let h = (s as any).height || 100;

        if (s.type === 'circle') { const r = (s as any).radius || 50; x -= r; y -= r; w = r * 2; h = r * 2; } 
        else if (s.type === 'ellipse') { const rx = (s as any).radiusX || 80; const ry = (s as any).radiusY || 50; x -= rx; y -= ry; w = rx * 2; h = ry * 2; }

        const BUFFER = 25; 
        if (pos.x >= x - BUFFER && pos.x <= x + w + BUFFER && pos.y >= y - BUFFER && pos.y <= y + h + BUFFER) {
            const rect: Rect = { x, y, width: w, height: h };
            let minDist = Infinity;
            for (const side of SNAP_THRESHOLD_SIDES) {
                const p = getAnchorPoint(rect, side);
                const distSq = (p.x - pos.x) ** 2 + (p.y - pos.y) ** 2;
                if (distSq < minDist) { minDist = distSq; endX = p.x; endY = p.y; endNodeId = s.id; endSide = side; }
            }
            break; 
        }
    }
    setTempConnection({ ...tempConnection, to: { nodeId: endNodeId, side: endSide, x: endX, y: endY } });
  }, [isConnecting, connectionStart, tempConnection, stageRef, allShapes, setTempConnection]);

  const handleConnectionMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isConnecting || !tempConnection || !connectionStart) return;
    if (tempConnection.to.nodeId) {
      const newConnection: Connection = {
        id: `conn-${Date.now()}`,
        type: "connection",
        from: { ...connectionStart },
        to: { ...tempConnection.to },
        stroke: "#64748B",
        strokeWidth: 4,
        draggable: false
      };
      setConnections(prev => [...prev, newConnection]);
      addAction({ type: "add-connection", data: newConnection });
    }
    setIsConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
  }, [isConnecting, tempConnection, connectionStart, setConnections, addAction, setIsConnecting, setConnectionStart, setTempConnection]);

  const handleAnchorClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, nodeId: string, side: Side) => {
    e.cancelBubble = true;
    e.evt.stopPropagation();
    const sourceShape = allShapes.find(s => s.id === nodeId);
    if (!sourceShape) return;
    const gap = 150;
    let newX = (sourceShape as any).x;
    let newY = (sourceShape as any).y;
    const width = (sourceShape as any).width || 100;
    const height = (sourceShape as any).height || 100;
    let offsetX = width;
    let offsetY = height;
    if (sourceShape.type === 'circle') { const r = (sourceShape as any).radius || 50; offsetX = r; offsetY = r; }

    switch (side) {
      case "right": newX += offsetX + gap; break;
      case "left": newX -= (offsetX + gap); break;
      case "bottom": newY += offsetY + gap; break;
      case "top": newY -= (offsetY + gap); break;
    }
    let type: Tool = 'rect';
    if (sourceShape.type === 'stickyNote') type = 'stickyNote';
    if (sourceShape.type === 'circle') type = 'circle';
    addShape(type, addAction, { x: newX, y: newY });
  }, [allShapes, addShape, addAction]);

  const handleShapeMouseEnter = useCallback((id: string) => {
    if (!isConnecting) setHoveredNodeId(id);
  }, [isConnecting]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    handlePanningMouseDown(e);
    if (activeTool === "select" && !isSpacePressed) handleSelectionStart(e);
    if (activeTool === "pen") handleDrawingMouseDown(e);
  }, [activeTool, handleDrawingMouseDown, handlePanningMouseDown, handleSelectionStart, isSpacePressed]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) { handlePanningMouseMove(); return; }
    if (isSelecting.current) handleSelectionMove(e);
    if (activeTool === "pen") handleDrawingMouseMove(e);
    handleConnectionMouseMove(e); 
  }, [activeTool, handleDrawingMouseMove, handlePanningMouseMove, handleSelectionMove, handleConnectionMouseMove]);

  const handleMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    handlePanningMouseUp();
    if (isSelecting.current) handleSelectionEnd(e);
    if (activeTool === "pen") handleDrawingMouseUp();
    handleConnectionMouseUp(e);
  }, [activeTool, handleDrawingMouseUp, handlePanningMouseUp, handleSelectionEnd, handleConnectionMouseUp]);

  return {
    handleToolChange: (tool: Tool | null) => setActiveTool(tool),
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleZoomIn,
    handleZoomOut,
    isDrawing,
    hoveredNodeId,
    setHoveredNodeId,
    handleAnchorMouseDown,
    handleAnchorClick,
    handleShapeMouseEnter,
    isSpacePressed,
    handleTouchStart: (e: any) => { if(activeTool === 'pen') handleDrawingMouseDown(e) },
    handleTouchEnd: (e: any) => { if(activeTool === 'pen') handleDrawingMouseUp() },
    handleTouchMove: (e: any) => { if(activeTool === 'pen') handleDrawingMouseMove(e) }
  };
};