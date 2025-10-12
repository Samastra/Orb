"use client";

import React, { useRef, useEffect, useCallback, useMemo } from "react";
import Konva from "konva";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { Tool, ReactShape } from "@/types/board-types";
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
import { useShapes } from "@/hooks/useShapes";
import FormattingToolbar from "@/components/FormattingToolbar";

// Utils
import { addStageWithDimensions } from "@/utils/shape-helpers";
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
  
  // State management
  const boardState = useBoardState();
  
  const {
    scale, position, activeTool, drawingMode, lines, connectionStart, tempConnection,
    isConnecting, reactShapes, selectedNodeId, stageInstance, tempDimensions,
    showSaveModal, isTemporaryBoard, currentBoardId, showSetupDialog, boardInfo,
    setActiveTool, setDrawingMode, setLines, setConnectionStart, setTempConnection,
    setIsConnecting, setReactShapes, setSelectedNodeId, setStageInstance,
    setTempDimensions, setShowSaveModal, setShowSetupDialog, setBoardInfo,
    bringForward: bringForwardReact,
    sendBackward: sendBackwardReact,
    bringToFront: bringToFrontReact,
    sendToBack: sendToBackReact
  } = boardState;

  // Shapes management with z-index functions
  const { 
    shapes, 
    addShape: addKonvaShape, 
    updateShape, 
    setShapes,
    bringForward: bringForwardKonva,
    sendBackward: sendBackwardKonva, 
    bringToFront: bringToFrontKonva, 
    sendToBack: sendToBackKonva 
  } = useShapes();

  // Z-index handlers that work with both shape systems
  const handleBringForward = useCallback(() => {
    if (!selectedNodeId) return;
    
    const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
    const isKonvaShape = shapes.some((s) => s.id === selectedNodeId);
    
    if (isReactShape) {
      bringForwardReact();
    } else if (isKonvaShape) {
      bringForwardKonva(selectedNodeId);
    }
  }, [selectedNodeId, reactShapes, shapes, bringForwardReact, bringForwardKonva]);

  const handleSendBackward = useCallback(() => {
    if (!selectedNodeId) return;
    
    const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
    const isKonvaShape = shapes.some((s) => s.id === selectedNodeId);
    
    if (isReactShape) {
      sendBackwardReact();
    } else if (isKonvaShape) {
      sendBackwardKonva(selectedNodeId);
    }
  }, [selectedNodeId, reactShapes, shapes, sendBackwardReact, sendBackwardKonva]);

  const handleBringToFront = useCallback(() => {
    if (!selectedNodeId) return;
    
    const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
    const isKonvaShape = shapes.some((s) => s.id === selectedNodeId);
    
    if (isReactShape) {
      bringToFrontReact();
    } else if (isKonvaShape) {
      bringToFrontKonva(selectedNodeId);
    }
  }, [selectedNodeId, reactShapes, shapes, bringToFrontReact, bringToFrontKonva]);

  const handleSendToBack = useCallback(() => {
    if (!selectedNodeId) return;
    
    const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
    const isKonvaShape = shapes.some((s) => s.id === selectedNodeId);
    
    if (isReactShape) {
      sendToBackReact();
    } else if (isKonvaShape) {
      sendToBackKonva(selectedNodeId);
    }
  }, [selectedNodeId, reactShapes, shapes, sendToBackReact, sendToBackKonva]);

   const debouncedUpdateShape = useDebounce((shapeId: string, updates: Record<string, any>) => {
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
          addAction({
            type: "update",
            id: shapeId,
            prevAttrs,
            newAttrs: { ...node.attrs }
          });
        }
      }
    }
  }, 50);

  // Handle shape updates from formatting toolbar
  const handleShapeUpdate = useCallback((updates: Record<string, any>) => {
    if (!selectedNodeId) return;
    
    // Check if it's a React shape (text/sticky note) or Konva shape
    const isReactShape = reactShapes.some((s) => s.id === selectedNodeId);
    const isKonvaShape = shapes.some((s) => s.id === selectedNodeId);
    
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
  }, [selectedNodeId, debouncedUpdateShape, reactShapes, shapes]);

  // Undo/Redo functionality
  const { addAction, undo, redo } = useUndoRedo(
    stageRef,
    boardState.actions,
    boardState.undoneActions,
    reactShapes,
    lines,
    shapes,
    boardState.setActions,
    boardState.setUndoneActions,
    setReactShapes,
    setLines,
    setShapes
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

  // Memoize selected shape to prevent unnecessary re-renders
  const selectedShape = useMemo(() => {
    if (!selectedNodeId) return null;
    
    // Check react shapes first (text shapes)
    const reactShape = reactShapes.find((s) => s.id === selectedNodeId);
    if (reactShape) return reactShape;
    
    // Check konva shapes
    const konvaShape = shapes.find((s) => s.id === selectedNodeId);
    return konvaShape || null;
  }, [selectedNodeId, reactShapes, shapes]);

  // FIXED: Improved update function with proper state updates
 

  // DEBUG: Log shape updates to see what's happening
  useEffect(() => {
    if (selectedNodeId) {
      const shape = reactShapes.find(s => s.id === selectedNodeId);
      if (shape) {
        console.log('Selected Text Shape:', {
          id: shape.id,
          text: shape.text,
          fontSize: shape.fontSize,
          fontFamily: shape.fontFamily,
          fontWeight: shape.fontWeight,
          fontStyle: shape.fontStyle,
          textDecoration: shape.textDecoration,
          align: shape.align
        });
      }
    }
  }, [selectedNodeId, reactShapes]);

  // Shape creation - FIXED: Add zIndex to all new shapes
  const addShape = useCallback((type: Tool) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    const center = {
      x: stage.width() / 2 / scale - position.x / scale,
      y: stage.height() / 2 / scale - position.y / scale,
    };

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
        // ADD Z-INDEX
        zIndex: Date.now(),
      };
      
      setReactShapes(prev => [...prev, newTextShape]);
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
      
      // Create a modern sticky note
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
        // ADD Z-INDEX
        zIndex: Date.now(),
      };
      
      setReactShapes(prev => [...prev, newStickyNote]);
      addAction({ 
        type: "add-react-shape", 
        shapeType: 'stickyNote', 
        data: newStickyNote 
      });
      
      if (activeTool === "select") {
        setSelectedNodeId(shapeId);
      }
    } else {
      const result = addKonvaShape(type, center, true);
      if (result && activeTool === "select") {
        setSelectedNodeId(result.shapeId);
        
        // Set default stroke and cornerRadius for new shapes
        if (["rect", "circle", "ellipse", "triangle", "arrow", "stage"].includes(type)) {
          const shapeUpdates: Record<string, any> = {
            stroke: "#000000",
            strokeWidth: 0,
          };
          
          if (["rect", "stage"].includes(type)) {
            shapeUpdates.cornerRadius = 0;
          }
          
          setTimeout(() => {
            debouncedUpdateShape(result.shapeId, shapeUpdates);
          }, 100);
        }
      }
    }
  }, [stageRef, scale, position, activeTool, addKonvaShape, addAction, setSelectedNodeId, setReactShapes, debouncedUpdateShape]);

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

        {/* Formatting Toolbar */}
        <FormattingToolbar
          selectedShape={selectedShape}
          onChange={handleShapeUpdate}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />

        {/* Stage */}
        <StageComponent
          stageRef={stageRef}
          trRef={trRef}
          scale={scale}
          position={position}
          activeTool={activeTool}
          lines={lines}
          reactShapes={reactShapes}
          shapes={shapes}
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
          setShapes={setShapes}
          updateShape={updateShape}
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