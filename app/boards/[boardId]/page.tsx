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
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  
  const [stageKey, setStageKey] = useState(0);

  // State management - ALL shape state now comes from useBoardState
  const boardState = useBoardState();
  
  const {
    scale, position, activeTool, drawingMode, lines, connectionStart, tempConnection,
    isConnecting, reactShapes, konvaShapes, stageFrames, selectedNodeId, stageInstance, tempDimensions,
    showSaveModal, isTemporaryBoard, currentBoardId, showSetupDialog, boardInfo,
    setActiveTool, setDrawingMode, setLines, setConnectionStart, setTempConnection,
    setIsConnecting, setReactShapes, setKonvaShapes, setStageFrames, setSelectedNodeId, setStageInstance,
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
  } = boardState;

  // Undo/Redo functionality - MUST BE DEFINED BEFORE HANDLERS THAT USE IT
  const { addAction: undoRedoAddAction, undo, redo } = useUndoRedo(
    stageRef,
    boardState.actions,
    boardState.undoneActions,
    reactShapes,
    lines,
    konvaShapes,
    stageFrames,
    boardState.setActions,
    boardState.setUndoneActions,
    setReactShapes,
    setLines,
    setKonvaShapes,
    setStageFrames
  );

  // Tool functionality
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
    undoRedoAddAction // Use the renamed addAction
  );

  const debouncedUpdateShape = useDebounce((shapeId: string, updates: Partial<any>) => {
    const isReactShape = reactShapes.some((s) => s.id === shapeId);
    
    if (isReactShape) {
      setReactShapes(prev => 
        prev.map(shape => 
          shape.id === shapeId ? { ...shape, ...updates } : shape
        )
      );
    } else {
      // For Konva shapes, find the node and create proper update action
      const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
      if (drawLayer) {
        const node = drawLayer.findOne(`#${shapeId}`) as Konva.Shape | Konva.Group;
        if (node) {
          const prevAttrs = { ...node.attrs };
          node.setAttrs(updates);
          drawLayer.batchDraw();
          
          // Add to undo history with CORRECT action structure
          undoRedoAddAction({
            type: "update",
            id: shapeId,
            prevAttrs,
            newAttrs: { ...node.attrs }
          });
        }
      }
    }
  }, 50);

  // Handler for StageComponent (expects: (id: string, attrs: Partial<KonvaShape>) => void)
  const handleStageShapeUpdate = useCallback((id: string, attrs: Partial<any>) => {
    if (!id) return;
    
    // Check if it's a React shape (text/sticky note) or Konva shape
    const isReactShape = reactShapes.some((s) => s.id === id);
    const isKonvaShape = konvaShapes.some((s) => s.id === id);
    
    if (isReactShape) {
      // Apply to React shapes
      setReactShapes(prev => 
        prev.map(shape => 
          shape.id === id ? { ...shape, ...attrs } : shape
        )
      );
    } else if (isKonvaShape) {
      // Apply to Konva shapes
      debouncedUpdateShape(id, attrs);
    }
  }, [debouncedUpdateShape, reactShapes, konvaShapes]);

  // Handler for FormattingToolbar (expects: (updates: Record<string, any>) => void)
  const handleFormattingToolbarUpdate = useCallback((updates: Record<string, any>) => {
    if (!selectedNodeId) return;
    
    // Check if it's a React shape (text/sticky note) or Konva shape
    const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
    const isKonvaShape = konvaShapes.some((s) => s.id === selectedNodeId);
    
    if (isReactShape) {
      // Apply to React shapes
      setReactShapes(prev => 
        prev.map(shape => 
          shape.id === selectedNodeId ? { ...shape, ...updates } : shape
        )
      );
    } else if (isKonvaShape) {
      // Apply to Konva shapes
      debouncedUpdateShape(selectedNodeId, updates);
    }
  }, [selectedNodeId, debouncedUpdateShape, reactShapes, konvaShapes]);

  // Memoize selected shape to prevent unnecessary re-renders
  const selectedShape = useMemo(() => {
    if (!selectedNodeId) return null;
    
    // Check react shapes first (text shapes)
    const reactShape = reactShapes.find((s) => s.id === selectedNodeId);
    if (reactShape) return reactShape;
    
    // Check konva shapes
    const konvaShape = konvaShapes.find((s) => s.id === selectedNodeId);
    return konvaShape || null;
  }, [selectedNodeId, reactShapes, konvaShapes]);

  // Shape creation - using addShape from boardState
  const handleAddShape = useCallback((type: Tool) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    const safePosition = position ?? { x: 0, y: 0 }; 

    const center = {
      x: stage.width() / 2 / scale - safePosition.x / scale,
      y: stage.height() / 2 / scale - safePosition.y / scale,
    };

    addShape(type, undoRedoAddAction); // Pass the undo/redo addAction
  }, [stageRef, scale, position, addShape, undoRedoAddAction]);

  // Stage dimensions
  const handleApplyStage = useCallback(() => {
    console.log('🎯 Creating stage frame:', tempDimensions);
    
    if (tempDimensions.width > 0 && tempDimensions.height > 0) {
      const stageFrameId = addStageFrame(tempDimensions.width, tempDimensions.height, undoRedoAddAction);
      console.log('✅ Stage frame created:', stageFrameId);
      
      // Clear the temp dimensions after creation
      setTempDimensions(defaultStageDimensions);
    } else {
      console.log('❌ Invalid stage dimensions');
    }
  }, [tempDimensions, addStageFrame, setTempDimensions, undoRedoAddAction]);

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
          handleApplyStage={handleApplyStage}
          undo={undo}
          redo={redo}
        />

        {/* Zoom Indicator */}
        <div className="absolute z-10 bottom-0 right-0 flex items-center bg-white rounded-md m-4 p-3 shadow-md">
          <img src="/image/connect-nodes2.svg" alt="zoom-out" />
          <p>{Math.round(scale * 100)}%</p>
          <img src="/image/add-icon.svg" alt="zoom-in" />
        </div>

        {/* Formatting Toolbar */}
        <FormattingToolbar
          selectedShape={selectedShape}
          onChange={handleFormattingToolbarUpdate}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
        />

        {/* Stage */}
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