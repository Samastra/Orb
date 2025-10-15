"use client";

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import Konva from "konva";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Tool, ReactShape } from "@/types/board-types";
import { defaultStageDimensions } from "@/constants/tool-constants";
// Components
import Toolbar from "@/components/Toolbar";
import BoardHeader from "@/components/BoardHeader";
import StageComponent from "@/components/StageComponent";
import CreateBoard from "@/components/createBoard";
import { deleteBoard } from "@/lib/actions/board-actions";
// Hooks
import { useBoardState } from "@/hooks/useBoardState";
import { useKonvaTools } from "@/hooks/useKonvaTools";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import FormattingToolbar from "@/components/FormattingToolbar";
// Utils
import { fetchBoard } from "@/lib/actions/board-actions";
import { useWindowSize } from "@/hooks/useWindowSize";
import { cn } from "@/lib/utils";

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

const BoardPage = () => {
  const params = useParams();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  
  const [stageKey, setStageKey] = useState(0);

  // State management
  const boardState = useBoardState();
  
  const {
    scale, position, activeTool, drawingMode, lines, connectionStart, tempConnection,
    isConnecting, reactShapes, konvaShapes, stageFrames, images, connections, selectedNodeId, stageInstance, tempDimensions, // ADD connections HERE
    showSaveModal, isTemporaryBoard, currentBoardId, showSetupDialog, boardInfo,
    setActiveTool, setDrawingMode, setLines, setConnectionStart, setTempConnection,
    setIsConnecting, setReactShapes, setKonvaShapes, setStageFrames, setImages, setConnections, setSelectedNodeId, setStageInstance, // ADD setConnections HERE
    setTempDimensions, setShowSaveModal, setShowSetupDialog, setBoardInfo,
    // Layer functions
    bringForward,
    sendBackward, 
    bringToFront,
    sendToBack,
    // Shape functions
    addShape,
    updateShape,
    addKonvaShape,
    addStageFrame,
    addImage,
    addConnection, // ADD THIS
    updateConnection, // ADD THIS
    removeConnection, // ADD THIS
  } = boardState;

  // Undo/Redo functionality - UPDATED WITH IMAGES AND CONNECTIONS
const { addAction: undoRedoAddAction, undo, redo } = useUndoRedo(
  stageRef,
  boardState.actions,
  boardState.undoneActions,
  reactShapes,
  lines,
  konvaShapes,
  stageFrames,
  images,
  connections, // ADD THIS - connection state
  boardState.setActions,
  boardState.setUndoneActions,
  setReactShapes,
  setLines,
  setKonvaShapes,
  setStageFrames,
  setImages,
  setConnections // ADD THIS
  // 18 arguments total - matches the updated function signature
);

  // Tool functionality - UPDATED WITH CONNECTION SUPPORT
  // Tool functionality - UPDATED WITH CONNECTION SUPPORT
const toolHandlers = useKonvaTools(
  stageRef, 
  activeTool, 
  scale, 
  position, 
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
  undoRedoAddAction
  // 17 arguments total - matches the function signature
);

  // ADD ZOOM FUNCTIONS THAT ACTUALLY WORK
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.min(oldScale * scaleBy, 5); // Max zoom 500%

    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
    
    // FORCE UPDATE THE SCALE IN STATE
    boardState.setScale(newScale);
  }, [stageRef, boardState.setScale]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.max(oldScale / scaleBy, 0.1); // Min zoom 10%

    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
    
    // FORCE UPDATE THE SCALE IN STATE
    boardState.setScale(newScale);
  }, [stageRef, boardState.setScale]);

  const debouncedUpdateShape = useDebounce((shapeId: string, updates: Partial<any>) => {
    const isReactShape = reactShapes.some((s) => s.id === shapeId);
    const isKonvaShape = konvaShapes.some((s) => s.id === shapeId);
    const isConnection = connections.some((c) => c.id === shapeId); // ADD THIS
    
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
          
          undoRedoAddAction({
            type: "update",
            id: shapeId,
            prevAttrs,
            newAttrs: { ...node.attrs }
          });
        }
      }
    } else if (isConnection) {
      // Handle connection updates
      updateConnection(shapeId, updates);
    }
  }, 50);

  // Handler for StageComponent - UPDATED WITH CONNECTION SUPPORT
  const handleStageShapeUpdate = useCallback((id: string, attrs: Partial<any>) => {
    if (!id) return;
    
    const isReactShape = reactShapes.some((s) => s.id === id);
    const isKonvaShape = konvaShapes.some((s) => s.id === id);
    const isConnection = connections.some((c) => c.id === id); // ADD THIS
    
    if (isReactShape) {
      setReactShapes(prev => 
        prev.map(shape => 
          shape.id === id ? { ...shape, ...attrs } : shape
        )
      );
    } else if (isKonvaShape) {
      debouncedUpdateShape(id, attrs);
    } else if (isConnection) {
      // Handle connection updates
      updateConnection(id, attrs);
    }
  }, [debouncedUpdateShape, reactShapes, konvaShapes, connections, updateConnection]);

  // Handler for FormattingToolbar - UPDATED WITH CONNECTION SUPPORT
  const handleFormattingToolbarUpdate = useCallback((updates: Record<string, any>) => {
    if (!selectedNodeId) return;
    
    const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
    const isKonvaShape = konvaShapes.some((s) => s.id === selectedNodeId);
    const isConnection = connections.some((c) => c.id === selectedNodeId); // ADD THIS
    
    if (isReactShape) {
      setReactShapes(prev => 
        prev.map(shape => 
          shape.id === selectedNodeId ? { ...shape, ...updates } : shape
        )
      );
    } else if (isKonvaShape) {
      debouncedUpdateShape(selectedNodeId, updates);
    } else if (isConnection) {
      // Handle connection styling updates
      updateConnection(selectedNodeId, updates);
    }
  }, [selectedNodeId, debouncedUpdateShape, reactShapes, konvaShapes, connections, updateConnection]);

  // Memoize selected shape - UPDATED WITH CONNECTIONS
  const selectedShape = useMemo(() => {
    if (!selectedNodeId) return null;
    
    // Check react shapes
    const reactShape = reactShapes.find((s) => s.id === selectedNodeId);
    if (reactShape) return reactShape;
    
    // Check konva shapes
    const konvaShape = konvaShapes.find((s) => s.id === selectedNodeId);
    if (konvaShape) return konvaShape;
    
    // Check images
    const imageShape = images.find((img) => img.id === selectedNodeId);
    if (imageShape) return imageShape;
    
    // Check connections - ADD THIS
    const connectionShape = connections.find((conn) => conn.id === selectedNodeId);
    return connectionShape || null;
  }, [selectedNodeId, reactShapes, konvaShapes, images, connections]);

  // Shape creation
  const handleAddShape = useCallback((type: Tool) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    const safePosition = position ?? { x: 0, y: 0 }; 

    const center = {
      x: stage.width() / 2 / scale - safePosition.x / scale,
      y: stage.height() / 2 / scale - safePosition.y / scale,
    };

    addShape(type, undoRedoAddAction);
  }, [stageRef, scale, position, addShape, undoRedoAddAction]);

  // Stage dimensions
  const handleApplyStage = useCallback(() => {
    console.log('🎯 Creating stage frame:', tempDimensions);
    
    if (tempDimensions.width > 0 && tempDimensions.height > 0) {
      const stageFrameId = addStageFrame(tempDimensions.width, tempDimensions.height, undoRedoAddAction);
      console.log('✅ Stage frame created:', stageFrameId);
      
      setTempDimensions(defaultStageDimensions);
    } else {
      console.log('❌ Invalid stage dimensions');
    }
  }, [tempDimensions, addStageFrame, setTempDimensions, undoRedoAddAction]);

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          // Add image to board
          addImage(src, undoRedoAddAction);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [addImage, undoRedoAddAction]);

  // NEW: Handle connection deletion (double-click)
  const handleConnectionDelete = useCallback((connectionId: string) => {
    console.log('🗑️ Deleting connection:', connectionId);
    removeConnection(connectionId);
    undoRedoAddAction({
      type: "delete-connection",
      connectionId: connectionId
    });
  }, [removeConnection, undoRedoAddAction]);

  // Close without save
  const handleCloseWithoutSave = useCallback(async () => {
    try {
      await deleteBoard(currentBoardId);
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete board:", error);
    }
  }, [currentBoardId]);

  useEffect(() => {
    const checkIfNewBoard = async () => {
      const board = await fetchBoard(params.boardId as string);
      if (board.title === "Untitled Board" && !showSetupDialog) {
        setShowSetupDialog(true);
      }
    };
    checkIfNewBoard();
  }, [params.boardId, showSetupDialog, setShowSetupDialog]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (trRef.current) {
        trRef.current.nodes([]);
        trRef.current.destroy();
      }
    };
  }, []);

  return (
    <>
      <div className="relative w-screen h-screen bg-gray-50">
        {/* Header */}
        <BoardHeader
          boardInfo={boardInfo}
          isTemporaryBoard={isTemporaryBoard}
          currentBoardId={currentBoardId}
          showSaveModal={showSaveModal}
          setShowSaveModal={setShowSaveModal}
          handleCloseWithoutSave={handleCloseWithoutSave}
        />

        {/* Toolbar */}
        <Toolbar
          activeTool={activeTool}
          drawingMode={drawingMode}
          tempDimensions={tempDimensions}
          handleToolChange={toolHandlers.handleToolChange}
          setDrawingMode={setDrawingMode}
          addShape={handleAddShape}
          setTempDimensions={setTempDimensions}
          onImageUpload={handleImageUpload}
          handleApplyStage={handleApplyStage}
          undo={undo}
          redo={redo}
        />

        {/* Formatting Toolbar */}
        <FormattingToolbar
          selectedShape={selectedShape}
          onChange={handleFormattingToolbarUpdate}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
        />

        {/* BOTTOM CONTROLS - THE ONE YOU LIKED! */}
        <div className={cn(
          "absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4",
          "bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-gray-200",
          "transition-all duration-300"
        )}>
          {/* Zoom Controls */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleZoomOut}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Zoom Out"
            >
              <img src="/image/connect-nodes2.svg" alt="zoom-out" className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 min-w-[80px] justify-center">
              <span className="text-sm font-medium text-gray-700">
                {Math.round(scale * 100)}%
              </span>
            </div>
            
            <button 
              onClick={handleZoomIn}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Zoom In"
            >
              <img src="/image/add-icon.svg" alt="zoom-in" className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions - UNDO/REDO YOU LIKED */}
          <div className="w-px h-6 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={boardState.actions.length === 0}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Undo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={boardState.undoneActions.length === 0}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Redo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stage - UPDATED WITH CONNECTION PROPS */}
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
          connections={connections} // ADD THIS
          selectedNodeId={selectedNodeId}
          stageInstance={stageInstance}
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
          setConnections={setConnections} // ADD THIS
          updateShape={handleStageShapeUpdate}
          setStageInstance={setStageInstance}
        />
      </div>

      {/* Create Board Dialog */}
      <CreateBoard 
        open={showSetupDialog}
        onOpenChange={(open) => setShowSetupDialog(open)} 
        boardId={params.boardId as string}
        onBoardUpdate={(updates) => {
          setBoardInfo({
            title: updates.title,
            category: updates.category
          })
        }}
      />
    </>
  );
};

export default BoardPage;