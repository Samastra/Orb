// hooks/useBoardState.ts
import { useState, useEffect, useCallback } from "react";
import Konva from "konva";
import { useParams } from "next/navigation";
import { Tool, Action, ReactShape, ImageShape } from "../types/board-types";
import { defaultStageDimensions, defaultBoardInfo } from "../constants/tool-constants";
import { KonvaShape } from "./useShapes";

// Simple reorder function from study code
const reorderArray = <T,>(arr: T[], from: number, to: number): T[] => {
  if (to < 0 || to > arr.length - 1) return arr;
  const newArr = [...arr];
  const item = newArr.splice(from, 1);
  newArr.splice(to, 0, item[0]);
  return newArr;
};

export type Side = "top" | "right" | "bottom" | "left";

// 2. Update the Connection type definition
export type Connection = {
  id: string;
  type: 'connection';
  from: { nodeId: string; side: Side; x: number; y: number };
  to: { nodeId?: string | null; side?: Side; x: number; y: number };
  stroke?: string;
  strokeWidth?: number;
  draggable: boolean;
};


export const useBoardState = () => {
  const params = useParams();

  // State
  const [stageDimensions, setStageDimensions] = useState(defaultStageDimensions);
  const [tempDimensions, setTempDimensions] = useState(defaultStageDimensions);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; side: Side; x: number; y: number } | null>(null);
  const [tempConnection, setTempConnection] = useState<Connection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scale, setScale] = useState(0.4);
  const [position, setPosition] = useState({ x: 400, y: 300 });
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [undoneActions, setUndoneActions] = useState<Action[]>([]);
  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);
  const [reactShapes, setReactShapes] = useState<ReactShape[]>([]);
  const [konvaShapes, setKonvaShapes] = useState<KonvaShape[]>([]);
  // CHANGED: Single selection to multi-selection
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [drawingMode, setDrawingMode] = useState<"brush" | "eraser">("brush");
  const [lines, setLines] = useState<Array<{ tool: "brush" | "eraser"; points: number[] }>>([]);
  const [showResources, setShowResources] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isTemporaryBoard, setIsTemporaryBoard] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<string>("");
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [boardInfo, setBoardInfo] = useState(defaultBoardInfo);
  const [stageFrames, setStageFrames] = useState<KonvaShape[]>([]);
  const [images, setImages] = useState<ImageShape[]>([]);

  // UPDATED: Connections state with proper typing
  const [connections, setConnections] = useState<Connection[]>([]);

  // NEW: Temporary drawing shape (for Drag-to-Create)
  const [tempDrawingShape, setTempDrawingShape] = useState<KonvaShape | null>(null);


  // NEW: Add connection function
  const addConnection = useCallback((connectionData: any, addAction: (action: Action) => void) => {
    const connectionId = `conn-${Date.now()}`;

    const newConnection: Connection = {
      id: connectionId,
      type: 'connection',
      ...connectionData,
      draggable: false,
    };


    setConnections(prev => [...prev, newConnection]);

    addAction({
      type: "add-connection",
      data: newConnection
    } as Action);

    return connectionId;
  }, []);

  // NEW: Update connection function
  const updateConnection = useCallback((id: string, updates: Partial<Connection>) => {
    setConnections(prev => prev.map(conn =>
      conn.id === id ? { ...conn, ...updates } : conn
    ));
  }, []);

  // NEW: Remove connection function
  const removeConnection = useCallback((id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
    // CHANGED: Remove from selected nodes if it was selected
    setSelectedNodeIds(prev => prev.filter(nodeId => nodeId !== id));
  }, []);

  // Add image function
  const addImage = useCallback((src: string, addAction: (action: Action) => void, position = { x: 100, y: 100 }) => {
    const imageId = `image-${Date.now()}`;

    // Use HTMLImageElement type instead of any
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const maxWidth = 600;
      const maxHeight = 400;

      let width = img.naturalWidth;
      let height = img.naturalHeight;
      const aspectRatio = width / height;

      // Scale down if image is too large
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      const newImage: ImageShape = {
        id: imageId,
        type: 'image',
        x: position.x,
        y: position.y,
        width: width,
        height: height,
        src: src,
        rotation: 0,
        draggable: true,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        aspectRatio: aspectRatio
      };

      setImages(prev => [...prev, newImage]);

      addAction({
        type: "add-image",
        data: newImage
      });
    };

    img.onerror = () => {

      const fallbackImage: ImageShape = {
        id: imageId,
        type: 'image',
        x: position.x,
        y: position.y,
        width: 200,
        height: 150,
        src: src,
        rotation: 0,
        draggable: true,
      };

      setImages(prev => [...prev, fallbackImage]);

      addAction({
        type: "add-image",
        data: fallbackImage
      });
    };

    return imageId;
  }, []);

  // Modified addKonvaShape to accept overrides
  const addKonvaShape = useCallback((type: Tool, center: { x: number; y: number }, draggable: boolean, overrides: Partial<KonvaShape> = {}) => {
    const shapeId = `shape-${Date.now()}`;

    const baseShape = {
      id: shapeId,
      type,
      x: center.x,
      y: center.y,
      fill: "#aae3ff",
      stroke: "#000000",
      strokeWidth: 0,
      draggable: draggable,
      rotation: 0,
      cornerRadius: 0,
      ...overrides // Apply overrides to base
    };

    let newShape: KonvaShape;

    switch (type) {
      case "rect":
      case "rounded_rect":
        newShape = {
          ...baseShape,
          x: center.x - (overrides.width ? overrides.width / 2 : 50),
          y: center.y - (overrides.height ? overrides.height / 2 : 50),
          width: 100,
          height: 100,
          cornerRadius: type === 'rounded_rect' ? 20 : 0,
          ...overrides
        };
        break;
      case "triangle":
      case "rhombus":
        newShape = {
          ...baseShape,
          width: 100,
          height: 100,
          x: center.x - (overrides.width ? overrides.width / 2 : 50),
          y: center.y - (overrides.height ? overrides.height / 2 : 50),
          ...overrides
        };
        break;
      case "circle":
        newShape = {
          ...baseShape,
          radius: 50,
          stroke: "#000000",
          strokeWidth: 0,
          ...overrides
        };
        break;
      case "ellipse":
        newShape = {
          ...baseShape,
          radiusX: 80,
          radiusY: 50,
          fill: "pink",
          ...overrides
        };
        break;
      case "arrow":
      case "line":
        newShape = {
          ...baseShape,
          points: [0, 0, 100, 0],
          fill: "black",
          stroke: "black",
          strokeWidth: 2,
          ...overrides
        };
        break;
      case "rhombus":
        newShape = {
          ...baseShape,
          width: 100,
          height: 100,
          fill: "#aae3ff",
          ...overrides
        };
        break;
      default:
        // Generic fallback for other shapes if added
        newShape = {
          ...baseShape,
          width: 100, // Default width
          height: 100, // Default height
          ...overrides
        } as KonvaShape;
        break;
    }

    setKonvaShapes(prev => [...prev, newShape]);
    return { shapeId, shapeData: newShape };
  }, []);

  // Update Konva shape
  const updateKonvaShape = useCallback((id: string, attrs: Partial<KonvaShape>) => {
    setKonvaShapes(prev => prev.map(shape =>
      shape.id === id ? { ...shape, ...attrs } : shape
    ));
  }, []);

  // removeKonvaShape ... (no change needed here really but included in range)
  const removeKonvaShape = useCallback((id: string) => {
    setKonvaShapes(prev => prev.filter(shape => shape.id !== id));
  }, []);

  // HELPER: Reorder Array
  const reorderArray = (list: any[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // Apply reordered shapes
  const applyReorderedShapes = useCallback((updatedShapes: Array<KonvaShape | ReactShape | ImageShape | Connection>) => {
    const newKonvaShapes: KonvaShape[] = [];
    const newReactShapes: ReactShape[] = [];
    const newImages: ImageShape[] = [];
    const newConnections: Connection[] = [];

    updatedShapes.forEach(shape => {
      if ('type' in shape) {
        if (shape.type === 'image') {
          newImages.push(shape as ImageShape);
        } else if (shape.type === 'connection') {
          newConnections.push(shape as Connection);
        } else if (['rect', 'circle', 'ellipse', 'triangle', 'arrow', 'line', 'rhombus'].includes(shape.type)) {
          newKonvaShapes.push(shape as KonvaShape);
        } else {
          newReactShapes.push(shape as ReactShape);
        }
      }
    });

    setKonvaShapes(newKonvaShapes);
    setReactShapes(newReactShapes);
    setImages(newImages);
    setConnections(newConnections);
  }, []);

  // LAYER FUNCTIONS
  const bringForward = () => {
    if (selectedNodeIds.length === 0) return;
    const shapeIdToMove = selectedNodeIds[selectedNodeIds.length - 1];
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    if (shapeIndex === -1 || shapeIndex === allShapes.length - 1) return;
    const updatedShapes = reorderArray(allShapes, shapeIndex, shapeIndex + 1);
    applyReorderedShapes(updatedShapes);
  };

  const sendBackward = () => {
    if (selectedNodeIds.length === 0) return;
    const shapeIdToMove = selectedNodeIds[0];
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    if (shapeIndex <= 0) return;
    const updatedShapes = reorderArray(allShapes, shapeIndex, shapeIndex - 1);
    applyReorderedShapes(updatedShapes);
  };

  const bringToFront = () => {
    if (selectedNodeIds.length === 0) return;
    const shapeIdToMove = selectedNodeIds[selectedNodeIds.length - 1];
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    if (shapeIndex === -1 || shapeIndex === allShapes.length - 1) return;
    const updatedShapes = reorderArray(allShapes, shapeIndex, allShapes.length - 1);
    applyReorderedShapes(updatedShapes);
  };

  const sendToBack = () => {
    if (selectedNodeIds.length === 0) return;
    const shapeIdToMove = selectedNodeIds[0];
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    if (shapeIndex <= 0) return;
    const updatedShapes = reorderArray(allShapes, shapeIndex, 0);
    applyReorderedShapes(updatedShapes);
  };

  // Shape management
  const addShape = useCallback((type: Tool, addAction: (action: Action) => void, customPosition?: { x: number; y: number }, overrides?: Partial<KonvaShape>) => {

    // 1. CRITICAL: Use the customPosition if it exists!
    let spawnPos = customPosition;

    if (!spawnPos) {
      // Logic for fallback ...
      if (stageInstance) {
        spawnPos = {
          x: -stageInstance.x() / stageInstance.scaleX() + stageInstance.width() / (2 * stageInstance.scaleX()),
          y: -stageInstance.y() / stageInstance.scaleY() + stageInstance.height() / (2 * stageInstance.scaleY())
        };
      } else {
        spawnPos = { x: 0, y: 0 };
      }
    }

    if (type === "text") {
      // ... existing text logic (omitted for brevity, assume unchanged behavior unless we want overrides here too)
      // For now, only adding overrides to Konva shapes as per requirements
      const shapeId = `text-${Date.now()}`;
      const newTextShape: ReactShape = {
        id: shapeId,
        type: 'text',
        x: spawnPos.x,
        y: spawnPos.y,
        text: "Type something...",
        fontSize: 20,
        fill: "#000000",
        fontFamily: "Inter, Arial, sans-serif",
        fontWeight: "400",
        fontStyle: "normal",
        align: "left",
        draggable: true,
      };
      setReactShapes(prev => [...prev, newTextShape]);
      addAction({ type: "add-react-shape", shapeType: 'text', data: newTextShape });
      setSelectedNodeIds([shapeId]);
      setActiveTool("text");

    } else if (type === "stickyNote") {
      // ... existing sticky logic
      const shapeId = `sticky-${Date.now()}`;
      const newStickyNote: ReactShape = {
        id: shapeId,
        type: 'stickyNote',
        x: spawnPos.x - 100,
        y: spawnPos.y - 75,
        text: "Double click to edit...",
        fontSize: 16,
        width: 200,
        height: 150,
        backgroundColor: "#ffeb3b",
        textColor: "#000000",
        fontFamily: "Arial",
        draggable: true,
      };
      setReactShapes(prev => [...prev, newStickyNote]);
      addAction({ type: "add-react-shape", shapeType: 'stickyNote', data: newStickyNote });
      if (activeTool === "select") setSelectedNodeIds([shapeId]);

    } else {
      // Pass spawnPos and overrides to addKonvaShape
      const result = addKonvaShape(type, spawnPos, true, overrides);

      if (result) {
        addAction({
          type: "add-konva-shape",
          shapeType: type,
          data: result.shapeData
        });

        if (activeTool === "select") {
          setSelectedNodeIds([result.shapeId]);
        }
      }
    }
  }, [stageInstance, activeTool, addKonvaShape, setActiveTool]);


  const addStageFrame = useCallback((width: number, height: number, addAction: (action: Action) => void, centerPosition?: { x: number; y: number }) => {
    const shapeId = `stage-${Date.now()}`;

    let x = 50;
    let y = 50;

    if (centerPosition) {
      x = centerPosition.x - width / 2;
      y = centerPosition.y - height / 2;
    } else if (stageInstance) {
      const viewportCenter = {
        x: -position.x / scale + stageInstance.width() / (2 * scale),
        y: -position.y / scale + stageInstance.height() / (2 * scale)
      };
      x = viewportCenter.x - width / 2;
      y = viewportCenter.y - height / 2;
    }

    const stageFrame: KonvaShape = {
      id: shapeId,
      type: 'stage',
      x: x,
      y: y,
      width: width,
      height: height,
      fill: "#ffffff",
      stroke: "#cccccc",
      strokeWidth: 2,
      draggable: true,
    };


    setStageFrames(prev => [...prev, stageFrame]);

    addAction({
      type: "add-stage-frame",
      data: stageFrame
    });

    return shapeId;
  }, [stageInstance, scale, position]);

  const updateShape = useCallback(
    (id: string, attrs: Record<string, unknown>) => {


      // Update each shape type separately with proper type safety
      setReactShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...attrs } : shape
        )
      );

      setKonvaShapes((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...attrs } : shape
        )
      );

      setImages((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...attrs } : shape
        )
      );

      setConnections((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...attrs } : shape
        )
      );

      setStageFrames((prev) =>
        prev.map((shape) =>
          shape.id === id ? { ...shape, ...attrs } : shape
        )
      );
    },
    []
  );

  // In useBoardState.ts - replace deleteShape with this:
  const deleteShape = useCallback(
    (id: string) => {

      setReactShapes((prev) => prev.filter((s) => s.id !== id));
      setKonvaShapes((prev) => prev.filter((s) => s.id !== id));
      setImages((prev) => prev.filter((s) => s.id !== id));
      setConnections((prev) => prev.filter((s) => s.id !== id));
      setStageFrames((prev) => prev.filter((s) => s.id !== id)); // ADD THIS LINE - CRITICAL!

      // CHANGED: Remove from selected nodes
      setSelectedNodeIds(prev => prev.filter(nodeId => nodeId !== id));
    },
    [reactShapes, konvaShapes, images, connections, stageFrames]
  );

  const duplicateShape = useCallback((direction: 'top' | 'right' | 'bottom' | 'left', shouldConnect: boolean = false) => {
    // 1. Get currently selected shape
    const shapeId = selectedNodeIds[selectedNodeIds.length - 1];
    if (!shapeId) return;

    // 2. Find the shape object
    const shape: any =
      konvaShapes.find(s => s.id === shapeId) ||
      reactShapes.find(s => s.id === shapeId) ||
      images.find(s => s.id === shapeId) ||
      stageFrames.find(s => s.id === shapeId);

    if (!shape) return;

    // 3. Calculate Dimensions & Offset
    let w = shape.width || 100;
    let h = shape.height || 100;

    // Normalize dimensions for Center-based shapes
    if (shape.type === 'circle') {
      const r = shape.radius || 50;
      w = r * 2; h = r * 2;
    } else if (shape.type === 'ellipse') {
      const rx = shape.radiusX || 80;
      const ry = shape.radiusY || 50;
      w = rx * 2; h = ry * 2;
    }

    const GAP = 20; // Smart Gap: Reduced from 200px to 20px for cleaner layout
    let shiftX = 0;
    let shiftY = 0;

    // Calculate Shift
    if (direction === 'right') shiftX = w + GAP;
    if (direction === 'left') shiftX = -(w + GAP);
    if (direction === 'bottom') shiftY = h + GAP;
    if (direction === 'top') shiftY = -(h + GAP);

    const newX = shape.x + shiftX;
    const newY = shape.y + shiftY;

    // 4. Create New Shape
    const newId = `${shape.type}-${Date.now()}`;
    const newShape = { ...shape, id: newId, x: newX, y: newY };



    // Add to state
    if (shape.type === 'image') {
      setImages(prev => [...prev, newShape]);
      setActions(prev => [...prev, { type: 'add-image', data: newShape }]);
    } else if (shape.type === 'stage') {
      setStageFrames(prev => [...prev, newShape]);
      setActions(prev => [...prev, { type: 'add-stage-frame', data: newShape }]);
    } else if (['text', 'stickyNote'].includes(shape.type)) {
      setReactShapes(prev => [...prev, newShape]);
      setActions(prev => [...prev, { type: 'add-react-shape', shapeType: shape.type, data: newShape }]);
    } else {
      setKonvaShapes(prev => [...prev, newShape]);
      setActions(prev => [...prev, { type: 'add-konva-shape', shapeType: shape.type, data: newShape }]);
    }

    // 5. AUTO-CONNECT (The Killer Feature)
    if (shouldConnect) {
      const connectionId = `conn-${Date.now()}`;

      // Determine sides based on direction
      let startSide: Side = 'right';
      let endSide: Side = 'left';

      if (direction === 'right') { startSide = 'right'; endSide = 'left'; }
      if (direction === 'left') { startSide = 'left'; endSide = 'right'; }
      if (direction === 'bottom') { startSide = 'bottom'; endSide = 'top'; }
      if (direction === 'top') { startSide = 'top'; endSide = 'bottom'; }

      // We use the shape centers/edges to calculate connection points roughly, 
      // but since we are linking Nodes by ID, the stage component will handle the exact anchor logic!
      const newConnection: Connection = {
        id: connectionId,
        type: 'connection',
        from: { nodeId: shape.id, side: startSide, x: 0, y: 0 }, // coords updated by stage
        to: { nodeId: newId, side: endSide, x: 0, y: 0 },
        stroke: "#64748B",
        strokeWidth: 4,
        draggable: false,
      };

      setConnections(prev => [...prev, newConnection]);
      setActions(prev => [...prev, { type: 'add-connection', data: newConnection }]);
    }

    // 6. Switch selection to the new shape so the user can keep typing/spawning
    setSelectedNodeIds([newId]);

  }, [selectedNodeIds, konvaShapes, reactShapes, images, stageFrames]);

  // CHANGED: Updated selectShape to handle single or multiple selections
  const selectShape = useCallback((id: string | string[] | null) => {
    if (id === null) {
      setSelectedNodeIds([]);
    } else if (Array.isArray(id)) {
      setSelectedNodeIds(id);
    } else {
      setSelectedNodeIds([id]);
    }
  }, []);

  // CHANGED: Updated to get multiple selected shapes
  const getSelectedShapes = useCallback(() => {
    const allShapes: Array<KonvaShape | ReactShape | ImageShape | Connection> = [
      ...konvaShapes,
      ...reactShapes,
      ...images,
      ...connections
    ];

    return allShapes.filter((shape) => selectedNodeIds.includes(shape.id));
  }, [konvaShapes, reactShapes, images, connections, selectedNodeIds]);

  // CHANGED: Keep getSelectedShape for backward compatibility (returns first selected)
  const getSelectedShape = useCallback(() => {
    const selectedShapes = getSelectedShapes();
    return selectedShapes.length > 0 ? selectedShapes[0] : null;
  }, [getSelectedShapes]);

  // Ensure connectors follow connected nodes when those nodes move.
  const updateConnectionsForNode = useCallback((nodeId: string, newX: number, newY: number) => {
    setConnections(prev =>
      prev.map(conn => {
        const updated = { ...conn };

        if (updated.from?.nodeId === nodeId) {
          updated.from = { ...updated.from, x: newX, y: newY };
        }
        if (updated.to?.nodeId === nodeId) {
          updated.to = { ...updated.to, x: newX, y: newY };
        }

        // NOTE: We intentionally do not auto-recompute control points here.
        // The control points should be recomputed by the connector logic in useKonvaTools
        // (or on render) so we keep the state sync simple and predictable.

        return updated;
      })
    );
  }, []);

  const resetBoard = useCallback(() => {
    setKonvaShapes([]);
    setReactShapes([]);
    setImages([]);
    setConnections([]);
    setSelectedNodeIds([]);
    setActiveTool(null);
  }, []);

  // Board ID + Status
  useEffect(() => {
    if (params.boardId) setCurrentBoardId(params.boardId as string);
  }, [params.boardId]);

  useEffect(() => {
    const checkBoardStatus = async () => {
      try {
        const response = await fetch(`/api/boards/${currentBoardId}`);
        const board = await response.json();
        setIsTemporaryBoard(board.is_temporary || false);
      } catch (error) {
        console.error("Failed to fetch board status:", error);
      }
    };
    if (currentBoardId) checkBoardStatus();
  }, [currentBoardId]);

  // Return
  return {
    // State
    stageDimensions,
    tempDimensions,
    connectionStart,
    tempConnection,
    isConnecting,
    scale,
    position,
    activeTool,
    actions,
    undoneActions,
    stageInstance,
    reactShapes,
    konvaShapes,
    // CHANGED: Multi-select state
    selectedNodeIds,
    drawingMode,
    lines,
    showResources,
    showSaveModal,
    isTemporaryBoard,
    currentBoardId,
    showSetupDialog,
    boardInfo,
    stageFrames,
    images,
    connections,
    tempDrawingShape, // NEW
    // Setters
    setConnections,
    setTempDrawingShape, // NEW
    setStageDimensions,
    setTempDimensions,
    setConnectionStart,
    setTempConnection,
    setIsConnecting,
    setScale,
    setPosition,
    setActiveTool,
    setActions,
    setUndoneActions,
    setStageInstance,
    setReactShapes,
    setKonvaShapes,
    // CHANGED: Multi-select setter
    setSelectedNodeIds,
    setDrawingMode,
    setLines,
    setShowResources,
    setShowSaveModal,
    setIsTemporaryBoard,
    setCurrentBoardId,
    setShowSetupDialog,
    setBoardInfo,
    setStageFrames,
    setImages,

    // Shape actions
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    resetBoard,

    // Connection actions - NEW
    addConnection,
    updateConnection,
    removeConnection,

    // Layering
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,

    // Helpers
    getSelectedShape, // For backward compatibility
    getSelectedShapes, // NEW: For multi-select
    updateConnectionsForNode,
    // Konva helpers
    addKonvaShape,
    updateKonvaShape,
    removeKonvaShape,
    addStageFrame,
    addImage,
    duplicateShape,
  };
};