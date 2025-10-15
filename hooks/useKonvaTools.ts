import { useRef, useCallback, useEffect } from "react";
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

  // NEW: Smart connection tool refs
  const tempGroupRef = useRef<Konva.Group | null>(null);
  const startAnchorRef = useRef<Konva.Circle | null>(null);
  const endAnchorRef = useRef<Konva.Circle | null>(null);
  const pathNodeRef = useRef<Konva.Path | null>(null);
  const isPlacingConnection = useRef(false); // NEW: Track if we're in placement mode

  // NEW: Detect and erase lines that intersect with current eraser position
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

  // ---------- IMPROVED SMART CONNECTION TOOL LOGIC ----------
  
  // Enhanced computeControlPoints function with smart snapping
  const computeSmartControlPoints = useCallback((from: {x: number, y: number}, to: {x: number, y: number}) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Snap to straight line when nearly horizontal (|dy| < 15px)
    const shouldSnapStraight = Math.abs(dy) < 15;
    
    if (shouldSnapStraight) {
      return {
        cp1x: from.x,
        cp1y: from.y,
        cp2x: to.x, 
        cp2y: to.y,
        shouldSnapStraight: true
      };
    }
    
    // Smart bezier with midpoint control points (Figma-like)
    const midX = from.x + dx / 2;
    return {
      cp1x: midX,
      cp1y: from.y,
      cp2x: midX,
      cp2y: to.y,
      shouldSnapStraight: false
    };
  }, []);

  // Helper to build SVG path string for Konva.Path
  const buildPathData = useCallback((from: {x: number, y: number}, to: {x: number, y: number}, cp1x: number, cp1y: number, cp2x: number, cp2y: number, snapStraight: boolean) => {
    if (snapStraight) {
      return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    }
    return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
  }, []);

  // NEW: Instant connection creation when tool is activated
  useEffect(() => {
    if (activeTool === "connect" && !isConnecting && !tempGroupRef.current) {
      console.log('🔗 Connection tool activated - creating instant connection');
      createInstantConnection();
    }
  }, [activeTool, isConnecting]);

  // NEW: Create connection immediately when tool is selected
  const createInstantConnection = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Calculate center position considering current zoom and pan
    const stageCenter = {
      x: stage.width() / 2 / scale - position.x / scale,
      y: stage.height() / 2 / scale - position.y / scale,
    };

    // Create endpoints with 200px horizontal offset (centered)
    const from = { x: stageCenter.x - 100, y: stageCenter.y };
    const to = { x: stageCenter.x + 100, y: stageCenter.y };

    setConnectionStart(from);
    setIsConnecting(true);
    isPlacingConnection.current = true; // NEW: Enter placement mode

    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    // Create connection group
    const group = new Konva.Group({
      x: 0,
      y: 0,
      draggable: false,
      name: 'selectable-shape connection-group',
    });

    const { cp1x, cp1y, cp2x, cp2y, shouldSnapStraight } = computeSmartControlPoints(from, to);
    const pathData = buildPathData(from, to, cp1x, cp1y, cp2x, cp2y, shouldSnapStraight);

    // Connection Path (Bezier) - IMPROVED STYLING
    const path = new Konva.Path({
      data: pathData,
      stroke: '#333', // Dark gray like Figma
      strokeWidth: 2, // Thinner, cleaner look
      lineCap: 'round',
      lineJoin: 'round',
      listening: true, // Allow clicking on the line itself
      name: 'connection-path',
    });
    pathNodeRef.current = path;

    // Anchor circles (draggable endpoints) - IMPROVED STYLING
    const anchorRadius = 6;
    
    // Tail point (start) - BLUE
    const startAnchor = new Konva.Circle({
      x: from.x,
      y: from.y,
      radius: anchorRadius,
      fill: '#007AFF', // Blue
      stroke: '#ffffff',
      strokeWidth: 2,
      draggable: true,
      name: 'connection-anchor tail-anchor',
    });
    
    // Head point (end) - RED  
    const endAnchor = new Konva.Circle({
      x: to.x,
      y: to.y,
      radius: anchorRadius,
      fill: '#FF3B30', // Red
      stroke: '#ffffff',
      strokeWidth: 2,
      draggable: true,
      name: 'connection-anchor head-anchor',
    });

    // Attach dragmove handlers for anchors to update the path dynamically
    const updatePathFromAnchors = () => {
      const fx = startAnchor.x();
      const fy = startAnchor.y();
      const tx = endAnchor.x();
      const ty = endAnchor.y();

      const { cp1x, cp1y, cp2x, cp2y, shouldSnapStraight } = computeSmartControlPoints({x:fx,y:fy}, {x:tx,y:ty});
      const d = buildPathData({x:fx,y:fy}, {x:tx,y:ty}, cp1x, cp1y, cp2x, cp2y, shouldSnapStraight);
      path.data(d);
      path.getLayer()?.batchDraw();
    };

    startAnchor.on('dragmove', () => {
      updatePathFromAnchors();
    });

    endAnchor.on('dragmove', () => {
      updatePathFromAnchors();
    });

    // Click handler for the path itself (select connection)
    path.on('click tap', (evt) => {
      evt.cancelBubble = true;
      setSelectedNodeId(group.id());
    });

    // If connection is double clicked, remove it
    group.on('dblclick dbltap', (evt) => {
      evt.cancelBubble = true;
      // Remove group
      group.destroy();
      drawLayer.batchDraw();
      // Clear refs and state
      cleanupConnection();
    });

    group.add(path);
    group.add(startAnchor);
    group.add(endAnchor);

    // Add to layer and store refs
    drawLayer.add(group);
    drawLayer.batchDraw();

    tempGroupRef.current = group;
    startAnchorRef.current = startAnchor;
    endAnchorRef.current = endAnchor;
    
    // Store the group into tempConnection
    setTempConnection(group as unknown as Konva.Line);
    setSelectedNodeId(group.id());
  }, [stageRef, scale, position, setConnectionStart, setIsConnecting, setTempConnection, setSelectedNodeId, computeSmartControlPoints, buildPathData]);

  // NEW: Cleanup connection references
  const cleanupConnection = useCallback(() => {
    tempGroupRef.current = null;
    startAnchorRef.current = null;
    endAnchorRef.current = null;
    pathNodeRef.current = null;
    setTempConnection(null);
    setConnectionStart(null);
    setIsConnecting(false);
    isPlacingConnection.current = false; // NEW: Reset placement mode
  }, [setTempConnection, setConnectionStart, setIsConnecting]);

  // NEW: Finalize connection placement
  const finalizeConnectionPlacement = useCallback(() => {
    if (!isPlacingConnection.current || !tempGroupRef.current) return;
    
    console.log('🎯 Finalizing connection placement');
    
    const stage = stageRef.current;
    if (!stage) return;

    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    const group = tempGroupRef.current;
    const startAnchor = startAnchorRef.current!;
    const endAnchor = endAnchorRef.current!;
    const path = pathNodeRef.current!;

    // give anchors proper hit area and cursor
    startAnchor.on('mouseover', () => {
      const c = stage.container();
      c.style.cursor = 'pointer';
    });
    startAnchor.on('mouseout', () => {
      const c = stage.container();
      c.style.cursor = activeTool === "connect" ? 'crosshair' : 'default';
    });
    endAnchor.on('mouseover', () => {
      const c = stage.container();
      c.style.cursor = 'pointer';
    });
    endAnchor.on('mouseout', () => {
      const c = stage.container();
      c.style.cursor = activeTool === "connect" ? 'crosshair' : 'default';
    });

    // Name anchors & path for selection/transform compatibility
    group.name('selectable-shape connection-group');
    path.name('connection-path');

    // Record the addition in undo stack
    addAction({ type: "add", node: group });
    drawLayer.batchDraw();

    // Exit placement mode but keep connection active
    isPlacingConnection.current = false;
    setIsConnecting(false);
    
    console.log('✅ Connection finalized and ready for adjustments');
  }, [stageRef, activeTool, addAction, setIsConnecting]);

  // NEW: Cleanup when switching away from connection tool
  useEffect(() => {
    if (activeTool !== "connect" && tempGroupRef.current) {
      console.log('🔗 Connection tool deactivated - cleaning up');
      cleanupConnection();
    }
  }, [activeTool, cleanupConnection]);

  // UPDATED: Connection move handler - only follow cursor during placement
  const handleConnectionMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only move end anchor if we're in placement mode
    if (activeTool !== "connect" || !isPlacingConnection.current || !tempGroupRef.current) return;

    const stage = stageRef.current;
    if (!stage) return;

    const point = getRelativePointerPosition(stage);
    if (!point) return;

    const endAnchor = endAnchorRef.current;
    const path = pathNodeRef.current;
    const startAnchor = startAnchorRef.current;
    if (!startAnchor || !endAnchor || !path) return;

    // Move end anchor to pointer position during placement
    endAnchor.position({ x: point.x, y: point.y });

    // Recompute path with new end position
    const fx = startAnchor.x();
    const fy = startAnchor.y();
    const tx = endAnchor.x();
    const ty = endAnchor.y();

    const { cp1x, cp1y, cp2x, cp2y, shouldSnapStraight } = computeSmartControlPoints({x:fx,y:fy}, {x:tx,y:ty});
    const d = buildPathData({x:fx,y:fy}, {x:tx,y:ty}, cp1x, cp1y, cp2x, cp2y, shouldSnapStraight);
    path.data(d);
    path.getLayer()?.batchDraw();
  }, [activeTool, stageRef, computeSmartControlPoints, buildPathData]);

  // UPDATED: Connection end handler - now handles placement finalization
  const handleConnectionEnd = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // If we're in placement mode, finalize on click
    if (activeTool === "connect" && isPlacingConnection.current) {
      finalizeConnectionPlacement();
    }
  }, [activeTool, finalizeConnectionPlacement]);

  const handleConnectionHover = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect" || isConnecting) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    container.style.cursor = 'crosshair';
  }, [activeTool, isConnecting, stageRef]);

  // UPDATED: Connection start handler (now only for manual creation if needed)
  const handleConnectionStart = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only allow manual connection start if no connection exists
    if (activeTool !== "connect" || tempGroupRef.current) return;

    e.evt.preventDefault();
    createInstantConnection();
  }, [activeTool, createInstantConnection]);

  // ---------- PEN TOOL LOGIC (UNCHANGED) ----------
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

  // ---------- CENTRALIZED MOUSE HANDLERS ----------
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

  // UPDATED: Mouse up handler - now handles connection finalization
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

  // ---------- WHEEL HANDLER ----------
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

  // ---------- TOOL CHANGE HANDLER ----------
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
    handleZoomIn,
    handleZoomOut,
    // Refs
    isDrawing,
  };
};