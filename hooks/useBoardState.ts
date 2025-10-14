// hooks/useBoardState.ts
import { useState, useEffect, useCallback } from "react";
import Konva from "konva";
import { useParams } from "next/navigation";
import { BoardState, Tool, Action, ReactShape } from "../types/board-types";
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

export const useBoardState = () => {
  const params = useParams();

  // State
  const [stageDimensions, setStageDimensions] = useState(defaultStageDimensions);
  const [tempDimensions, setTempDimensions] = useState(defaultStageDimensions);
  const [connectionStart, setConnectionStart] = useState<{ x: number; y: number } | null>(null);
  const [tempConnection, setTempConnection] = useState<Konva.Line | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [undoneActions, setUndoneActions] = useState<Action[]>([]);
  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);
  const [reactShapes, setReactShapes] = useState<ReactShape[]>([]);
  const [konvaShapes, setKonvaShapes] = useState<KonvaShape[]>([]); // MOVED HERE
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<"brush" | "eraser">("brush");
  const [lines, setLines] = useState<Array<{ tool: "brush" | "eraser"; points: number[] }>>([]);
  const [showResources, setShowResources] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isTemporaryBoard, setIsTemporaryBoard] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<string>("");
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [boardInfo, setBoardInfo] = useState(defaultBoardInfo);
  const [stageFrames, setStageFrames] = useState<KonvaShape[]>([]);
  // Add Konva shape (moved from useShapes)
  const addKonvaShape = useCallback((type: Tool, center: { x: number; y: number }, draggable: boolean) => {
    const shapeId = `shape-${Date.now()}`;

    const baseShape = {
      id: shapeId,
      type,
      x: center.x,
      y: center.y,
      fill: "#aae3ff",
      draggable: draggable,
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

  // Apply reordered shapes
  const applyReorderedShapes = useCallback((updatedShapes: Array<KonvaShape | ReactShape>) => {
    console.log('🔄 Applying reordered shapes:', updatedShapes.length);
    
    const newKonvaShapes: KonvaShape[] = [];
    const newReactShapes: ReactShape[] = [];

    updatedShapes.forEach(shape => {
      const isKonvaShape = 'type' in shape && ['rect', 'circle', 'ellipse', 'triangle', 'arrow'].includes(shape.type);
      
      if (isKonvaShape) {
        newKonvaShapes.push(shape as KonvaShape);
      } else {
        newReactShapes.push(shape as ReactShape);
      }
    });

    console.log('📊 Split into:', { konva: newKonvaShapes.length, react: newReactShapes.length });
    
    setKonvaShapes(newKonvaShapes);
    setReactShapes(newReactShapes);
  }, []);

  // SIMPLE LAYER FUNCTIONS
  const bringForward = () => {
    console.log('🎯 BRING FORWARD called, selected:', selectedNodeId);
    if (!selectedNodeId) return;
    
    const allShapes = [...konvaShapes, ...reactShapes];
    console.log('📋 All shapes:', { konva: konvaShapes.length, react: reactShapes.length, total: allShapes.length });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === selectedNodeId);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex === -1 || shapeIndex === allShapes.length - 1) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, shapeIndex + 1);
    applyReorderedShapes(updatedShapes);
  };

  const sendBackward = () => {
    console.log('🎯 SEND BACKWARD called, selected:', selectedNodeId);
    if (!selectedNodeId) return;
    
    const allShapes = [...konvaShapes, ...reactShapes];
    console.log('📋 All shapes:', { konva: konvaShapes.length, react: reactShapes.length, total: allShapes.length });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === selectedNodeId);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex <= 0) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, shapeIndex - 1);
    applyReorderedShapes(updatedShapes);
  };

  const bringToFront = () => {
    console.log('🎯 BRING TO FRONT called, selected:', selectedNodeId);
    if (!selectedNodeId) return;
    
    const allShapes = [...konvaShapes, ...reactShapes];
    console.log('📋 All shapes:', { konva: konvaShapes.length, react: reactShapes.length, total: allShapes.length });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === selectedNodeId);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex === -1 || shapeIndex === allShapes.length - 1) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, allShapes.length - 1);
    applyReorderedShapes(updatedShapes);
  };

  const sendToBack = () => {
    console.log('🎯 SEND TO BACK called, selected:', selectedNodeId);
    if (!selectedNodeId) return;
    
    const allShapes = [...konvaShapes, ...reactShapes];
    console.log('📋 All shapes:', { konva: konvaShapes.length, react: reactShapes.length, total: allShapes.length });
    
    const shapeIndex = allShapes.findIndex(shape => shape.id === selectedNodeId);
    console.log('📊 Shape index:', shapeIndex, 'Total shapes:', allShapes.length);
    
    if (shapeIndex <= 0) return;

    const updatedShapes = reorderArray(allShapes, shapeIndex, 0);
    applyReorderedShapes(updatedShapes);
  };

// Shape management
// Change addShape function signature and implementation
const addShape = useCallback((type: Tool, addAction: (action: Action) => void) => {
  console.log('🎯 addShape called with type:', type);
  
  if (!stageInstance) {
    console.log('❌ No stage instance');
    return;
  }

  const safePosition = position ?? { x: 0, y: 0 }; 
  const center = {
    x: (stageInstance.width() / 2 / scale) - safePosition.x / scale,
    y: (stageInstance.height() / 2 / scale) - safePosition.y / scale,
  };

  console.log('📍 Creating shape at center:', center);

  if (type === "text") {
    const shapeId = `shape-${Date.now()}`;
    
    const newTextShape: ReactShape = {
      id: shapeId,
      type: 'text',
      x: center.x,
      y: center.y,
      text: "Double click to edit",
      fontSize: 20,
      fill: "#000000",
      fontFamily: "Arial",
      fontWeight: "400",
      fontStyle: "normal",
      textDecoration: "none",
      align: "left",
      draggable: true,
    };
    
    console.log('➕ Adding Text shape:', newTextShape);
    setReactShapes(prev => [...prev, newTextShape]);
    
    // ADD ACTION RECORDING
    addAction({
      type: "add-react-shape",
      shapeType: 'text',
      data: newTextShape
    });
    
    if (activeTool === "select") {
      setSelectedNodeId(shapeId);
    }
  } else if (type === "stickyNote") {
    const shapeId = `sticky-${Date.now()}`;
    
    const newStickyNote: ReactShape = {
      id: shapeId,
      type: 'stickyNote',
      x: center.x - 100,
      y: center.y - 75,
      text: "Double click to edit...",
      fontSize: 16,
      width: 200,
      height: 150,
      backgroundColor: "#ffeb3b",
      textColor: "#000000",
      fontFamily: "Arial",
      draggable: true,
    };
    
    console.log('➕ Adding Sticky Note:', newStickyNote);
    setReactShapes(prev => [...prev, newStickyNote]);
    
    // ADD ACTION RECORDING
    addAction({
      type: "add-react-shape",
      shapeType: 'stickyNote',
      data: newStickyNote
    });
    
    if (activeTool === "select") {
      setSelectedNodeId(shapeId);
    }
  } else {
    // For Konva shapes (rect, circle, etc.)
    console.log('➕ Adding Konva shape:', type);
    const result = addKonvaShape(type, center, true);
    
    // ADD ACTION RECORDING
    if (result) {
      addAction({
        type: "add-konva-shape",
        shapeType: type,
        data: result.shapeData
      });
      
      if (activeTool === "select") {
        setSelectedNodeId(result.shapeId);
      }
    }
  }
}, [stageInstance, scale, position, activeTool, addKonvaShape, setSelectedNodeId]);

const addStageFrame = useCallback((width: number, height: number, addAction: (action: Action) => void) => {
  const shapeId = `stage-${Date.now()}`;
  
  const stageFrame: KonvaShape = {
    id: shapeId,
    type: 'stage',
    x: 50,
    y: 50,
    width: width,
    height: height,
    fill: "#ffffff",
    stroke: "#cccccc",
    strokeWidth: 2,
    draggable: true,
  };
  
  console.log('➕ Adding Stage Frame:', stageFrame);
  setStageFrames(prev => [...prev, stageFrame]);
  
  // ADD ACTION RECORDING
  addAction({
    type: "add-stage-frame",
    data: stageFrame
  });
  
  return shapeId;
}, []);

  const updateShape = useCallback(
    (id: string, attrs: Partial<any>) => {
      setReactShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...attrs } : s)));
      setKonvaShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...attrs } : s)));
    },
    []
  );

  const deleteShape = useCallback(
    (id: string) => {
      setReactShapes((prev) => prev.filter((s) => s.id !== id));
      setKonvaShapes((prev) => prev.filter((s) => s.id !== id));
      if (selectedNodeId === id) setSelectedNodeId(null);
    },
    [selectedNodeId]
  );

  const selectShape = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const getSelectedShape = useCallback(() => {
    const all = [...konvaShapes, ...reactShapes];
    return all.find((s: any) => s.id === selectedNodeId) || null;
  }, [konvaShapes, reactShapes, selectedNodeId]);

  const resetBoard = useCallback(() => {
    setKonvaShapes([]);
    setReactShapes([]);
    setSelectedNodeId(null);
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
    selectedNodeId,
    drawingMode,
    lines,
    showResources,
    showSaveModal,
    isTemporaryBoard,
    currentBoardId,
    showSetupDialog,
    boardInfo,
    stageFrames,
    // Setters
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
    setSelectedNodeId,
    setDrawingMode,
    setLines,
    setShowResources,
    setShowSaveModal,
    setIsTemporaryBoard,
    setCurrentBoardId,
    setShowSetupDialog,
    setBoardInfo,
    setStageFrames,

    // Shape actions
    addShape,
    updateShape,
    deleteShape,
    selectShape,
    resetBoard,

    // Layering
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,

    // Helpers
    getSelectedShape,

    // Konva helpers
    addKonvaShape,
    updateKonvaShape,
    removeKonvaShape,
    addStageFrame,
  };
};