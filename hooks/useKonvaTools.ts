import { useRef, useCallback, useEffect } from "react";
import Konva from "konva";
import { Tool, Action } from "../types/board-types";
import { Connection } from "./useBoardState";
function getRelativePointerPosition(stage: Konva.Stage) {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  if (!pos) return null;
  return transform.point(pos);
}
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
// Normalize Connection to ensure all required properties
const normalizeConnection = (connection: Connection): Connection => ({
  id: connection.id,
  type: "connection",
  from: {
    x: connection.from.x ?? 0,
    y: connection.from.y ?? 0,
    nodeId: connection.from.nodeId ?? null,
  },
  to: {
    x: connection.to.x ?? 0,
    y: connection.to.y ?? 0,
    nodeId: connection.to.nodeId ?? null,
  },
  cp1x: connection.cp1x ?? connection.from.x,
  cp1y: connection.cp1y ?? connection.from.y,
  cp2x: connection.cp2x ?? connection.to.x,
  cp2y: connection.cp2y ?? connection.to.y,
  stroke: connection.stroke ?? "#333",
  strokeWidth: connection.strokeWidth ?? 2,
  draggable: connection.draggable ?? false,
});
export const useKonvaTools = (
  stageRef: React.RefObject<Konva.Stage | null>,
  activeTool: Tool | null,
  scale: number,
  position: { x: number; y: number },
  drawingMode: "brush" | "eraser",
  lines: Array<{ tool: "brush" | "eraser"; points: number[] }>,
  connectionStart: { x: number; y: number } | null,
  tempConnection: Konva.Line | null,
  isConnecting: boolean,
  selectedNodeIds: string[],
  setActiveTool: (tool: Tool | null) => void,
  setDrawingMode: (mode: "brush" | "eraser") => void,
  setLines: React.Dispatch<React.SetStateAction<Array<{ tool: "brush" | "eraser"; points: number[] }>>>,
  setConnectionStart: (start: { x: number; y: number } | null) => void,
  setTempConnection: (connection: Konva.Line | null) => void,
  setIsConnecting: (connecting: boolean) => void,
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<string[]>>,
  addAction: (action: Action) => void,
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>,
  updateConnection: (id: string, updates: Partial<Connection>) => void
) => {
  const isDrawing = useRef(false);
  const lastErasedLines = useRef<number[]>([]);
  const tempGroupRef = useRef<Konva.Group | null>(null);
  const startAnchorRef = useRef<Konva.Circle | null>(null);
  const endAnchorRef = useRef<Konva.Circle | null>(null);
  const pathNodeRef = useRef<Konva.Path | null>(null);
  const isPlacingConnection = useRef(false);
  const isSpacePressed = useRef(false);
  const isPanning = useRef(false);
  const lastPointerPosition = useRef<{ x: number; y: number } | null>(null);
  const isSelecting = useRef(false);
  const selectionStart = useRef({ x: 0, y: 0 });
  const selectionRect = useRef<Konva.Rect | null>(null);
  // ========== PANNING FUNCTIONS (DECLARE FIRST) ==========
  const getCursorForTool = useCallback((tool: Tool | null, mode: "brush" | "eraser") => {
    switch (tool) {
      case "connect": return "crosshair";
      case "select": return "default";
      case "pen": return mode === "eraser" ? "cell" : "crosshair";
      default: return "default";
    }
  }, []);
  const handleKeyDown = useCallback((e: Konva.KonvaEventObject<KeyboardEvent>) => {
    if (e.evt.key === ' ') {
      isSpacePressed.current = true;
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = 'grab';
      }
      e.evt.preventDefault();
    }
  }, []);
  // FIXED: Selection rectangle now uses stage coordinates like the pen tool
  const handleSelectionStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "select" || isSpacePressed.current) return;
     
      const stage = stageRef.current;
      if (!stage) return;
      // FIXED: Use getRelativePointerPosition like the pen tool for accurate stage coordinates
      const pos = getRelativePointerPosition(stage);
      if (!pos) return;
      isSelecting.current = true;
      selectionStart.current = { x: pos.x, y: pos.y };
      // Create selection rectangle
      const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
      if (!drawLayer) return;
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
        listening: false, // Don't interfere with other mouse events
      });
      drawLayer.add(selectionRect.current);
      drawLayer.batchDraw();
      e.cancelBubble = true;
    },
    [activeTool]
  );
  // FIXED: Selection rectangle movement now uses stage coordinates
  const handleSelectionMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isSelecting.current || !selectionRect.current || !stageRef.current) return;
      const stage = stageRef.current;
      // FIXED: Use getRelativePointerPosition for accurate stage coordinates
      const pos = getRelativePointerPosition(stage);
      if (!pos) return;
      // Update selection rectangle using stage coordinates
      const x = Math.min(selectionStart.current.x, pos.x);
      const y = Math.min(selectionStart.current.y, pos.y);
      const width = Math.abs(pos.x - selectionStart.current.x);
      const height = Math.abs(pos.y - selectionStart.current.y);
      selectionRect.current.setAttrs({ x, y, width, height });
      selectionRect.current.getLayer()?.batchDraw();
      e.cancelBubble = true;
    },
    []
  );
  // FIXED: Selection now finds ALL selectable elements properly
const handleSelectionEnd = useCallback(
  (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isSelecting.current || !selectionRect.current || !stageRef.current) return;
    const stage = stageRef.current;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
   
    if (selectionRect.current) {
      // Get all shapes that intersect with the selection rectangle
      const selectionBox = selectionRect.current.getClientRect();
      const selectedShapes: string[] = [];
     
      // FIXED: Find ALL selectable elements by checking ALL nodes in the draw layer
      // and filtering for those that have an ID (which means they're our shapes)
      const allNodes = drawLayer?.getChildren() || [];
     
      allNodes.forEach((node: Konva.Node) => {
        // Skip the selection rectangle itself and non-selectable elements
        if (node.name() === 'selection-rect' || !node.id()) return;
       
        const shapeRect = node.getClientRect();
        if (Konva.Util.haveIntersection(selectionBox, shapeRect)) {
          selectedShapes.push(node.id());
        }
      });
      // Set multiple selected shapes
      if (selectedShapes.length > 0) {
        console.log('🔍 Multi-selected shapes:', selectedShapes);
        setSelectedNodeIds(selectedShapes);
      } else {
        setSelectedNodeIds([]); // Clear selection if nothing was selected
      }
      // Remove selection rectangle
      selectionRect.current.destroy();
      selectionRect.current = null;
      drawLayer?.batchDraw();
    }
    isSelecting.current = false;
    e.cancelBubble = true;
  },
  [setSelectedNodeIds]
);
  const handlePanningMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isSpacePressed.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      isPanning.current = true;
      const pointerPos = stage.getPointerPosition();
      if (pointerPos) {
        lastPointerPosition.current = pointerPos;
      }
      stage.container().style.cursor = 'grabbing';
     
      e.cancelBubble = true;
    },
    []
  );
  const handlePanningMouseUp = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isSpacePressed.current) return;
      isPanning.current = false;
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = 'grab';
      }
    },
    []
  );
  const handlePanningMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isSpacePressed.current || !isPanning.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      const point = stage.getPointerPosition();
      if (!point || !lastPointerPosition.current) return;
      const dx = point.x - lastPointerPosition.current.x;
      const dy = point.y - lastPointerPosition.current.y;
      const newPos = {
        x: stage.x() + dx,
        y: stage.y() + dy,
      };
      stage.position(newPos);
      stage.batchDraw();
      lastPointerPosition.current = point;
    },
    []
  );
  // ========== EXISTING TOOL FUNCTIONS ==========
  const detectAndEraseLines = useCallback(
    (currentPoint: { x: number; y: number }) => {
      setLines(prevLines => {
        const linesToKeep: Array<{ tool: "brush" | "eraser"; points: number[] }> = [];
        const erasedLineIndices: number[] = [];
        prevLines.forEach((line, index) => {
          if (line.tool === "brush" && !lastErasedLines.current.includes(index)) {
            if (isPointNearLine(currentPoint, line.points, 15 / scale)) {
              erasedLineIndices.push(index);
              addAction({ type: "delete-line", lineIndex: index });
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
    },
    [setLines, addAction, scale]
  );
  const computeSmartControlPoints = useCallback((from: { x: number; y: number }, to: { x: number; y: number }) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const shouldSnapStraight = Math.abs(dy) < 15;
    if (shouldSnapStraight) {
      return {
        cp1x: from.x,
        cp1y: from.y,
        cp2x: to.x,
        cp2y: to.y,
        shouldSnapStraight: true,
      };
    }
    const midX = from.x + dx / 2;
    return {
      cp1x: midX,
      cp1y: from.y,
      cp2x: midX,
      cp2y: to.y,
      shouldSnapStraight: false,
    };
  }, []);
  const buildPathData = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, cp1x: number, cp1y: number, cp2x: number, cp2y: number, snapStraight: boolean) => {
      if (snapStraight) {
        return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
      }
      return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
    },
    []
  );
    const isTextInputFocused = (): boolean => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;
       
        const tagName = activeElement.tagName.toLowerCase();
        const isInput = tagName === 'input' || tagName === 'textarea';
        const isContentEditable = activeElement.getAttribute('contenteditable') === 'true';
       
        return isInput || isContentEditable;
      };
  // ========== CONNECTION FUNCTIONS ==========
  const createInstantConnection = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const stageCenter = {
      x: stage.width() / 2 / scale - position.x / scale,
      y: stage.height() / 2 / scale - position.y / scale,
    };
    const from = { x: stageCenter.x - 100, y: stageCenter.y };
    const to = { x: stageCenter.x + 100, y: stageCenter.y };
    setConnectionStart(from);
    setIsConnecting(true);
    isPlacingConnection.current = true;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;
    const group = new Konva.Group({
      x: 0,
      y: 0,
      draggable: false,
      name: "selectable-shape connection-group",
      id: `connection-${Date.now()}`,
    });
    const { cp1x, cp1y, cp2x, cp2y, shouldSnapStraight } = computeSmartControlPoints(from, to);
    const pathData = buildPathData(from, to, cp1x, cp1y, cp2x, cp2y, shouldSnapStraight);
    const path = new Konva.Path({
      data: pathData,
      stroke: "#333",
      strokeWidth: 2,
      lineCap: "round",
      lineJoin: "round",
      listening: true,
      name: "connection-path",
    });
    pathNodeRef.current = path;
    const anchorRadius = 6;
    const startAnchor = new Konva.Circle({
      x: from.x,
      y: from.y,
      radius: anchorRadius,
      fill: "#007AFF",
      stroke: "#ffffff",
      strokeWidth: 2,
      draggable: true,
      name: "connection-anchor tail-anchor",
    });
    const endAnchor = new Konva.Circle({
      x: to.x,
      y: to.y,
      radius: anchorRadius,
      fill: "#FF3B30",
      stroke: "#ffffff",
      strokeWidth: 2,
      draggable: true,
      name: "connection-anchor head-anchor",
    });
    const updatePathFromAnchors = () => {
      const fx = startAnchor.x();
      const fy = startAnchor.y();
      const tx = endAnchor.x();
      const ty = endAnchor.y();
      const { cp1x, cp1y, cp2x, cp2y, shouldSnapStraight } = computeSmartControlPoints({ x: fx, y: fy }, { x: tx, y: ty });
      const d = buildPathData({ x: fx, y: fy }, { x: tx, y: ty }, cp1x, cp1y, cp2x, cp2y, shouldSnapStraight);
      path.data(d);
      path.getLayer()?.batchDraw();
      const connectionId = group.id();
      const updatedConnection: Partial<Connection> = {
        from: { x: fx, y: fy, nodeId: null },
        to: { x: tx, y: ty, nodeId: null },
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        stroke: "#333",
        strokeWidth: 2,
      };
      console.log("🔄 Updating connection state:", updatedConnection);
      updateConnection(connectionId, updatedConnection);
    };
    startAnchor.on("dragmove", updatePathFromAnchors);
    endAnchor.on("dragmove", updatePathFromAnchors);
    path.on("click tap", (evt) => {
      evt.cancelBubble = true;
      setSelectedNodeIds([group.id()]); // FIXED: Use setSelectedNodeIds with array
    });
    group.on("dblclick dbltap", (evt) => {
      evt.cancelBubble = true;
      group.destroy();
      drawLayer.batchDraw();
      cleanupConnection();
    });
    group.add(path);
    group.add(startAnchor);
    group.add(endAnchor);
    drawLayer.add(group);
    drawLayer.batchDraw();
    tempGroupRef.current = group;
    startAnchorRef.current = startAnchor;
    endAnchorRef.current = endAnchor;
    const connectionData: Connection = normalizeConnection({
      id: group.id(),
      type: "connection",
      from: { x: startAnchor.x(), y: startAnchor.y(), nodeId: null },
      to: { x: endAnchor.x(), y: endAnchor.y(), nodeId: null },
      cp1x,
      cp1y,
      cp2x,
      cp2y,
      stroke: "#333",
      strokeWidth: 2,
      draggable: false,
    });
    console.log("✅ Connection added to state:", connectionData);
    setConnections(prev => [...prev, connectionData]);
    addAction({ type: "add-connection", data: connectionData });
    setTempConnection(group as unknown as Konva.Line);
    setSelectedNodeIds([group.id()]); // FIXED: Use setSelectedNodeIds with array
    console.log('✅ Connection created and set to editing mode');
  }, [stageRef, scale, position, setConnectionStart, setIsConnecting, setTempConnection, setSelectedNodeIds, computeSmartControlPoints, buildPathData, setConnections, addAction, updateConnection]);
  const cleanupConnection = useCallback(() => {
    tempGroupRef.current = null;
    startAnchorRef.current = null;
    endAnchorRef.current = null;
    pathNodeRef.current = null;
    setTempConnection(null);
    setConnectionStart(null);
    setIsConnecting(false);
    isPlacingConnection.current = false;
  }, [setTempConnection, setConnectionStart, setIsConnecting]);
  const finalizeConnectionPlacement = useCallback(() => {
    if (!isPlacingConnection.current || !tempGroupRef.current) return;
    console.log("🎯 Finalizing connection placement");
    const stage = stageRef.current;
    if (!stage) return;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;
    const group = tempGroupRef.current;
    const startAnchor = startAnchorRef.current!;
    const endAnchor = endAnchorRef.current!;
    const path = pathNodeRef.current!;
    startAnchor.on("mouseover", () => {
      const c = stage.container();
      c.style.cursor = "pointer";
    });
    startAnchor.on("mouseout", () => {
      const c = stage.container();
      c.style.cursor = activeTool === "connect" ? "crosshair" : "default";
    });
    endAnchor.on("mouseover", () => {
      const c = stage.container();
      c.style.cursor = "pointer";
    });
    endAnchor.on("mouseout", () => {
      const c = stage.container();
      c.style.cursor = activeTool === "connect" ? "crosshair" : "default";
    });
    group.name("selectable-shape connection-group");
    path.name("connection-path");
    addAction({ type: "add", node: group });
    drawLayer.batchDraw();
    isPlacingConnection.current = false;
    setIsConnecting(false);
    console.log("✅ Connection finalized and ready for adjustments");
  }, [stageRef, activeTool, addAction, setIsConnecting]);
  const handleConnectionMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "connect" || !isPlacingConnection.current || !tempGroupRef.current) return;
      const stage = stageRef.current;
      if (!stage) return;
      const point = getRelativePointerPosition(stage);
      if (!point) return;
      const endAnchor = endAnchorRef.current;
      const path = pathNodeRef.current;
      const startAnchor = startAnchorRef.current;
      if (!startAnchor || !endAnchor || !path) return;
      endAnchor.position({ x: point.x, y: point.y });
      const fx = startAnchor.x();
      const fy = startAnchor.y();
      const tx = endAnchor.x();
      const ty = endAnchor.y();
      const { cp1x, cp1y, cp2x, cp2y, shouldSnapStraight } = computeSmartControlPoints({ x: fx, y: fy }, { x: tx, y: ty });
      const d = buildPathData({ x: fx, y: fy }, { x: tx, y: ty }, cp1x, cp1y, cp2x, cp2y, shouldSnapStraight);
      path.data(d);
      path.getLayer()?.batchDraw();
      const connectionId = tempGroupRef.current!.id();    
      const updatedConnection: Partial<Connection> = {
        from: { x: fx, y: fy, nodeId: null },
        to: { x: tx, y: ty, nodeId: null },
        cp1x,
        cp1y,
        cp2x,
        cp2y,
        stroke: "#333",
        strokeWidth: 2,
      };
      console.log("🔄 Updating connection during move:", updatedConnection);
      updateConnection(connectionId, updatedConnection);
    },
    [activeTool, stageRef, computeSmartControlPoints, buildPathData, updateConnection]
  );
  const handleConnectionEnd = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool === "connect" && isPlacingConnection.current) {
        finalizeConnectionPlacement();
      }
    },
    [activeTool, finalizeConnectionPlacement]
  );
  const handleConnectionHover = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "connect" || isConnecting) return;
      const stage = stageRef.current;
      if (!stage) return;
      const container = stage.container();
      container.style.cursor = "crosshair";
    },
    [activeTool, isConnecting, stageRef]
  );
  const handleConnectionStart = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "connect" || tempGroupRef.current) return;
      e.evt.preventDefault();
      createInstantConnection();
    },
    [activeTool, createInstantConnection]
  );
  // ========== DRAWING FUNCTIONS ==========
  const handleDrawingMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
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
        setLines(prevLines => [...prevLines, { tool: drawingMode, points: [pos.x, pos.y] }]);
      }
    },
    [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]
  );
  const handleDrawingMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (activeTool !== "pen" || !isDrawing.current) return;
      e.cancelBubble = true;
      const stage = stageRef.current;
      if (!stage) return;
      const point = getRelativePointerPosition(stage);
      if (!point) return;
      if (drawingMode === "eraser") {
        detectAndEraseLines(point);
      } else {
        setLines(prevLines => {
          if (prevLines.length === 0) return prevLines;
          const lastLineIndex = prevLines.length - 1;
          const lastLine = prevLines[lastLineIndex];
          const updatedLine = {
            ...lastLine,
            points: [...lastLine.points, point.x, point.y],
          };
          const newLines = [...prevLines];
          newLines[lastLineIndex] = updatedLine;
          return newLines;
        });
      }
    },
    [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]
  );
  const handleDrawingMouseUp = useCallback(() => {
    if (activeTool !== "pen") return;
    if (isDrawing.current && drawingMode === "brush") {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    isDrawing.current = false;
    if (drawingMode === "eraser") {
      lastErasedLines.current = [];
    }
  }, [activeTool, drawingMode, lines, addAction]);
  const handleDrawingTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (activeTool !== "pen") return;
      e.evt.preventDefault();
      isDrawing.current = true;
      const stage = stageRef.current;
      if (!stage) return;
      const pos = getRelativePointerPosition(stage);
      if (!pos) return;
      if (drawingMode === "eraser") {
        detectAndEraseLines(pos);
      } else {
        setLines(prevLines => [...prevLines, { tool: drawingMode, points: [pos.x, pos.y] }]);
      }
    },
    [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]
  );
  const handleDrawingTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (activeTool !== "pen" || !isDrawing.current) return;
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const point = getRelativePointerPosition(stage);
      if (!point) return;
      if (drawingMode === "eraser") {
        detectAndEraseLines(point);
      } else {
        setLines(prevLines => {
          if (prevLines.length === 0) return prevLines;
          const lastLineIndex = prevLines.length - 1;
          const lastLine = prevLines[lastLineIndex];
          const updatedLine = {
            ...lastLine,
            points: [...lastLine.points, point.x, point.y],
          };
          const newLines = [...prevLines];
          newLines[lastLineIndex] = updatedLine;
          return newLines;
        });
      }
    },
    [activeTool, drawingMode, stageRef, setLines, detectAndEraseLines]
  );
  const handleDrawingTouchEnd = useCallback(() => {
    if (activeTool !== "pen") return;
    if (isDrawing.current && drawingMode === "brush") {
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    isDrawing.current = false;
    if (drawingMode === "eraser") {
      lastErasedLines.current = [];
    }
  }, [activeTool, drawingMode, lines, addAction]);
  // ========== MAIN EVENT HANDLERS ==========
  const handleMouseDown = useCallback(
  (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle panning first
    handlePanningMouseDown(e);
   
    // Then handle selection (only if not panning and select tool is active)
    if (activeTool === "select" && !isSpacePressed.current) {
      handleSelectionStart(e);
    }
   
    // Then handle other tools
    if (activeTool === "pen") {
      handleDrawingMouseDown(e);
    } else if (activeTool === "connect") {
      handleConnectionStart(e);
    }
  },
  [activeTool, handleDrawingMouseDown, handleConnectionStart, handlePanningMouseDown, handleSelectionStart]
);
  const handleMouseMove = useCallback(
  (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle panning first
    handlePanningMouseMove(e);
   
    // Then handle selection
    if (isSelecting.current) {
      handleSelectionMove(e);
    }
   
    // Then handle other tools
    if (activeTool === "pen") {
      handleDrawingMouseMove(e);
    } else if (activeTool === "connect") {
      handleConnectionMove(e);
      handleConnectionHover(e);
    }
  },
  [activeTool, handleDrawingMouseMove, handleConnectionMove, handleConnectionHover, handlePanningMouseMove, handleSelectionMove]
);
  const handleMouseUp = useCallback(
  (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle panning first
    handlePanningMouseUp(e);
   
    // Then handle selection
    if (isSelecting.current) {
      handleSelectionEnd(e);
    }
   
    // Then handle other tools
    if (activeTool === "pen") {
      handleDrawingMouseUp();
    } else if (activeTool === "connect") {
      handleConnectionEnd(e);
    }
  },
  [activeTool, handleDrawingMouseUp, handleConnectionEnd, handlePanningMouseUp, handleSelectionEnd]
);
  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (activeTool === "pen") {
        handleDrawingTouchStart(e);
      }
    },
    [activeTool, handleDrawingTouchStart]
  );
  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (activeTool === "pen") {
        handleDrawingTouchEnd();
      }
    },
    [activeTool, handleDrawingTouchEnd]
  );
  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (activeTool === "pen") {
        handleDrawingTouchMove(e);
      }
    },
    [activeTool, handleDrawingTouchMove]
  );
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
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
    },
    [stageRef]
  );
const handleToolChange = useCallback(
    (tool: Tool | null) => {
      if (activeTool === "pen" && tool !== "pen") {
        isDrawing.current = false;
        lastErasedLines.current = [];
      }
      setActiveTool(tool);
      if (!stageRef.current) return;
      updateDraggables(); // NEW: Call updateDraggables
      const container = stageRef.current.container();
      container.style.cursor = getCursorForTool(tool, drawingMode);
    },
    [activeTool, drawingMode, setActiveTool, stageRef, getCursorForTool, selectedNodeIds] // Add selectedNodeIds to deps
  );
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
  // ========== EFFECTS ==========
  useEffect(() => {
    if (activeTool === "connect" && !isConnecting && !tempGroupRef.current) {
      console.log("🔗 Connection tool activated - creating instant connection");
      createInstantConnection();
    }
  }, [activeTool, isConnecting]);
  useEffect(() => {
    if (activeTool !== "connect" && tempGroupRef.current) {
      console.log("🔗 Connection tool deactivated - cleaning up");
      cleanupConnection();
    }
  }, [activeTool, cleanupConnection]);
    // In useKonvaTools.ts - Add this useEffect right after the other useEffects at the bottom of the hook
// ========== GLOBAL KEYBOARD EVENTS ==========
  useEffect(() => {
  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    // Skip spacebar handling if we're in a text input
    if (e.key === ' ' && isTextInputFocused()) {
      return; // Let the text input handle the spacebar
    }
   
    if (e.key === ' ') {
      isSpacePressed.current = true;
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = 'grab';
       
        updateDraggables(); // NEW: Replace shapes loop with updateDraggables
      }
      e.preventDefault(); // Prevent scrolling
    }
  };
  const handleGlobalKeyUp = (e: KeyboardEvent) => {
    // Skip spacebar handling if we're in a text input
    if (e.key === ' ' && isTextInputFocused()) {
      return; // Let the text input handle the spacebar
    }
   
    if (e.key === ' ') {
      isSpacePressed.current = false;
      isPanning.current = false;
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = getCursorForTool(activeTool, drawingMode);
       
        updateDraggables(); // NEW: Replace shapes loop with updateDraggables
      }
      e.preventDefault(); // Prevent scrolling
    }
  };
  // Add global event listeners
  document.addEventListener('keydown', handleGlobalKeyDown);
  document.addEventListener('keyup', handleGlobalKeyUp);
  return () => {
    document.removeEventListener('keydown', handleGlobalKeyDown);
    document.removeEventListener('keyup', handleGlobalKeyUp);
  };
}, [activeTool, drawingMode, getCursorForTool, stageRef, selectedNodeIds]);

  // NEW: Function to update draggable on all selectable shapes
  const updateDraggables = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;
    const shapes = drawLayer.find(".selectable-shape");
    const enableDrag = activeTool === "select" && !isSpacePressed.current;
    shapes.forEach((shape: Konva.Node) => {
      shape.draggable(enableDrag && selectedNodeIds.includes(shape.id()));
    });
    drawLayer.batchDraw();
  }, [activeTool, selectedNodeIds, stageRef]);

  // NEW: Effect to update draggables on changes
  useEffect(() => {
    updateDraggables();
  }, [updateDraggables]);

  return {
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
    isDrawing,
  };
};
