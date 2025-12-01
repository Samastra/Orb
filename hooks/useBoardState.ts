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


  // NEW: Add connection function
 const addConnection = useCallback((connectionData: any, addAction: (action: Action) => void) => {
    const connectionId = `conn-${Date.now()}`;
    
    const newConnection: Connection = {
      id: connectionId,
      type: 'connection',
      ...connectionData,
      draggable: false, 
    };
    
    console.log('➕ Adding Connection:', newConnection);
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
    console.error('Failed to load image for dimensions:', src);
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

  const addKonvaShape = useCallback((type: Tool, center: { x: number; y: number }, draggable: boolean) => {
    const shapeId = `shape-${Date.now()}`;

    const baseShape = {
        id: shapeId,
        type,
        x: center.x,
        y: center.y,
        fill: "#aae3ff",
        stroke: "#000000",     // 🆕 ADD: Border color
        strokeWidth: 0,        // 🆕 ADD: Border thickness  
        draggable: draggable,
        rotation: 0,           // 🆕 ADD: Rotation
        cornerRadius: 0,       // 🆕 ADD: For rectangles
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
          cornerRadius: 0, // 🆕 ADD THIS
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
          stroke: "#000000", // 🆕 ENSURE stroke exists
          strokeWidth: 0,    // 🆕 ENSURE strokeWidth exists
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
          stroke: "black",
          strokeWidth: 2,
        };
        break;
      default:
        return null;
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

  // Remove Konva shape
  const removeKonvaShape = useCallback((id: string) => {
    setKonvaShapes(prev => prev.filter(shape => shape.id !== id));
  }, []);

  // Apply reordered shapes - UPDATED TO INCLUDE IMAGES AND CONNECTIONS
  const applyReorderedShapes = useCallback((updatedShapes: Array<KonvaShape | ReactShape | ImageShape | Connection>) => {
    console.log('🔄 Applying reordered shapes:', updatedShapes.length);
    
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
        } else if (['rect', 'circle', 'ellipse', 'triangle', 'arrow', 'stage'].includes(shape.type)) {
          newKonvaShapes.push(shape as KonvaShape);
        } else {
          newReactShapes.push(shape as ReactShape);
        }
      }
    });

    console.log('📊 Split into:', { 
      konva: newKonvaShapes.length, 
      react: newReactShapes.length, 
      images: newImages.length,
      connections: newConnections.length
    });
    
    setKonvaShapes(newKonvaShapes);
    setReactShapes(newReactShapes);
    setImages(newImages);
    setConnections(newConnections);
  }, []);

  // SIMPLE LAYER FUNCTIONS - UPDATED FOR MULTI-SELECT
  const bringForward = () => {
    console.log('🎯 BRING FORWARD called, selected:', selectedNodeIds);
    if (selectedNodeIds.length === 0) return;
    
    // For multi-select, we'll bring forward the last selected shape for now
    // In a more advanced implementation, you might want to bring all selected shapes forward
    const shapeIdToMove = selectedNodeIds[selectedNodeIds.length - 1];
    
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    console.log('📋 All shapes:', { 
      konva: konvaShapes.length, 
      react: reactShapes.length, 
      images: images.length,
      connections: connections.length,
      total: allShapes.length 
    });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex === -1 || shapeIndex === allShapes.length - 1) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, shapeIndex + 1);
    applyReorderedShapes(updatedShapes);
  };

  const sendBackward = () => {
    console.log('🎯 SEND BACKWARD called, selected:', selectedNodeIds);
    if (selectedNodeIds.length === 0) return;
    
    const shapeIdToMove = selectedNodeIds[0]; // Use first selected for backward
    
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    console.log('📋 All shapes:', { 
      konva: konvaShapes.length, 
      react: reactShapes.length, 
      images: images.length,
      connections: connections.length,
      total: allShapes.length 
    });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex <= 0) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, shapeIndex - 1);
    applyReorderedShapes(updatedShapes);
  };

  const bringToFront = () => {
    console.log('🎯 BRING TO FRONT called, selected:', selectedNodeIds);
    if (selectedNodeIds.length === 0) return;
    
    const shapeIdToMove = selectedNodeIds[selectedNodeIds.length - 1];
    
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    console.log('📋 All shapes:', { 
      konva: konvaShapes.length, 
      react: reactShapes.length, 
      images: images.length,
      connections: connections.length,
      total: allShapes.length 
    });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex === -1 || shapeIndex === allShapes.length - 1) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, allShapes.length - 1);
    applyReorderedShapes(updatedShapes);
  };

  const sendToBack = () => {
    console.log('🎯 SEND TO BACK called, selected:', selectedNodeIds);
    if (selectedNodeIds.length === 0) return;
    
    const shapeIdToMove = selectedNodeIds[0];
    
    const allShapes = [...konvaShapes, ...reactShapes, ...images, ...connections];
    console.log('📋 All shapes:', { 
      konva: konvaShapes.length, 
      react: reactShapes.length, 
      images: images.length,
      connections: connections.length,
      total: allShapes.length 
    });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === shapeIdToMove);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex <= 0) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, 0);
    applyReorderedShapes(updatedShapes);
  };

// Shape management
 const addShape = useCallback((type: Tool, addAction: (action: Action) => void, customPosition?: { x: number; y: number }) => {
    
    // 1. CRITICAL: Use the customPosition if it exists!
    // If customPosition is passed (from BoardPage), use it. 
    // Otherwise fallback to 0,0 (but log a warning).
    let spawnPos = customPosition;

    if (!spawnPos) {
       console.warn("⚠️ No custom position provided to addShape. Using fallback (0,0).");
       // Fallback to center of the stage if stageInstance exists, or 0,0
       if (stageInstance) {
          spawnPos = {
            x: -stageInstance.x() / stageInstance.scaleX() + stageInstance.width() / (2 * stageInstance.scaleX()),
            y: -stageInstance.y() / stageInstance.scaleY() + stageInstance.height() / (2 * stageInstance.scaleY())
          };
       } else {
          spawnPos = { x: 0, y: 0 };
       }
    }

    console.log('📍 Creating shape at exact world position:', spawnPos);

    if (type === "text") {
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
      
      addAction({
        type: "add-react-shape",
        shapeType: 'text',
        data: newTextShape
      });
      
      setSelectedNodeIds([shapeId]);
      setActiveTool("text");

    } else if (type === "stickyNote") {
      const shapeId = `sticky-${Date.now()}`;
      
      const newStickyNote: ReactShape = {
        id: shapeId,
        type: 'stickyNote',
        x: spawnPos.x - 100, // Center the note
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
      
      addAction({
        type: "add-react-shape",
        shapeType: 'stickyNote',
        data: newStickyNote
      });
      
      if (activeTool === "select") {
        setSelectedNodeIds([shapeId]);
      }
    } else {
      // Pass spawnPos to addKonvaShape
      const result = addKonvaShape(type, spawnPos, true);
      
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
  
  console.log('➕ Adding Stage Frame at viewport position:', { x, y }, stageFrame);
  setStageFrames(prev => [...prev, stageFrame]);
  
  addAction({
    type: "add-stage-frame",
    data: stageFrame
  });
  
  return shapeId;
}, [stageInstance, scale, position]);

 const updateShape = useCallback(
  (id: string, attrs: Record<string, unknown>) => {
    console.log('🔄 updateShape called:', { id, attrs });
    
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
    console.log('🗑️ Deleting shape:', id, {
      reactShapes: reactShapes.find(s => s.id === id),
      konvaShapes: konvaShapes.find(s => s.id === id),
      images: images.find(s => s.id === id),
      connections: connections.find(s => s.id === id),
      stageFrames: stageFrames.find(s => s.id === id) // ADD THIS LINE
    });
    
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

    const duplicateShape = useCallback((direction: 'top' | 'right' | 'bottom' | 'left') => {
    // 1. Get currently selected shape (only support single selection for now)
    const shapeId = selectedNodeIds[selectedNodeIds.length - 1]; // Use the last selected
    if (!shapeId) return;

    // 2. Find the shape object in any of the arrays
    const shape: any =
      konvaShapes.find(s => s.id === shapeId) ||
      reactShapes.find(s => s.id === shapeId) ||
      images.find(s => s.id === shapeId) ||
      stageFrames.find(s => s.id === shapeId);

    if (!shape) return;

    // 3. Calculate Dimensions for Offset
    let w = shape.width || 100;
    let h = shape.height || 100;
    
    // Normalize dimensions for Center-based shapes (Circle/Ellipse)
    // We want the visible width/height
    if (shape.type === 'circle') {
       const r = shape.radius || 50;
       w = r * 2; 
       h = r * 2;
    } else if (shape.type === 'ellipse') {
       const rx = shape.radiusX || 80;
       const ry = shape.radiusY || 50;
       w = rx * 2; 
       h = ry * 2;
    }

    const GAP = 50; // Distance between shapes
    let shiftX = 0;
    let shiftY = 0;

    // 4. Calculate Shift Vector
    // Note: This logic works for both Center-based and Top-Left based shapes
    // because we are shifting by the full dimension + gap.
    if (direction === 'right') shiftX = w + GAP;
    if (direction === 'left') shiftX = -(w + GAP);
    if (direction === 'bottom') shiftY = h + GAP;
    if (direction === 'top') shiftY = -(h + GAP);

    const newX = shape.x + shiftX;
    const newY = shape.y + shiftY;

    // 5. Create New Shape Data
    // We append a timestamp to ensure unique IDs
    const newId = `${shape.type}-${Date.now()}`;
    const newShape = { ...shape, id: newId, x: newX, y: newY };

    console.log(`🚀 Duplicating ${shape.type} to ${direction}`);

    // 6. Add to State & History
    // We handle this manually to ensure immediate state update for "Rapid Fire" feel
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

    // 7. RAPID FIRE: Switch selection to the new shape immediately
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
    // Setters
    setConnections,
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