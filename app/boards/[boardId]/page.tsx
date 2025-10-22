"use client";

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import Konva from "konva";
import { useUser } from "@clerk/nextjs";
import { useAutoSave } from '@/hooks/useAutoSave';
import { useParams } from "next/navigation";
import { Tool, ReactShape } from "@/types/board-types";
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

type Line = { tool: "brush" | "eraser"; points: number[] };
// Fix text rendering
if (typeof window !== 'undefined') {
  (Konva as any)._fixTextRendering = true;
}

// Simple debounce without complex types
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Utility for deep equality comparison
const areEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
      if (obj1[key].length !== obj2[key].length) return false;
      for (let i = 0; i < obj1[key].length; i++) {
        if (!areEqual(obj1[key][i], obj2[key][i])) return false;
      }
    } else if (!areEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
};

const BoardPage = () => {
  const params = useParams();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  
  const [stageKey, setStageKey] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false); // Track active user interactions
  const [hasChanges, setHasChanges] = useState(false); // Track if board has unsaved changes
  const [hasLoaded, setHasLoaded] = useState(false); // Track if board elements have been loaded

  const {
    videoId,
    videoTitle, 
    isVideoOpen,
    openVideo,
    closeVideo
  } = useVideoPlayer();

  // State management
  const boardState = useBoardState();
  
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
    updateShape,
    deleteShape,
    addKonvaShape,
    addStageFrame,
    addImage,
    addConnection,
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
  const debouncedTriggerSave = useDebounce(triggerSave, 10000); // Increased to 10s

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
    setHasChanges(true); // Mark changes on interaction
  }, []);

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
      setHasChanges(false); // Reset after queuing save
    }
  }, [currentBoardId, isTemporaryBoard, user, debouncedTriggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, hasChanges]);

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
    return () => {
      if (trRef.current) {
        trRef.current.nodes([]);
        trRef.current.destroy();
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
  }, [stageRef, boardState.setScale, handleInteractionStart, handleInteractionEnd]);

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
  }, [stageRef, boardState.setScale, handleInteractionStart, handleInteractionEnd]);

  const debouncedUpdateShape = useDebounce((shapeId: string, updates: Partial<any>) => {
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

    setHasChanges(true); // Mark changes
  }, 50);

  // Handler for StageComponent (no immediate save)
  const handleStageShapeUpdate = useCallback(
    (id: string, attrs: Partial<any>) => {
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
        debouncedUpdateShape(id, attrs);
      } else if (isConnection) {
        updateConnection(id, attrs);
      }

      setHasChanges(true); // Mark changes
    },
    [debouncedUpdateShape, reactShapes, konvaShapes, connections, updateConnection]
  );

  // Formatting toolbar update (no immediate save)
  const handleFormattingToolbarUpdate = useCallback(
    (updates: Record<string, any>) => {
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
        debouncedUpdateShape(selectedNodeId, updates);
      } else if (isConnection) {
        updateConnection(selectedNodeId, updates);
      }

      setHasChanges(true); // Mark changes
    },
    [selectedNodeId, debouncedUpdateShape, reactShapes, konvaShapes, connections, updateConnection]
  );

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
  }, [stageRef, scale, position, addShape, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, handleInteractionStart, handleInteractionEnd]);

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

  // Handle connection deletion
  const handleConnectionDelete = useCallback((connectionId: string) => {
    console.log('🗑️ Deleting connection:', connectionId);
    removeConnection(connectionId);
    undoRedoAddAction({
      type: "delete-connection",
      connectionId: connectionId
    });
    if (currentBoardId && !isTemporaryBoard && user) {
      console.log("💾 Immediate save for connection deletion:", { connectionId });
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
  }, [removeConnection, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position]);

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
      let actionType: any;
      
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
        actionType = 'delete-shape';
      }
      
      console.log('💾 Recording deletion action:', actionType, shapeToDelete);
      undoRedoAddAction({
        type: actionType,
        data: shapeToDelete
      });
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
  }, [toolHandlers.handleToolChange, setActiveTool, handleAddShape]);

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

  const handleAddImageFromRecommendations = useCallback((imageUrl: string, altText: string) => {
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
              <img src="/image/connect-nodes2.svg" alt="zoom-out" className="w-5 h-5 transition-transform duration-300" />
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
              <img src="/image/add-icon.svg" alt="zoom-in" className="w-5 h-5 transition-transform duration-300" />
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