"use client";

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Konva from "konva";
import { useUser } from "@clerk/nextjs";
import { useAutoSave } from '@/hooks/useAutoSave';
import { useParams } from "next/navigation";
import { ReactShape, Tool, ImageShape, Action } from "@/types/board-types";
import { defaultStageDimensions } from "@/constants/tool-constants";
import { Connection } from "@/hooks/useBoardState";
// Components
import Toolbar from "@/components/Toolbar";
import BoardHeader from "@/components/BoardHeader";
import StageComponent from "@/components/StageComponent";
import CreateBoard from "@/components/createBoard";
import { deleteBoard } from "@/lib/actions/board-actions";
import VideoPlayerModal from '@/components/VideoPlayerModal';
import { generateLayoutFromText,findSafePosition } from "@/lib/layout-engine";
import { KonvaShape } from "@/hooks/useShapes";
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { useBoardState } from "@/hooks/useBoardState";
import { useKonvaTools } from "@/hooks/useKonvaTools";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import FormattingToolbar from "@/components/FormattingToolbar";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWebsitePlayer } from '@/hooks/useWebsitePlayer';
import WebsitePlayerModal from '@/components/WebsitePlayerModal';
import { useLayoutEffect } from 'react';
import { fetchBoard } from "@/lib/actions/board-actions";
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
}

interface FormattingUpdates {
  fill?: string;
  stroke?: string;
  fontSize?: number;
  fontFamily?: string;
}

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

const BoardPage = () => {
  const params = useParams();

  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false); 
  const [hasLoaded, setHasLoaded] = useState(false); 
  const [isInteracting, setIsInteracting] = useState(false);
  const {
    videoId,
    videoTitle, 
    isVideoOpen,
    openVideo,
    closeVideo
  } = useVideoPlayer();

    const {
  websiteUrl,
  websiteTitle,
  isWebsiteOpen,
  openWebsite,
  closeWebsite
} = useWebsitePlayer();

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
    bringForward, sendBackward, bringToFront, sendToBack,    addShape, deleteShape, addStageFrame, addImage, updateConnection, removeConnection,
  } = boardState;

  const allShapes = useMemo(() => 
    [...konvaShapes, ...reactShapes, ...images, ...stageFrames, ...connections], 
  [konvaShapes, reactShapes, images, stageFrames, connections]);

  // NEW: Filtered list for tools that expect shapes with dimensions (excludes connections)
  const shapesForTools = useMemo(() => 
    [...konvaShapes, ...reactShapes, ...images, ...stageFrames], 
  [konvaShapes, reactShapes, images, stageFrames]);

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
    updateConnection,
    boardState.addShape,
    shapesForTools // FIX: Passing only shapes, not connections
  );


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

  const { user } = useUser();
  const { triggerSave } = useAutoSave(currentBoardId, isTemporaryBoard, user?.id);

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

  const handleInteractionStart = useCallback(() => {

  setIsInteracting(true);
  setHasChanges(true);
}, [setIsInteracting]);

const updateAnyShape = useCallback((
  id: string,
  updates: Partial<ReactShape | KonvaShape | ImageShape | Connection>
) => {
  let updated = false;

  const allowedKeys = [
    'x', 'y', 'rotation', 'fill', 'stroke', 'strokeWidth',
    'width', 'height',            
    'radius',                     
    'radiusX', 'radiusY',         
    'points',                     
    'sides',                      
    'pointerLength', 'pointerWidth',
    'fontSize', 'fontFamily', 'text', 'fontWeight', 'fontStyle', 'align', 
    'from', 'to', 'cp1x', 'cp1y', 'cp2x', 'cp2y',
    'cornerRadius',               
    'backgroundColor', 'textColor', 
    'textDecoration',
    'name', 'isLocked'
  ];

  const safeUpdates: Record<string, unknown> = {};

  Object.keys(updates).forEach(key => {
    if (allowedKeys.includes(key)) {
       safeUpdates[key] = updates[key as keyof typeof updates];
    }
  });

  if (reactShapes.some(s => s.id === id)) {
    setReactShapes(prev => prev.map(s => s.id === id ? { ...s, ...safeUpdates } : s));
    updated = true;
  }

  if (konvaShapes.some(s => s.id === id)) {
    setKonvaShapes(prev => prev.map(s => s.id === id ? { ...s, ...safeUpdates } : s));
    updated = true;
  }

  if (images.some(i => i.id === id)) {
    setImages(prev => prev.map(i => i.id === id ? { ...i, ...safeUpdates } : i));
    updated = true;
  }

  if (stageFrames.some(f => f.id === id)) {
    setStageFrames(prev => prev.map(f => f.id === id ? { ...f, ...safeUpdates } : f));
    updated = true;
  }

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

const copyCleanText = async () => {
  try {
    const allTextElements = [
      ...reactShapes.filter(shape => shape.type === 'text'),
      ...konvaShapes.filter(shape => shape.type === 'text'),
    ];

    const allText = allTextElements
      .map(element => {
        let text = '';
        if ('text' in element) {
          text = element.text as string;
        }
        return text
          .replace(/<[^>]*>/g, '') 
          .replace(/Tip:.*$/g, '') 
          .replace(/\n\s*\n/g, '\n') 
          .trim();
      })
      .filter(text => text.length > 0) 
      .join('\n\n'); 

    if (allText.length === 0) {
      alert('No text found on the whiteboard to copy.');
      return;
    }

    await navigator.clipboard.writeText(allText);
    

    alert('Clean text copied to clipboard!');
    
  } catch (error) {
   
    alert('Failed to copy text. Please try again.');
  }
};

  const handleInteractionEnd = useCallback(() => {

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

    
    const shapeId = `text-${crypto.randomUUID()}`;
    
    const newTextShape: ReactShape = {
      id: shapeId,
      type: 'text',
      x: position.x,
      y: position.y,
      text: "",
      fontSize: 24,
      fill: "#000000",
      fontFamily: "Inter, Arial, sans-serif",
      fontWeight: "400",
      fontStyle: "normal",
      align: "left",
      draggable: true,
      width: 200,
      rotation: 0,
    };
    
    setReactShapes(prev => [...prev, newTextShape]);
    
    // NEW: Add creation to Undo History
    undoRedoAddAction({
      type: 'add-react-shape',
      shapeType: 'text', // Added this
      data: newTextShape
      // Removed 'id' to fix type error
    });

    setSelectedNodeIds([shapeId]); 
    setEditingId(shapeId); 
    setActiveTool("select"); 
    
  
  }, [setReactShapes, setSelectedNodeIds, setActiveTool, undoRedoAddAction]);

  useEffect(() => {
    const loadBoardData = async () => {
      try {
      
        const board = await fetchBoard(params.boardId as string);
   
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

useLayoutEffect(() => {
    if (hasLoaded || !currentBoardId || isTemporaryBoard) return;

    const loadSavedElements = async () => {
      try {
       
        const elements = await loadBoardElements(currentBoardId);

        if (stageRef.current) {
          const stage = stageRef.current;

          if (elements.stageState && elements.stageState.scale) {
            
            stage.scale({ x: elements.stageState.scale, y: elements.stageState.scale });
            stage.position(elements.stageState.position);
            boardState.setScale(elements.stageState.scale);
            boardState.setPosition(elements.stageState.position);
          } else {
         
            const defaultScale = 0.4; 
            const centerX = stage.width() / 2;
            const centerY = stage.height() / 2;
            stage.scale({ x: defaultScale, y: defaultScale });
            stage.position({ x: centerX, y: centerY });
            boardState.setScale(defaultScale);
            boardState.setPosition({ x: centerX, y: centerY });
          }
          stage.batchDraw(); 
        }

        setTimeout(() => {
       
          setReactShapes([]);
          setKonvaShapes([]);
          setStageFrames([]);
          setImages([]);
          setConnections([]);
          setLines([]);
          
          setReactShapes(elements.reactShapes || []);
          setKonvaShapes(elements.konvaShapes || []);
          setStageFrames(elements.stageFrames || []);
          setImages(elements.images || []);
          setConnections(elements.connections || []);
          setLines(elements.lines || []);
          
          setHasLoaded(true);
         
        }, 50);

      } catch (error) {
       console.error("❌ LOAD FAILED:", error);
        setHasLoaded(true); 
      }
    };

    loadSavedElements();
  }, [
    currentBoardId, 
    isTemporaryBoard, 
    hasLoaded, 
    boardState, 
    setReactShapes, 
    setKonvaShapes, 
    setStageFrames, 
    setImages, 
    setConnections, 
    setLines
  ]);

useEffect(() => {
  if (stageRef.current) {
    const stage = stageRef.current;
    stage.scale({ x: scale, y: scale });
    stage.position(position);
    stage.batchDraw();
   
  }
}, [scale, position]);


  useEffect(() => {
  const currentTrRef = trRef.current;
  return () => {
    if (currentTrRef) {
      currentTrRef.nodes([]);
      currentTrRef.destroy();
    }
  };
}, []);

  const selectedShape = useMemo(() => {
    if (!selectedNodeIds || selectedNodeIds.length === 0) return null;
    
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

  // --- NEW: Calculate Screen Position for Formatting Toolbar ---
const getSelectedShapeScreenPosition = useCallback(() => {
    if (!selectedShape) return null;
    
    // Default world coordinates
    let x = (selectedShape as any).x || 0;
    let y = (selectedShape as any).y || 0;
    let w = (selectedShape as any).width || 0;
    let h = (selectedShape as any).height || 0; // Capture Height
    
    // Adjust for centered shapes like Circle/Ellipse
    if (selectedShape.type === 'circle') {
       const r = (selectedShape as any).radius || 0;
       x -= r; 
       y -= r;
       w = r * 2;
       h = r * 2; // Circle height
    } else if (selectedShape.type === 'ellipse') {
       const rx = (selectedShape as any).radiusX || 0;
       const ry = (selectedShape as any).radiusY || 0;
       x -= rx;
       y -= ry;
       w = rx * 2;
       h = ry * 2; // Ellipse height
    }

    // Convert World Rect to Screen Rect
    // screen = world * scale + pan
    const screenX = x * scale + position.x;
    const screenY = y * scale + position.y;
    const screenW = w * scale;
    const screenH = h * scale;

    // Return the full Screen Bounding Box
    return {
        x: screenX,
        y: screenY,
        width: screenW,
        height: screenH
    };
  }, [selectedShape, scale, position]);

  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    handleInteractionStart();
    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.min(oldScale * scaleBy, 5);

    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
    
  
    boardState.setScale(newScale);
    setTimeout(handleInteractionEnd, 100); 
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
    
   
    boardState.setScale(newScale);
    setTimeout(handleInteractionEnd, 100); 
  }, [stageRef, boardState.setScale, handleInteractionStart, handleInteractionEnd, boardState]);

  // --- FIX: Formatting Toolbar Undo Support ---
  const handleFormattingToolbarUpdate = useCallback((updates: FormattingUpdates) => {
    if (!selectedNodeIds || selectedNodeIds.length === 0) return;

    // Create Undo Action BEFORE updating
    const actions: Action[] = [];

    selectedNodeIds.forEach(id => {
       const shape = allShapes.find(s => s.id === id);
       if (shape) {
           let type: Action['type'] = 'update-konva-shape'; 
           
           if(shape.type === 'text' || shape.type === 'stickyNote') type = 'update-react-shape';
           else if(shape.type === 'image') type = 'update-image';
           else if(shape.type === 'stage') type = 'update-stage-frame';
           else if(shape.type === 'connection') type = 'update-connection';
           
           // We cast specifically to bypass typescript conditional inference issues, but the types exist now
           actions.push({
               type,
               id,
               prevData: shape,
               newData: { ...shape, ...updates }
           } as Action);

           updateAnyShape(id, updates);
       }
    });

    // Dispatch as batch if multiple, or single
    if (actions.length > 0) {
        if (actions.length === 1) undoRedoAddAction(actions[0]);
        else undoRedoAddAction({ type: 'batch', actions });
    }

  }, [selectedNodeIds, updateAnyShape, allShapes, undoRedoAddAction]);

const handleAddShape = useCallback((type: Tool) => {
  if (!stageRef.current) return;
  const stage = stageRef.current;

  handleInteractionStart();

  // 1. Calculate raw center
  const rawCenter = {
    x: (stage.width() / 2 - stage.x()) / stage.scaleX(),
    y: (stage.height() / 2 - stage.y()) / stage.scaleY(),
  };

  // 2. Find a SAFE spot nearby
  // We assume a standard size of 100x100 for the check, or 200x150 for stickies
  const checkWidth = type === 'stickyNote' ? 200 : 100;
  const checkHeight = type === 'stickyNote' ? 150 : 100;

  const allExisting = [...konvaShapes, ...reactShapes, ...stageFrames, ...images];

  // Calculate top-left from center to start the check
  const startCheckPos = {
      x: rawCenter.x - (checkWidth / 2),
      y: rawCenter.y - (checkHeight / 2)
  };

  const safePos = findSafePosition(startCheckPos, checkWidth, checkHeight, allExisting);

  // 3. Re-center based on the safe top-left corner (because addShape expects center)
  const finalCenter = {
      x: safePos.x + (checkWidth / 2),
      y: safePos.y + (checkHeight / 2)
  };



  addShape(type, undoRedoAddAction, finalCenter); 

  if (type === 'stickyNote' || type === 'text') {
      setActiveTool("select");
  }

  if (currentBoardId && !isTemporaryBoard && user) {
    triggerSave({
      reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position,
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
         
          addImage(src, undoRedoAddAction);
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
        }
        setTimeout(handleInteractionEnd, 100);
      };
      reader.readAsDataURL(file);
    } catch (error) {
     console.error('❌ Error uploading image:', error);
    }
  }, [addImage, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, handleInteractionStart, handleInteractionEnd]);

  const handleCloseWithoutSave = useCallback(async () => {
    try {
      await deleteBoard(currentBoardId);
      window.location.href = "/";
    } catch (error) {
      console.error("❌ Failed to delete board:", error);
    }
  }, [currentBoardId]);

  // --- FIX: Delete Shape Undo Support ---
  const handleDeleteShape = useCallback((id: string) => {

    
    // 1. Find the shape BEFORE deleting it
    const shapeToDelete = allShapes.find(shape => shape.id === id);
    
    if (shapeToDelete) {
      let actionType: Action['type'] = 'delete-konva-shape';

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
        }
    
    // 2. Add to Undo History
    undoRedoAddAction({
        type: actionType,
        data: shapeToDelete,
        id: id,
        connectionId: actionType === 'delete-connection' ? id : undefined
    } as Action);

  
    deleteShape(id);

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
  }
  }, [allShapes, reactShapes, konvaShapes, images, connections, stageFrames, deleteShape, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, scale, position]);

  const handleToolChangeWithAutoCreate = useCallback((tool: Tool | null) => {
 
    toolHandlers.handleToolChange(tool);
    setActiveTool(tool);
  }, [toolHandlers.handleToolChange, setActiveTool, handleAddShape,toolHandlers]);

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
   
    
    addImage(imageUrl, undoRedoAddAction, viewportCenter);
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
  }, [calculateViewportCenter, addImage, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, handleInteractionStart, handleInteractionEnd]);

  const autoFitContent = useCallback(() => {
  if (!stageRef.current) return;

  const stage = stageRef.current;
  const allFrames = [...stageFrames, ...konvaShapes.filter(s => s.type === 'stage')];

  if (allFrames.length === 0) {
    boardState.setScale(0.7);
    return;
  }

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

  const padding = 200; 
  const availableWidth = stage.width() - 2 * padding;
  const availableHeight = stage.height() - 2 * padding;

  const scaleX = availableWidth / contentWidth;
  const scaleY = availableHeight / contentHeight;
  const newScale = Math.min(scaleX, scaleY, 0.9); 

  const finalScale = Math.max(newScale, 0.3); 

  const centerX = minX + contentWidth / 2;
  const centerY = minY + contentHeight / 2;

  const newPosX = stage.width() / 2 - centerX * finalScale;
  const newPosY = stage.height() / 2 - centerY * finalScale;

  boardState.setScale(finalScale);
  boardState.setPosition({ x: newPosX, y: newPosY });

  
}, [stageRef, stageFrames, konvaShapes, boardState]);

  const handleApplyStage = useCallback(() => {
    
    
    if (tempDimensions.width > 0 && tempDimensions.height > 0) {
      handleInteractionStart();
      
      // 1. Get current Viewport Center
      const rawCenter = calculateViewportCenter();
      
      // 2. Define top-left based on center
      const startPos = {
          x: rawCenter.x - (tempDimensions.width / 2),
          y: rawCenter.y - (tempDimensions.height / 2)
      };

      // 3. FIND SAFE POSITION (The Fix)
      // We pass ALL existing shapes to ensure we don't overlap anything
      const allExisting = [...konvaShapes, ...reactShapes, ...stageFrames, ...images];
      
      const safePos = findSafePosition(
          startPos, 
          tempDimensions.width, 
          tempDimensions.height, 
          allExisting
      );

      // 4. Calculate the center of that SAFE position (because addStageFrame expects center or calculates it)
      // Actually, addStageFrame uses a centerPosition arg. Let's pass the calculated SAFE center.
      const safeCenter = {
          x: safePos.x + (tempDimensions.width / 2),
          y: safePos.y + (tempDimensions.height / 2)
      };
      
      const stageFrameId = addStageFrame(
        tempDimensions.width, 
        tempDimensions.height, 
        undoRedoAddAction,
        safeCenter // Pass the collision-aware center
      );
      
     
      
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
      setTempDimensions(defaultStageDimensions);
      setTimeout(handleInteractionEnd, 100);
          
    } else {
      
    }
  }, [tempDimensions, addStageFrame, setTempDimensions, undoRedoAddAction, calculateViewportCenter, currentBoardId, isTemporaryBoard, user, triggerSave, reactShapes, konvaShapes, stageFrames, images, connections, lines, scale, position, handleInteractionStart, handleInteractionEnd]);


  const keyboardShortcuts = useKeyboardShortcuts({
    selectedNodeIds, 
    deleteShape: handleDeleteShape,
    setSelectedNodeIds, 
    activeTool,
    setActiveTool: (tool: Tool | null) => {
     
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

  // --- UPDATED: AI Layout Handler ---
  const handleAddAIContent = useCallback((text: string) => {
    handleInteractionStart();
    const center = calculateViewportCenter();
    
    // 1. Gather all obstacles
    const existingShapes = [
        ...konvaShapes, 
        ...reactShapes, 
        ...stageFrames, 
        ...images
    ];

    // 2. Pass them to the engine
    const layout = generateLayoutFromText(text, center, existingShapes);
    
    if (!layout) {
      alert("I couldn't find a list in that message to convert!");
      setTimeout(handleInteractionEnd, 100);
      return;
    }

    

    // 3. Add to State
    setStageFrames(prev => [...prev, layout.stageFrame]);
    setReactShapes(prev => [...prev, ...layout.stickyNotes]);

    undoRedoAddAction({
      type: 'batch',
      actions: [
        { type: 'add-stage-frame', data: layout.stageFrame },
        ...layout.stickyNotes.map(note => ({ 
          type: 'add-react-shape', 
          shapeType: 'stickyNote', 
          data: note 
        } as Action))
      ]
    });

    if (currentBoardId && !isTemporaryBoard && user) {
        setHasChanges(true);
    }
    
    setTimeout(handleInteractionEnd, 100);
  }, [calculateViewportCenter, handleInteractionStart, handleInteractionEnd, undoRedoAddAction, currentBoardId, isTemporaryBoard, user, setStageFrames, setReactShapes, konvaShapes, reactShapes, stageFrames, images]); // Added dependencies
  
  return (
    <>
      <div className="relative w-screen h-screen bg-slate-50">
        <BoardHeader
            boardInfo={boardInfo}
            isTemporaryBoard={isTemporaryBoard}
            currentBoardId={currentBoardId}
            showSaveModal={showSaveModal}
            setShowSaveModal={setShowSaveModal}
            onAddAIContent={handleAddAIContent}
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
            
              setBoardInfo({
                title: updates.title,
                category: updates.category
              });
            }}
            onCopyCleanText={copyCleanText}
            scale={scale}        
            position={position}  
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
          position={getSelectedShapeScreenPosition()}
          onChange={handleFormattingToolbarUpdate}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onDelete={() => {
            if (selectedNodeIds.length > 0) {
              handleDeleteShape(selectedNodeIds[0]);
            }
          }}
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
          duplicateShape={boardState.duplicateShape}
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
          hoveredNodeId={toolHandlers.hoveredNodeId}
          setHoveredNodeId={toolHandlers.setHoveredNodeId}
          handleAnchorMouseDown={toolHandlers.handleAnchorMouseDown}
          handleAnchorClick={toolHandlers.handleAnchorClick}
          handleShapeMouseEnter={toolHandlers.handleShapeMouseEnter}
          tempConnection={tempConnection}
          isSpacePressed={toolHandlers.isSpacePressed}
          // ADDED ACTION HANDLER
          onAction={undoRedoAddAction}
        />
      </div>
      <CreateBoard 
        open={showSetupDialog}
        onOpenChange={(open) => setShowSetupDialog(open)} 
        boardId={params.boardId as string}
        onBoardUpdate={(updates) => {
         
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
    </>
  );
};

export default BoardPage;