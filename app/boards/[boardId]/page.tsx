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



const BoardPage = () => {
  const params = useParams();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  
  // Refs
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  
  const [stageKey, setStageKey] = useState(0);

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
  undoRedoAddAction,
  setConnections, // 🆕 ADD THIS
  updateConnection
);

  
    // / INSIDE YOUR BoardPage COMPONENT, ADD:
      const { user } = useUser();
      const { triggerSave } = useAutoSave(currentBoardId, isTemporaryBoard, user?.id);

      // ADD AUTO-SAVE EFFECT
            useEffect(() => {
            if (currentBoardId && !isTemporaryBoard && user) {
              console.log("📤 Preparing to auto-save with lines:", lines.length, { scale, position });
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
            }
          }, [
            reactShapes,
            konvaShapes,
            stageFrames,
            images,
            connections,
            lines,
            scale,
            position,
            currentBoardId,
            isTemporaryBoard,
            user,
            triggerSave,
          ]);
  // ADD ZOOM FUNCTIONS THAT ACTUALLY WORK
  const handleZoomIn = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.min(oldScale * scaleBy, 5);

    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
    
    boardState.setScale(newScale);
  }, [stageRef, boardState.setScale]);

  const handleZoomOut = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const scaleBy = 1.2;
    const oldScale = stage.scaleX();
    const newScale = Math.max(oldScale / scaleBy, 0.1);

    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
    
    boardState.setScale(newScale);
  }, [stageRef, boardState.setScale]);

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
          
          // CRITICAL FIX: Update the konvaShapes state
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
  }, 50);

  // Handler for StageComponent - UPDATED WITH CONNECTION SUPPORT
// UPDATE handleStageShapeUpdate to trigger auto-save
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

      if (currentBoardId && !isTemporaryBoard && user) {
        triggerSave({
          reactShapes: isReactShape
            ? reactShapes.map((s) => (s.id === id ? { ...s, ...attrs } : s))
            : reactShapes,
          konvaShapes: isKonvaShape
            ? konvaShapes.map((s) => (s.id === id ? { ...s, ...attrs } : s))
            : konvaShapes,
          stageFrames,
          images,
          connections: isConnection
            ? connections.map((c) => (c.id === id ? { ...c, ...attrs } : c))
            : connections,
          lines,
          scale,
          position,
        });
      }
    },
    [
      debouncedUpdateShape,
      reactShapes,
      konvaShapes,
      connections,
      updateConnection,
      currentBoardId,
      isTemporaryBoard,
      user,
      triggerSave,
      lines,
      scale,
      position,
    ]
  );
// UPDATE handleFormattingToolbarUpdate to trigger auto-save
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

      if (currentBoardId && !isTemporaryBoard && user) {
        triggerSave({
          reactShapes: isReactShape
            ? reactShapes.map((s) =>
                s.id === selectedNodeId ? { ...s, ...updates } : s
              )
            : reactShapes,
          konvaShapes: isKonvaShape
            ? konvaShapes.map((s) =>
                s.id === selectedNodeId ? { ...s, ...updates } : s
              )
            : konvaShapes,
          stageFrames,
          images,
          connections: isConnection
            ? connections.map((c) =>
                c.id === selectedNodeId ? { ...c, ...updates } : c
              )
            : connections,
          lines,
          scale,
          position,
        });
      }
    },
    [
      selectedNodeId,
      debouncedUpdateShape,
      reactShapes,
      konvaShapes,
      connections,
      updateConnection,
      currentBoardId,
      isTemporaryBoard,
      user,
      triggerSave,
      lines,
      scale,
      position,
    ]
  );

  // Memoize selected shape - UPDATED WITH CONNECTIONS
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

 

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
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

  // FIX 1: Enhanced delete function that supports undo/redo
  const handleDeleteShape = useCallback((id: string) => {
    console.log('🗑️ Keyboard delete triggered for:', id, {
      reactShapes: reactShapes.find(s => s.id === id),
      konvaShapes: konvaShapes.find(s => s.id === id),
      images: images.find(s => s.id === id),
      connections: connections.find(s => s.id === id),
      stageFrames: stageFrames.find(s => s.id === id)
    });
    
    // Use the enhanced delete that records actions
    const allShapes = [...reactShapes, ...konvaShapes, ...images, ...connections, ...stageFrames];
    const shapeToDelete = allShapes.find(shape => shape.id === id);
    
    if (shapeToDelete) {
      // Record deletion for undo/redo
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
    
    // Perform the actual deletion
    console.log('🗑️ Actually deleting shape:', id);
    deleteShape(id);
  }, [reactShapes, konvaShapes, images, connections, stageFrames, deleteShape, undoRedoAddAction]);

  // FIX 2: Enhanced tool change handler
  const handleToolChangeWithAutoCreate = useCallback((tool: Tool | null) => {
    console.log('🔧 Tool change:', tool);
    toolHandlers.handleToolChange(tool);
    setActiveTool(tool);
    
    // Auto-create shapes for certain tools
    if (tool === 'text' || tool === 'stickyNote') {
      setTimeout(() => {
        console.log('📝 Auto-creating shape from keyboard shortcut:', tool);
        handleAddShape(tool);
      }, 100);
    }
  }, [toolHandlers.handleToolChange, setActiveTool, handleAddShape]);

    // Calculate current viewport center considering zoom and pan
    const calculateViewportCenter = useCallback(() => {
      if (!stageRef.current) return { x: 100, y: 100 };
      
      const stage = stageRef.current;
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      
      // Calculate center considering current pan and zoom
      return {
        x: (stageWidth / 2 - position.x) / scale,
        y: (stageHeight / 2 - position.y) / scale
      };
    }, [scale, position, stageRef]);

      

      const handleAddImageFromRecommendations = useCallback((imageUrl: string, altText: string) => {
      const viewportCenter = calculateViewportCenter();
      console.log('🎯 Adding image from recommendations at:', viewportCenter);
      
      addImage(imageUrl, undoRedoAddAction, viewportCenter);
    }, [calculateViewportCenter, addImage, undoRedoAddAction]);

     // Stage dimensions
      const handleApplyStage = useCallback(() => {
        console.log('🎯 Creating stage frame:', tempDimensions);
        
        if (tempDimensions.width > 0 && tempDimensions.height > 0) {
          // Calculate viewport center for stage frame placement
          const viewportCenter = calculateViewportCenter();
          
          const stageFrameId = addStageFrame(
            tempDimensions.width, 
            tempDimensions.height, 
            undoRedoAddAction,
            viewportCenter // PASS THE CENTER POSITION
          );
          console.log('✅ Stage frame created:', stageFrameId);
          
          setTempDimensions(defaultStageDimensions);
        } else {
          console.log('❌ Invalid stage dimensions');
        }
      }, [tempDimensions, addStageFrame, setTempDimensions, undoRedoAddAction, calculateViewportCenter]);

  // FIX 3: Keyboard shortcuts integration with proper handlers
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

  useEffect(() => {
  const loadSavedElements = async () => {
    if (currentBoardId && !isTemporaryBoard) {
      try {
        console.log("📥 Loading saved board elements...");
        const elements = await loadBoardElements(currentBoardId);
        setReactShapes(elements.reactShapes || []);
        setKonvaShapes(elements.konvaShapes || []);
        setStageFrames(elements.stageFrames || []);
        setImages(elements.images || []);
        setConnections(elements.connections || []);
        setLines(elements.lines || []); // Restore lines
        console.log("✅ Board elements loaded:", {
          reactShapes: elements.reactShapes?.length,
          konvaShapes: elements.konvaShapes?.length,
          stageFrames: elements.stageFrames?.length,
          images: elements.images?.length,
          connections: elements.connections?.length,
          lines: elements.lines?.length, // Log lines
        });
        if (elements.stageState) {
          const s = elements.stageState;
          boardState.setScale(s.scale ?? 1);
          boardState.setPosition(s.position ?? { x: 0, y: 0 });
        }
      } catch (error) {
        console.error("❌ Error loading board elements:", error);
      }
    }
  };
  loadSavedElements();
}, [currentBoardId, isTemporaryBoard]);

  return (
    <>
      {/* Premium Gradient Background */}
      <div className="relative w-screen h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-white">
        
        {/* Premium Glass Headers & Toolbars */}
       <BoardHeader
            boardInfo={boardInfo}
            isTemporaryBoard={isTemporaryBoard}
            currentBoardId={currentBoardId}
            showSaveModal={showSaveModal}
            setShowSaveModal={setShowSaveModal}
            handleCloseWithoutSave={handleCloseWithoutSave}
            onAddImageFromRecommendations={handleAddImageFromRecommendations}
            onPlayVideo={openVideo}
            // ADD THIS TO PASS ALL ELEMENTS
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

        {/* Premium Zoom & Controls Panel */}
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

        {/* Stage Component - UNCHANGED FUNCTIONALITY */}
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

      {/* Create Board Modal - NOW WITH PREMIUM STYLING */}
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