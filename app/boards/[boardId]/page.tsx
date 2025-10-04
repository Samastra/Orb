"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Konva from "konva";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Tool } from "@/types/board-types";
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
import { useShapes } from "@/hooks/useShapes"; // Add this import

// Utils
import { addStageWithDimensions } from "@/utils/shape-helpers";
import { fetchBoard } from "@/lib/actions/board-actions";

// Fix text rendering
if (typeof window !== 'undefined') {
  (Konva as any)._fixTextRendering = true;
}

const BoardPage = () => {
  const params = useParams();
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  
  // State management
  const boardState = useBoardState();
  const {
    scale, position, activeTool, drawingMode, lines, connectionStart, tempConnection,
    isConnecting, reactShapes, selectedNodeId, stageInstance, tempDimensions,
    showSaveModal, isTemporaryBoard, currentBoardId, showSetupDialog, boardInfo,
    setActiveTool, setDrawingMode, setLines, setConnectionStart, setTempConnection,
    setIsConnecting, setReactShapes, setSelectedNodeId, setStageInstance,
    setTempDimensions, setShowSaveModal, setShowSetupDialog, setBoardInfo
  } = boardState;

  // Shapes management - ADD THIS
  const { shapes, addShape: addKonvaShape, updateShape, setShapes } = useShapes();
  console.log('Shapes in BoardPage:', shapes);
  // Undo/Redo functionality
  const { addAction, undo, redo } = useUndoRedo(
    stageRef,
    boardState.actions,
    boardState.undoneActions,
    reactShapes,
    lines,
    boardState.setActions,
    boardState.setUndoneActions,
    setReactShapes,
    setLines
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
    addAction                   
  );

  // Shape creation - UPDATE THIS FUNCTION
  // Shape creation - make draggable more reliable
const addShape = useCallback((type: Tool) => {
  if (!stageRef.current) return;
  const stage = stageRef.current;

  const center = {
    x: stage.width() / 2 / scale - position.x / scale,
    y: stage.height() / 2 / scale - position.y / scale,
  };

  if (type === "text") {
    const shapeId = `shape-${Date.now()}`;
    const textShape = {
      id: shapeId,
      type: 'text',
      x: center.x,
      y: center.y,
      text: "Double click to edit",
      fontSize: 20,
      fill: "black",
    };
    setReactShapes(prev => [...prev, textShape]);
    addAction({ type: "add-react-shape", shapeType: 'text', data: textShape });
    
    if (activeTool === "select") {
      setSelectedNodeId(shapeId);
    }
  } else {
    // Always create shapes as draggable - let the tool change handler manage it
    const shapeId = addKonvaShape(type, center, true); // Always true for draggable
    if (shapeId && activeTool === "select") {
      setSelectedNodeId(shapeId);
    }
  }
}, [stageRef, scale, position, activeTool, addKonvaShape, addAction, setSelectedNodeId, setReactShapes]);
  // Stage dimensions
  const handleApplyStage = useCallback(() => {
    addStageWithDimensions(
      tempDimensions.width,
      tempDimensions.height,
      stageRef,
      scale,
      position,
      activeTool,
      addAction,
      setSelectedNodeId
    );
  }, [tempDimensions, scale, position, activeTool, addAction, setSelectedNodeId]);

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
          addShape={addShape}
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

        {/* Stage - UPDATE THIS TO PASS SHAPE PROPS */}
        <StageComponent
          stageRef={stageRef}
          trRef={trRef}
          scale={scale}
          position={position}
          activeTool={activeTool}
          lines={lines}
          reactShapes={reactShapes}
          shapes={shapes} // ADD THIS
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
          setShapes={setShapes} // ADD THIS
          updateShape={updateShape} // ADD THIS
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