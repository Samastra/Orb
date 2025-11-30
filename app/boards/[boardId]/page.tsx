"use client";

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Konva from "konva";
import { useUser } from "@clerk/nextjs";
import { useAutoSave } from '@/hooks/useAutoSave';
import { useParams } from "next/navigation";
import { ReactShape, Tool,ImageShape } from "@/types/board-types";
import { defaultStageDimensions } from "@/constants/tool-constants";
import { Connection } from "@/hooks/useBoardState";
// Components
import Toolbar from "@/components/Toolbar";
import BoardHeader from "@/components/BoardHeader";
import StageComponent from "@/components/StageComponent";
import CreateBoard from "@/components/createBoard";
import { deleteBoard } from "@/lib/actions/board-actions";
import VideoPlayerModal from '@/components/VideoPlayerModal';

// import QuillTextEditor from "@/components/QuillTextEditor";
// Hooks
import {KonvaShape} from "@/hooks/useShapes";
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useBoardState } from "@/hooks/useBoardState";
import { useKonvaTools } from "@/hooks/useKonvaTools";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import FormattingToolbar from "@/components/FormattingToolbar";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWebsitePlayer } from '@/hooks/useWebsitePlayer';
import WebsitePlayerModal from '@/components/WebsitePlayerModal';
import { useLayoutEffect } from 'react';
// Utils
import { fetchBoard } from "@/lib/actions/board-actions";
// import { useWindowSize } from "@/hooks/useWindowSize";
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
  
 const [editingId, setEditingId] = useState<string | null>(null);
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
    isConnecting, reactShapes, konvaShapes, stageFrames, images, connections, selectedNodeIds, stageInstance, tempDimensions,
    showSaveModal, isTemporaryBoard, currentBoardId, showSetupDialog, boardInfo,
    setActiveTool, setDrawingMode, setLines, setConnectionStart, setTempConnection,
    setIsConnecting, setReactShapes, setKonvaShapes, setStageFrames, setImages, setConnections, setSelectedNodeIds, setStageInstance,
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

  const {
  websiteUrl,
  websiteTitle,
  isWebsiteOpen,
  openWebsite,
  closeWebsite
} = useWebsitePlayer();

    const [editingText, setEditingText] = useState<{
  isEditing: boolean;
  position: { x: number; y: number };
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  width: number;
  onSave: (text: string) => void;
} | null>(null);

// Add handler for text editing
const handleStartTextEditing = useCallback((textProps: {
  position: { x: number; y: number };
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  width: number;
  onSave: (text: string) => void;
}) => {
  setEditingText({
    isEditing: true,
    ...textProps
  });
}, []);

const handleFinishTextEditing = useCallback(() => {
  setEditingText(null);
}, []);

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
    selectedNodeIds, 
    setActiveTool, 
    setDrawingMode, 
    setLines, 
    setConnectionStart, 
    setTempConnection, 
    setIsConnecting, 
    setSelectedNodeIds, 
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

 

  // Track interactions for scaling, dragging, and adding elements
  const handleInteractionStart = useCallback(() => {
  console.log("🖱️ Interaction started (scaling/dragging/adding)");
  setIsInteracting(true);
  setHasChanges(true);
}, [setIsInteracting]);

  

    // Unified shape updater — replaces debouncedUpdateShape completely
// Unified shape updater — type-safe version
// Unified shape updater — simplified type-safe version
const updateAnyShape = useCallback((
  id: string,
  updates: Partial<ReactShape | KonvaShape | ImageShape | Connection>
) => {
  let updated = false;

  // 1. Define ALL properties we want to save to the database
  const allowedKeys = [
    'x', 'y', 'rotation', 'fill', 'stroke', 'strokeWidth',
    'width', 'height',             // Rects, Images, Text, Sticky
    'radius',                      // Circles, Triangles
    'radiusX', 'radiusY',          // Ellipses
    'points',                      // Arrows
    'sides',                       // Triangles
    'pointerLength', 'pointerWidth', // Arrows
    'fontSize', 'fontFamily', 'text', 'fontWeight', 'fontStyle', 'align', // Text
    'from', 'to', 'cp1x', 'cp1y', 'cp2x', 'cp2y' // Connections
  ];

  // 2. Create the safe update object dynamically
  const safeUpdates: Record<string, unknown> = {};

  Object.keys(updates).forEach(key => {
    if (allowedKeys.includes(key)) {
     
       safeUpdates[key] = updates[key as keyof typeof updates];
    }
  });

  // 3. Apply updates to the correct state array
  
  // React-managed shapes (text, sticky notes)
  if (reactShapes.some(s => s.id === id)) {
    setReactShapes(prev => prev.map(s => s.id === id ? { ...s, ...safeUpdates } : s));
    updated = true;
  }

  // Konva-managed shapes (rect, circle, arrow, etc)
  if (konvaShapes.some(s => s.id === id)) {
    setKonvaShapes(prev => prev.map(s => s.id === id ? { ...s, ...safeUpdates } : s));
    updated = true;
  }

  // Images
  if (images.some(i => i.id === id)) {
    setImages(prev => prev.map(i => i.id === id ? { ...i, ...safeUpdates } : i));
    updated = true;
  }

  // Stage frames
  if (stageFrames.some(f => f.id === id)) {
    setStageFrames(prev => prev.map(f => f.id === id ? { ...f, ...safeUpdates } : f));
    updated = true;
  }

  // Connections
  if (connections.some(c => c.id === id)) {
    updateConnection(id, safeUpdates);
    updated = true;
  }

  if (updated) setHasChanges(true);
}, [reactShapes, konvaShapes, images, stageFrames, connections, setReactShapes, setKonvaShapes, setImages, setStageFrames, updateConnection]);

    const handleStageShapeUpdate = useCallback((id: string, attrs: Partial<ShapeAttributes>) => {
  if (!id) return;
  updateAnyShape(id, attrs);
}, [updateAnyShape]);

  // Add this function near your other handlers (around line 200-250)
const copyCleanText = async () => {
  try {
    // Get all text content from the whiteboard
    const allTextElements = [
      ...reactShapes.filter(shape => shape.type === 'text'),
      ...konvaShapes.filter(shape => shape.type === 'text'),
      // Add other text sources as needed
    ];

    // Extract and clean text
    const allText = allTextElements
      .map(element => {
        let text = '';
        if ('text' in element) {
          text = element.text as string;
        }
        // Clean the text - remove HTML tags and unwanted content
        return text
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/Tip:.*$/g, '') // Remove "Tip: Copy text normally..." lines
          .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
          .trim();
      })
      .filter(text => text.length > 0) // Remove empty strings
      .join('\n\n'); // Separate different text elements with blank lines

    if (allText.length === 0) {
      alert('No text found on the whiteboard to copy.');
      return;
    }

    // Copy to clipboard
    await navigator.clipboard.writeText(allText);
    
    // Optional: Show success feedback
    console.log('✅ Clean text copied to clipboard:', allText);
    alert('Clean text copied to clipboard!');
    
  } catch (error) {
    console.error('❌ Failed to copy text:', error);
    alert('Failed to copy text. Please try again.');
  }
};

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

const handleTextCreate = useCallback((position: { x: number; y: number }) => {
    console.log('🎯 Creating text at position:', position);
    
    const shapeId = `text-${crypto.randomUUID()}`;
    
    const newTextShape: ReactShape = {
      id: shapeId,
      type: 'text',
      x: position.x,
      y: position.y,
      text: "", // Start empty (cursor only)
      fontSize: 24,
      fill: "#000000",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: "400",
      fontStyle: "normal",
      align: "left",
      draggable: true,
      width: 200, // Default width
      rotation: 0,
    };
    
    setReactShapes(prev => [...prev, newTextShape]);
    
    // Select the node
    setSelectedNodeIds([shapeId]); 
    
    // CRITICAL: Immediately enter editing mode
    setEditingId(shapeId); 
    
    // CRITICAL: Switch back to select tool immediately (Miro behavior)
    setActiveTool("select"); 
    
    console.log('✅ Text created and set to editing mode');
  }, [setReactShapes, setSelectedNodeIds, setActiveTool]);

    // AUTO-SAVE ON ANY POSITION CHANGE — NEVER MISS A DRAG AGAIN


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

  // FINAL WORKING LOADING CODE — COPY-PASTE THIS EXACTLY
// In page.tsx - REPLACE the entire useLayoutEffect loading code with this:
useLayoutEffect(() => {
  if (hasLoaded || !currentBoardId || isTemporaryBoard) return;

  const loadSavedElements = async () => {
    try {
      console.log("🔄 LOADING BOARD ELEMENTS...");
      
      const elements = await loadBoardElements(currentBoardId);
      
      console.log("📥 LOADED FROM DB:", {
        scale: elements.stageState?.scale,
        position: elements.stageState?.position,
        shapes: {
          react: elements.reactShapes?.length,
          konva: elements.konvaShapes?.length,
          frames: elements.stageFrames?.length,
          images: elements.images?.length,
          connections: elements.connections?.length
        }
      });

      // CRITICAL FIX: Apply camera state to the actual Konva stage FIRST
      if (elements.stageState && stageRef.current) {
        console.log("🎯 APPLYING CAMERA TO STAGE:", elements.stageState);
        
        // Update React state
        boardState.setScale(elements.stageState.scale);
        boardState.setPosition(elements.stageState.position);
        
        // CRITICAL: Directly update the Konva stage instance
        const stage = stageRef.current;
        stage.scale({ x: elements.stageState.scale, y: elements.stageState.scale });
        stage.position(elements.stageState.position);
        stage.batchDraw(); // Force immediate redraw
        
        console.log("✅ CAMERA APPLIED TO STAGE");
      }

      // CRITICAL FIX: Wait for camera to be applied, THEN load shapes
      setTimeout(() => {
        console.log("📝 LOADING SHAPES AFTER CAMERA...");
        
        // Clear existing state first to prevent conflicts
        setReactShapes([]);
        setKonvaShapes([]);
        setStageFrames([]);
        setImages([]);
        setConnections([]);
        setLines([]);
        
        // Then set the loaded shapes
        setReactShapes(elements.reactShapes || []);
        setKonvaShapes(elements.konvaShapes || []);
        setStageFrames(elements.stageFrames || []);
        setImages(elements.images || []);
        setConnections(elements.connections || []);
        setLines(elements.lines || []);
        
        setHasLoaded(true);
        console.log("✅ BOARD FULLY LOADED");
      }, 50); // Small delay to ensure camera is applied

    } catch (error) {
      console.error("❌ LOAD FAILED:", error);
      setHasLoaded(true);
    }
  };

  loadSavedElements();
}, [currentBoardId, isTemporaryBoard, hasLoaded, boardState, setReactShapes, setKonvaShapes, setStageFrames, setImages, setConnections, setLines]); // Force-save drags (1s debounce)

  // In page.tsx - Add this right after the loading useLayoutEffect
useEffect(() => {
  // Force stage to update when camera changes
  if (stageRef.current) {
    const stage = stageRef.current;
    stage.scale({ x: scale, y: scale });
    stage.position(position);
    stage.batchDraw();
    console.log("🔄 STAGE UPDATED WITH CAMERA:", { scale, position });
  }
}, [scale, position]);


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

  // Memoize selected shape - UPDATED FOR MULTI-SELECT
  const selectedShape = useMemo(() => {
    if (!selectedNodeIds || selectedNodeIds.length === 0) return null;
    
    // For multi-select, return the first selected shape for backward compatibility
    // You might want to update your FormattingToolbar to handle multiple shapes
    const firstSelectedId = selectedNodeIds[0];
    
    const reactShape = reactShapes.find((s) => s.id === firstSelectedId);
    if (reactShape) return reactShape;
    
    const konvaShape = konvaShapes.find((s) => s.id === firstSelectedId);
    if (konvaShape) return konvaShape;
    
    const imageShape = images.find((img) => img.id === firstSelectedId);
    if (imageShape) return imageShape;
    
    const connectionShape = connections.find((conn) => conn.id === firstSelectedId);
    return connectionShape || null;
  }, [selectedNodeIds, reactShapes, konvaShapes, images, connections]);

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


  // Handler for StageComponent (no immediate save)


  // Formatting toolbar update (no immediate save) - UPDATED FOR MULTI-SELECT
  const handleFormattingToolbarUpdate = useCallback((updates: FormattingUpdates) => {
  if (!selectedNodeIds || selectedNodeIds.length === 0) return;

      selectedNodeIds.forEach(id => {
        updateAnyShape(id, updates);
      });
    }, [selectedNodeIds, updateAnyShape]);

  // Shape creation with immediate save
  const handleAddShape = useCallback((type: Tool) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    handleInteractionStart();

    // 1. LIVE CALCULATION (The Fix)
    // We calculate exactly where the center of your screen is in "World Coordinates"
    // Formula: (ScreenHalfWidth - CameraPanX) / ZoomLevel
    const center = {
      x: (stage.width() / 2 - stage.x()) / stage.scaleX(),
      y: (stage.height() / 2 - stage.y()) / stage.scaleY(),
    };

    console.log("🎯 Live Center Calculation:", center);
    
    // 2. PASS TO STATE
    // Pass this calculated center as the 3rd argument
    addShape(type, undoRedoAddAction, center); 

    if (currentBoardId && !isTemporaryBoard && user) {
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
      setHasChanges(false);
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

  // Close without save
  const handleCloseWithoutSave = useCallback(async () => {
    try {
      await deleteBoard(currentBoardId);
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  }, [currentBoardId]);

  // Enhanced delete function - UPDATED FOR MULTI-SELECT
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
    
    // if (tool === 'text' || tool === 'stickyNote') {
    //   setTimeout(() => {
    //     console.log('📝 Auto-creating shape from keyboard shortcut:', tool);
    //     handleAddShape(tool);
    //   }, 100);
    // }
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

  const autoFitContent = useCallback(() => {
  if (!stageRef.current) return;

  const stage = stageRef.current;
  const allFrames = [...stageFrames, ...konvaShapes.filter(s => s.type === 'stage')];

  // If no frames yet, just zoom out a bit for comfort
  if (allFrames.length === 0) {
    boardState.setScale(0.7);
    return;
  }

  // Find bounding box of all stage frames
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  allFrames.forEach(frame => {

    if (frame.width === undefined || frame.height === undefined) return;

    minX = Math.min(minX, frame.x);
    minY = Math.min(minY, frame.y);
    maxX = Math.max(maxX, frame.x + frame.width);
    maxY = Math.max(maxY, frame.y + frame.height);
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const padding = 200; // pixels of breathing room on each side
  const availableWidth = stage.width() - 2 * padding;
  const availableHeight = stage.height() - 2 * padding;

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;
  const newScale = Math.min(scaleX, scaleY, 0.9); // never zoom in past 90%

  const finalScale = Math.max(newScale, 0.3); // don’t go too tiny

  // Center the content
  const centerX = minX + contentWidth / 2;
  const centerY = minY + contentHeight / 2;

  const newPosX = stage.width() / 2 - centerX * finalScale;
  const newPosY = stage.height() / 2 - centerY * finalScale;

  boardState.setScale(finalScale);
  boardState.setPosition({ x: newPosX, y: newPosY });

  console.log("Auto-fit applied:", { finalScale: finalScale.toFixed(2), frames: allFrames.length });
}, [stageRef, stageFrames, konvaShapes, boardState]);

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


        if (stageFrames.length === 0) {  // ← this will be 0 before addStageFrame runs
    
      }
          
    } else {
      console.log('❌ Invalid stage dimensions');
    }
  }, [tempDimensions, addStageFrame, setTempDimensions, undoRedoAddAction,autoFitContent, calculateViewportCenter, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, handleInteractionStart, handleInteractionEnd]);



  // Inside BoardPage component, after your other useCallbacks


  // Keyboard shortcuts - UPDATED FOR MULTI-SELECT

  const keyboardShortcuts = useKeyboardShortcuts({
    selectedNodeIds, // FIXED: Now matches the updated interface
    deleteShape: handleDeleteShape,
    setSelectedNodeIds, // FIXED: Now matches the updated interface
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
            stageRef={stageRef}
            onPlayVideo={openVideo}
            onOpenWebsite={openWebsite}
            boardElements={{
              reactShapes,
              konvaShapes,
              stageFrames,
              images,
              connections,
              stageState: { scale, position }
            }}
            onBoardUpdate={(updates) => {
              console.log("🔄 Board title updated from header:", updates);
              setBoardInfo({
                title: updates.title,
                category: updates.category
              });
            }}
            onCopyCleanText={copyCleanText}
            scale={scale}        // ← Add this
            position={position}  // ← Add this
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
              <Image src="/image/minus.png" alt="zoom-out" width={20} height={20} className="w-5 h-5 transition-transform duration-300" />
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
          hasLoaded={hasLoaded}
          shapes={konvaShapes}
          reactShapes={reactShapes}
          stageFrames={stageFrames}
          images={images}
          connections={connections}
          editingId={editingId}
          setEditingId={setEditingId}
          selectedNodeIds={selectedNodeIds}
          stageInstance={stageInstance}
          onTextCreate={handleTextCreate}
          setStageFrames={setStageFrames}
          handleWheel={toolHandlers.handleWheel}
          handleMouseDown={toolHandlers.handleMouseDown}
          handleMouseUp={toolHandlers.handleMouseUp}
          handleMouseMove={toolHandlers.handleMouseMove}
          handleTouchStart={toolHandlers.handleTouchStart}
          handleTouchEnd={toolHandlers.handleTouchEnd}
          handleTouchMove={toolHandlers.handleTouchMove}
          setSelectedNodeIds={setSelectedNodeIds}
          setReactShapes={setReactShapes}
          setShapes={setKonvaShapes}
          setImages={setImages}
          setConnections={setConnections}
          updateShape={handleStageShapeUpdate}
          setStageInstance={setStageInstance}
          updateConnection={updateConnection}
          onDelete={handleDeleteShape}
          setActiveTool={setActiveTool}
          handleStartTextEditing={handleStartTextEditing}
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

      <WebsitePlayerModal
        url={websiteUrl || ''}
        title={websiteTitle}
        isOpen={isWebsiteOpen}
        onClose={closeWebsite}
      />

         {/* {editingText && (
      <QuillTextEditor
        isOpen={editingText.isEditing}
        position={editingText.position}
        initialText={editingText.text}
        fontSize={editingText.fontSize}
        fontFamily={editingText.fontFamily}
        color={editingText.color}
        width={editingText.width}
        onSave={editingText.onSave}
        onCancel={handleFinishTextEditing}
      />
    )} */}

    </>
  );
};

export default BoardPage;