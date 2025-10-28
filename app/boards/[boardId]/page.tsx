"use client";

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Konva from "konva";
import { useUser } from "@clerk/nextjs";
import { useAutoSave } from '@/hooks/useAutoSave';
import { useParams } from "next/navigation";
import { Tool } from "@/types/board-types";
import { defaultStageDimensions } from "@/constants/tool-constants";
// Components
import Toolbar from "@/components/Toolbar";
import BoardHeader from "@/components/BoardHeader";
import StageComponent from "@/components/StageComponent";
import CreateBoard from "@/components/createBoard";
import { deleteBoard } from "@/lib/actions/board-actions";
import VideoPlayerModal from '@/components/VideoPlayerModal';
// Hooks
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useBoardState } from "@/hooks/useBoardState";
import { useKonvaTools } from "@/hooks/useKonvaTools";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import FormattingToolbar from "@/components/FormattingToolbar";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
// Utils
import { fetchBoard } from "@/lib/actions/board-actions";
import { useWindowSize } from "@/hooks/useWindowSize";
import { cn } from "@/lib/utils";
import { loadBoardElements } from "@/lib/actions/board-elements-actions";


interface ShapeAttributes {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  text?: string;
  // Add other shape properties as needed
}

interface FormattingUpdates {
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontFamily?: string;
  // Add other formatting properties
}



// Simple debounce without complex types
const useDebounce = (callback: (...args: unknown[]) => void, delay: number) => {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: unknown[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Utility for deep equality comparison
// Replace the entire areEqual function:
const areEqual = (obj1: unknown, obj2: unknown): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }
  
  const obj1Record = obj1 as Record<string, unknown>;
  const obj2Record = obj2 as Record<string, unknown>;
  
  const keys1 = Object.keys(obj1Record);
  const keys2 = Object.keys(obj2Record);
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    const val1 = obj1Record[key];
    const val2 = obj2Record[key];
    
    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) return false;
      for (let i = 0; i < val1.length; i++) {
        if (!areEqual(val1[i], val2[i])) return false;
      }
    } else if (!areEqual(val1, val2)) {
      return false;
    }
  }
  return true;
};

const BoardPage = () => {
  const params = useParams();

  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  
 
  const [hasChanges, setHasChanges] = useState(false); // Track if board has unsaved changes
  const [hasLoaded, setHasLoaded] = useState(false); // Track if board elements have been loaded
  const [isInteracting, setIsInteracting] = useState(false);
  const {
    videoId,
    videoTitle, 
    isVideoOpen,
    openVideo,
    closeVideo
  } = useVideoPlayer();

  // State management
  const boardState = useBoardState();
  const [stageKey, setStageKey] = useState(0);
  const {
    scale, position, activeTool, drawingMode, lines, connectionStart, tempConnection,
    isConnecting, reactShapes, konvaShapes, stageFrames, images, connections, selectedNodeId, stageInstance, tempDimensions,
    showSaveModal, isTemporaryBoard, currentBoardId, showSetupDialog, boardInfo,
    setActiveTool, setDrawingMode, setLines, setConnectionStart, setTempConnection,
    setIsConnecting, setReactShapes, setKonvaShapes, setStageFrames, setImages, setConnections, setSelectedNodeId, setStageInstance,
    setTempDimensions, setShowSaveModal, setShowSetupDialog, setBoardInfo,
    // Layer functions
    bringForward,
    sendBackward, 
    bringToFront,
    sendToBack,
    // Shape functions
    addShape,
    deleteShape,
    addStageFrame,
    addImage,
    updateConnection,
    removeConnection,
  } = boardState;

  // Undo/Redo functionality
  const { addAction: undoRedoAddAction, undo, redo } = useUndoRedo(
    stageRef,
    boardState.actions,
    boardState.undoneActions,
    reactShapes,
    lines,
    konvaShapes,
    stageFrames,
    images,
    connections,
    boardState.setActions,
    boardState.setUndoneActions,
    setReactShapes,
    setLines,
    setKonvaShapes,
    setStageFrames,
    setImages,
    setConnections
  );

  // Tool functionality
  const toolHandlers = useKonvaTools(
    stageRef, 
    activeTool, 
    boardState.scale, 
    boardState.position, 
    drawingMode, 
    lines, 
    connectionStart, 
    tempConnection, 
    isConnecting, 
    selectedNodeId, 
    setActiveTool, 
    setDrawingMode, 
    setLines, 
    setConnectionStart, 
    setTempConnection, 
    setIsConnecting, 
    setSelectedNodeId, 
    undoRedoAddAction,
    setConnections,
    updateConnection
  );

  const { user } = useUser();
  const { triggerSave } = useAutoSave(currentBoardId, isTemporaryBoard, user?.id);

  // Debounced triggerSave for interaction end
          // Replace the debouncedTriggerSave in boards/[boardId]/page.tsx:
        const debouncedTriggerSave = useDebounce((data: unknown) => {
          if (typeof data === 'object' && data !== null) {
            const saveData = data as {
              reactShapes: typeof reactShapes;
              konvaShapes: typeof konvaShapes;
              stageFrames: typeof stageFrames;
              images: typeof images;
              connections: typeof connections;
              lines: typeof lines;
              scale?: number;
              position?: { x: number; y: number };
            };
            triggerSave(saveData);
          }
        }, 10000);

  // Periodic auto-save (every 5 minutes)
  useEffect(() => {
    if (!currentBoardId || isTemporaryBoard || !user) return;

    const interval = setInterval(() => {
      if (hasChanges) {
        console.log("⏲️ Periodic auto-save triggered (5min)");
        triggerSave({
          reactShapes,
          konvaShapes,
          stageFrames,
          images,
          connections,
          lines,
          scale,
          position,
        });
        setHasChanges(false); // Reset after saving
      } else {
        console.log("⏲️ No changes detected, skipping periodic auto-save");
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval); // Cleanup
  }, [currentBoardId, isTemporaryBoard, user, hasChanges, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position]);

  // Track interactions for scaling, dragging, and adding elements
  const handleInteractionStart = useCallback(() => {
  console.log("🖱️ Interaction started (scaling/dragging/adding)");
  setIsInteracting(true);
  setHasChanges(true);
}, [setIsInteracting]);


  const handleInteractionEnd = useCallback(() => {
  console.log("🖱️ Interaction ended (scaling/dragging/adding)");
  setIsInteracting(false);
  if (currentBoardId && !isTemporaryBoard && user && hasChanges) {
    debouncedTriggerSave({
      reactShapes,
      konvaShapes,
      stageFrames,
      images,
      connections,
      lines,
      scale,
      position,
    });
    setHasChanges(false);
  }
}, [currentBoardId, isTemporaryBoard, user, debouncedTriggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, hasChanges, setIsInteracting]);

  // Fetch board data and initialize boardInfo
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        console.log("📥 Fetching board data for:", params.boardId);
        const board = await fetchBoard(params.boardId as string);
        console.log("✅ Board data fetched:", board);
        setBoardInfo({
          title: board.title || "Untitled Board",
          category: board.category || ""
        });
        if (board.title === "Untitled Board" && !showSetupDialog) {
          setShowSetupDialog(true);
        }
      } catch (error) {
        console.error("❌ Error fetching board data:", error);
      }
    };
    loadBoardData();
  }, [params.boardId, showSetupDialog, setShowSetupDialog, setBoardInfo]);

  // Load saved elements (only on initial mount or boardId change)
  useEffect(() => {
    if (hasLoaded || !currentBoardId || isTemporaryBoard) return;

    const loadSavedElements = async () => {
      try {
        console.log("📥 Loading saved board elements for board:", currentBoardId);
        const elements = await loadBoardElements(currentBoardId);
        console.log("✅ Loaded board elements:", {
          reactShapes: elements.reactShapes?.length,
          konvaShapes: elements.konvaShapes?.length,
          stageFrames: elements.stageFrames?.length,
          images: elements.images?.length,
          connections: elements.connections?.length,
          lines: elements.lines?.length,
          stageState: elements.stageState,
        });

        // Merge new elements
        if (elements.reactShapes && elements.reactShapes.length > 0) {
          setReactShapes((prev) => {
            const merged = [...prev];
            elements.reactShapes.forEach((newShape) => {
              if (!prev.some((s) => s.id === newShape.id)) {
                merged.push(newShape);
              }
            });
            return merged;
          });
        }
        if (elements.konvaShapes && elements.konvaShapes.length > 0) {
          setKonvaShapes((prev) => {
            const merged = [...prev];
            elements.konvaShapes.forEach((newShape) => {
              if (!prev.some((s) => s.id === newShape.id)) {
                merged.push(newShape);
              }
            });
            return merged;
          });
        }
        if (elements.stageFrames && elements.stageFrames.length > 0) {
          setStageFrames((prev) => {
            const merged = [...prev];
            elements.stageFrames.forEach((newFrame) => {
              if (!prev.some((s) => s.id === newFrame.id)) {
                merged.push(newFrame);
              }
            });
            return merged;
          });
        }
        if (elements.images && elements.images.length > 0) {
          setImages((prev) => {
            const merged = [...prev];
            elements.images.forEach((newImage) => {
              if (!prev.some((s) => s.id === newImage.id)) {
                merged.push(newImage);
              }
            });
            return merged;
          });
        }
        if (elements.connections && elements.connections.length > 0) {
          setConnections((prev) => {
            const merged = [...prev];
            elements.connections.forEach((newConn) => {
              if (!prev.some((s) => s.id === newConn.id)) {
                merged.push(newConn);
              }
            });
            return merged;
          });
        }
        if (elements.lines && elements.lines.length > 0) {
          setLines((prev) => {
            const merged = [...prev];
            elements.lines.forEach((newLine) => {
              if (!prev.some((s) => areEqual(s, newLine))) {
                merged.push(newLine);
              }
            });
            return merged;
          });
        }

        if (elements.stageState) {
          const s = elements.stageState;
          if (s.scale !== scale) {
            console.log("🔄 Updating scale:", { old: scale, new: s.scale });
            boardState.setScale(s.scale ?? 1);
          }
          if (s.position.x !== position.x || s.position.y !== position.y) {
            console.log("🔄 Updating position:", { old: position, new: s.position });
            boardState.setPosition(s.position ?? { x: 0, y: 0 });
          }
        }

        setHasLoaded(true); // Mark as loaded
      } catch (error) {
        console.error("❌ Error loading board elements:", error);
      }
    };
    loadSavedElements();
  }, [currentBoardId, isTemporaryBoard, hasLoaded, setReactShapes, setKonvaShapes, setStageFrames, setImages, setConnections, setLines, boardState, scale, position]);

  // Cleanup
  useEffect(() => {
  const currentTrRef = trRef.current;
  return () => {
    if (currentTrRef) {
      currentTrRef.nodes([]);
      currentTrRef.destroy();
    }
  };
}, []);

  // Memoize selected shape
  const selectedShape = useMemo(() => {
    if (!selectedNodeId) return null;
    
    const reactShape = reactShapes.find((s) => s.id === selectedNodeId);
    if (reactShape) return reactShape;
    
    const konvaShape = konvaShapes.find((s) => s.id === selectedNodeId);
    if (konvaShape) return konvaShape;
    
    const imageShape = images.find((img) => img.id === selectedNodeId);
    if (imageShape) return imageShape;
    
    const connectionShape = connections.find((conn) => conn.id === selectedNodeId);
    return connectionShape || null;
  }, [selectedNodeId, reactShapes, konvaShapes, images, connections]);

  // Zoom functions with interaction tracking
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    handleInteractionStart();
    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.min(oldScale * scaleBy, 5);

    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
    
    console.log("🔍 Zooming in:", { oldScale, newScale });
    boardState.setScale(newScale);
    setTimeout(handleInteractionEnd, 100); // End interaction after a short delay
  }, [stageRef, boardState.setScale, handleInteractionStart, handleInteractionEnd,boardState]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    handleInteractionStart();
    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.max(oldScale / scaleBy, 0.1);

    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
    
    console.log("🔍 Zooming out:", { oldScale, newScale });
    boardState.setScale(newScale);
    setTimeout(handleInteractionEnd, 100); // End interaction after a short delay
  }, [stageRef, boardState.setScale, handleInteractionStart, handleInteractionEnd, boardState]);

  // Replace the useDebounce call:
const debouncedUpdateShape = useDebounce((args: unknown) => {
  if (Array.isArray(args) && args.length === 2) {
    const [shapeId, updates] = args as [string, Partial<ShapeAttributes>];
    console.log('🔄 Debounced update for:', { shapeId, updates });
    
    const isReactShape = reactShapes.some((s) => s.id === shapeId);
    const isKonvaShape = konvaShapes.some((s) => s.id === shapeId);
    const isConnection = connections.some((c) => c.id === shapeId);
    
    if (isReactShape) {
      setReactShapes(prev => 
        prev.map(shape => 
          shape.id === shapeId ? { ...shape, ...updates } : shape
        )
      );
    } else if (isKonvaShape) {
      const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
      if (drawLayer) {
        const node = drawLayer.findOne(`#${shapeId}`) as Konva.Shape | Konva.Group;
        if (node) {
          const prevAttrs = { ...node.attrs };
          node.setAttrs(updates);
          drawLayer.batchDraw();
          
          setKonvaShapes(prev =>
            prev.map(shape =>
              shape.id === shapeId ? { ...shape, ...updates } : shape
            )
          );
          
          undoRedoAddAction({
            type: "update",
            id: shapeId,
            prevAttrs,
            newAttrs: { ...node.attrs }
          });
        }
      }
    } else if (isConnection) {
      updateConnection(shapeId, updates);
    }

    setHasChanges(true);
  }
}, 50);

  // Handler for StageComponent (no immediate save)
  const handleStageShapeUpdate = useCallback((id: string, attrs: Partial<ShapeAttributes>) => {
  console.log("🔄 Stage shape update triggered:", { id, attrs });

  if (!id) return;

  const isReactShape = reactShapes.some((s) => s.id === id);
  const isKonvaShape = konvaShapes.some((s) => s.id === id);
  const isConnection = connections.some((c) => c.id === id);

  if (isReactShape) {
    setReactShapes((prev) =>
      prev.map((shape) => (shape.id === id ? { ...shape, ...attrs } : shape))
    );
  } else if (isKonvaShape) {
    debouncedUpdateShape([id, attrs]);
  } else if (isConnection) {
    updateConnection(id, attrs);
  }

  setHasChanges(true);
}, [debouncedUpdateShape, reactShapes, konvaShapes, connections, updateConnection, setReactShapes]);

  // Formatting toolbar update (no immediate save)
  const handleFormattingToolbarUpdate = useCallback((updates: FormattingUpdates) => {
  console.log("🔄 Formatting toolbar update:", { selectedNodeId, updates });

  if (!selectedNodeId) return;

  const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
  const isKonvaShape = konvaShapes.some((s) => s.id === selectedNodeId);
  const isConnection = connections.some((c) => c.id === selectedNodeId);

  if (isReactShape) {
    setReactShapes((prev) =>
      prev.map((shape) =>
        shape.id === selectedNodeId ? { ...shape, ...updates } : shape
      )
    );
  } else if (isKonvaShape) {
    debouncedUpdateShape([selectedNodeId, updates]);
  } else if (isConnection) {
    updateConnection(selectedNodeId, updates);
  }

  setHasChanges(true);
}, [selectedNodeId, debouncedUpdateShape, reactShapes, konvaShapes, connections, updateConnection, setReactShapes]);

  // Shape creation with immediate save
  const handleAddShape = useCallback((type: Tool) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    handleInteractionStart();
    const safePosition = position ?? { x: 0, y: 0 }; 

    const center = {
      x: stage.width() / 2 / scale - safePosition.x / scale,
      y: stage.height() / 2 / scale - safePosition.y / scale,
    };

    console.log("📝 Adding shape:", { type, center });
    addShape(type, undoRedoAddAction);

    if (currentBoardId && !isTemporaryBoard && user) {
      console.log("💾 Immediate save for new shape:", { type });
      triggerSave({
        reactShapes,
        konvaShapes,
        stageFrames,
        images,
        connections,
        lines,
        scale,
        position,
      }, true);
      setHasChanges(false); // Reset after immediate save
    }
    setTimeout(handleInteractionEnd, 100);
  }, [stageRef, scale, position, addShape, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, handleInteractionStart, handleInteractionEnd,setReactShapes]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      handleInteractionStart();
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          console.log("📸 Adding image:", { src });
          addImage(src, undoRedoAddAction);
          if (currentBoardId && !isTemporaryBoard && user) {
            console.log("💾 Immediate save for new image");
            triggerSave({
              reactShapes,
              konvaShapes,
              stageFrames,
              images,
              connections,
              lines,
              scale,
              position,
            }, true);
            setHasChanges(false); // Reset after immediate save
          }
        }
        setTimeout(handleInteractionEnd, 100);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [addImage, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, handleInteractionStart, handleInteractionEnd]);

  // Close without save
  const handleCloseWithoutSave = useCallback(async () => {
    try {
      await deleteBoard(currentBoardId);
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  }, [currentBoardId]);

  // Enhanced delete function
  const handleDeleteShape = useCallback((id: string) => {
    console.log('🗑️ Keyboard delete triggered for:', id, {
      reactShapes: reactShapes.find(s => s.id === id),
      konvaShapes: konvaShapes.find(s => s.id === id),
      images: images.find(s => s.id === id),
      connections: connections.find(s => s.id === id),
      stageFrames: stageFrames.find(s => s.id === id)
    });
    
    const allShapes = [...reactShapes, ...konvaShapes, ...images, ...connections, ...stageFrames];
    const shapeToDelete = allShapes.find(shape => shape.id === id);
    
    if (shapeToDelete) {
      let actionType: 
          | 'delete-react-shape' 
          | 'delete-konva-shape' 
          | 'delete-image' 
          | 'delete-connection' 
          | 'delete-stage-frame';

        if (reactShapes.find(s => s.id === id)) {
          actionType = 'delete-react-shape';
        } else if (konvaShapes.find(s => s.id === id)) {
          actionType = 'delete-konva-shape';
        } else if (images.find(s => s.id === id)) {
          actionType = 'delete-image';
        } else if (connections.find(s => s.id === id)) {
          actionType = 'delete-connection';
        } else if (stageFrames.find(s => s.id === id)) {
          actionType = 'delete-stage-frame';
        } else {
          // If it's an unknown shape type, log error and use a safe fallback
          console.warn('Unknown shape type for deletion, using delete-konva-shape as fallback');
          actionType = 'delete-konva-shape';
        }
    
    console.log('🗑️ Actually deleting shape:', id);
    deleteShape(id);
    if (currentBoardId && !isTemporaryBoard && user) {
      console.log("💾 Immediate save for shape deletion:", { id });
      triggerSave({
        reactShapes,
        konvaShapes,
        stageFrames,
        images,
        connections,
        lines,
        scale,
        position,
      }, true);
      setHasChanges(false); // Reset after immediate save
    }
  }
  }, [reactShapes, konvaShapes, images, connections, stageFrames, deleteShape, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, scale, position]);

  // Enhanced tool change handler
  const handleToolChangeWithAutoCreate = useCallback((tool: Tool | null) => {
    console.log('🔧 Tool change:', tool);
    toolHandlers.handleToolChange(tool);
    setActiveTool(tool);
    
    if (tool === 'text' || tool === 'stickyNote') {
      setTimeout(() => {
        console.log('📝 Auto-creating shape from keyboard shortcut:', tool);
        handleAddShape(tool);
      }, 100);
    }
  }, [toolHandlers.handleToolChange, setActiveTool, handleAddShape,toolHandlers]);

  // Calculate viewport center
  const calculateViewportCenter = useCallback(() => {
    if (!stageRef.current) return { x: 100, y: 100 };
    
    const stage = stageRef.current;
    const stageWidth = stage.width();
    const stageHeight = stage.height();
    
    return {
      x: (stageWidth / 2 - position.x) / scale,
      y: (stageHeight / 2 - position.y) / scale
    };
  }, [scale, position, stageRef]);

  const handleAddImageFromRecommendations = useCallback((imageUrl: string) => {
    handleInteractionStart();
    const viewportCenter = calculateViewportCenter();
    console.log('🎯 Adding image from recommendations at:', viewportCenter);
    
    addImage(imageUrl, undoRedoAddAction, viewportCenter);
    if (currentBoardId && !isTemporaryBoard && user) {
      console.log("💾 Immediate save for recommendation image");
      triggerSave({
        reactShapes,
        konvaShapes,
        stageFrames,
        images,
        connections,
        lines,
        scale,
        position,
      }, true);
      setHasChanges(false); // Reset after immediate save
    }
    setTimeout(handleInteractionEnd, 100);
  }, [calculateViewportCenter, addImage, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, handleInteractionStart, handleInteractionEnd]);

  // Stage dimensions
  const handleApplyStage = useCallback(() => {
    console.log('🎯 Creating stage frame:', tempDimensions);
    
    if (tempDimensions.width > 0 && tempDimensions.height > 0) {
      handleInteractionStart();
      const viewportCenter = calculateViewportCenter();
      
      const stageFrameId = addStageFrame(
        tempDimensions.width, 
        tempDimensions.height, 
        undoRedoAddAction,
        viewportCenter
      );
      console.log('✅ Stage frame created:', stageFrameId);
      
      if (currentBoardId && !isTemporaryBoard && user) {
        console.log("💾 Immediate save for stage frame");
        triggerSave({
          reactShapes,
          konvaShapes,
          stageFrames,
          images,
          connections,
          lines,
          scale,
          position,
        }, true);
        setHasChanges(false); // Reset after immediate save
      }
      setTempDimensions(defaultStageDimensions);
      setTimeout(handleInteractionEnd, 100);
    } else {
      console.log('❌ Invalid stage dimensions');
    }
  }, [tempDimensions, addStageFrame, setTempDimensions, undoRedoAddAction, calculateViewportCenter, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, handleInteractionStart, handleInteractionEnd]);

  // Keyboard shortcuts
  const keyboardShortcuts = useKeyboardShortcuts({
    selectedNodeId,
    deleteShape: handleDeleteShape,
    setSelectedNodeId,
    activeTool,
    setActiveTool: (tool: Tool | null) => {
      console.log('🔧 Keyboard tool change:', tool);
      handleToolChangeWithAutoCreate(tool);
    },
    handleToolChange: handleToolChangeWithAutoCreate,
    addShape: handleAddShape,
    undo,
    redo,
    handleZoomIn,
    handleZoomOut,
    isEditingText: false,
  });

  return (
    <>
      <div className="relative w-screen h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
        <BoardHeader
          boardInfo={boardInfo}
          isTemporaryBoard={isTemporaryBoard}
          currentBoardId={currentBoardId}
          showSaveModal={showSaveModal}
          setShowSaveModal={setShowSaveModal}
          handleCloseWithoutSave={handleCloseWithoutSave}
          onAddImageFromRecommendations={handleAddImageFromRecommendations}
          onPlayVideo={openVideo}
          boardElements={{
            reactShapes,
            konvaShapes,
            stageFrames,
            images,
            connections
          }}
        />
        <Toolbar
          activeTool={activeTool}
          drawingMode={drawingMode}
          tempDimensions={tempDimensions}
          handleToolChange={handleToolChangeWithAutoCreate}
          setDrawingMode={setDrawingMode}
          addShape={handleAddShape}
          setTempDimensions={setTempDimensions}
          onImageUpload={handleImageUpload}
          handleApplyStage={handleApplyStage}
          undo={undo}
          redo={redo}
        />
        <FormattingToolbar
          selectedShape={selectedShape}
          onChange={handleFormattingToolbarUpdate}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
        />
        <div className={cn(
          "absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4",
          "bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-xl border border-gray-200/80",
          "transition-all duration-300 hover:shadow-2xl"
        )}>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleZoomOut}
              className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-300 hover:scale-110"
              title="Zoom Out"
            >
              <Image src="/image/connect-nodes2.svg" alt="zoom-out" width={20} height={20} className="w-5 h-5 transition-transform duration-300" />
            </button>
            <div className="flex items-center gap-2 min-w-[80px] justify-center">
              <span className="text-sm font-medium text-gray-700 bg-gray-100/80 px-2 py-1 rounded-lg">
                {Math.round(scale * 100)}%
              </span>
            </div>
           <button 
            onClick={handleZoomIn}
            className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-300 hover:scale-110"
            title="Zoom In"
          >
            <Image src="/image/add-icon.svg" alt="zoom-in" width={20} height={20} className="w-5 h-5 transition-transform duration-300" />
          </button>
          </div>
          <div className="w-px h-6 bg-gray-300/80"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={boardState.actions.length === 0}
              className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-300 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              title="Undo"
            >
              <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={boardState.undoneActions.length === 0}
              className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-300 hover:scale-110 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
              title="Redo"
            >
              <svg className="w-5 h-5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
        <StageComponent
          key={`stage-${stageKey}`}
          stageRef={stageRef}
          trRef={trRef}
          scale={scale}
          position={position}
          activeTool={activeTool}
          lines={lines}
          shapes={konvaShapes}
          reactShapes={reactShapes}
          stageFrames={stageFrames}
          images={images}
          connections={connections}
          selectedNodeId={selectedNodeId}
          stageInstance={stageInstance}
          setStageFrames={setStageFrames}
          handleWheel={toolHandlers.handleWheel}
          handleMouseDown={toolHandlers.handleMouseDown}
          handleMouseUp={toolHandlers.handleMouseUp}
          handleMouseMove={toolHandlers.handleMouseMove}
          handleTouchStart={toolHandlers.handleTouchStart}
          handleTouchEnd={toolHandlers.handleTouchEnd}
          handleTouchMove={toolHandlers.handleTouchMove}
          setSelectedNodeId={setSelectedNodeId}
          setReactShapes={setReactShapes}
          setShapes={setKonvaShapes}
          setImages={setImages}
          setConnections={setConnections}
          updateShape={handleStageShapeUpdate}
          setStageInstance={setStageInstance}
          updateConnection={updateConnection}
          onDelete={handleDeleteShape}
        />
      </div>
      <CreateBoard 
        open={showSetupDialog}
        onOpenChange={(open) => setShowSetupDialog(open)} 
        boardId={params.boardId as string}
        onBoardUpdate={(updates) => {
          console.log("🔄 Board info updated from CreateBoard:", updates);
          setBoardInfo({
            title: updates.title,
            category: updates.category
          });
        }}
      />
      <VideoPlayerModal
        videoId={videoId || ''}
        title={videoTitle}
        isOpen={isVideoOpen}
        onClose={closeVideo}
      />
    </>
  );
};

export default BoardPage;