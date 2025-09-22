"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Konva from "konva";
import { useRef, useState, useEffect, useCallback } from "react";

import ShapesMenu from "@/components/ShapesMenu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import GridLayer from "@/components/gridLayer";
import EditableTextComponent from "@/components/editableTextCompoent";

import ResourceList from "@/components/ResourceList";

// --- Dynamic imports for Konva ---
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), {
  ssr: false,
});
import { Layer, Transformer, Line } from "react-konva"; // Added Line import


// ---------- Types ----------
type Action =
  | { type: "add"; node: Konva.Shape | Konva.Group }
  | { type: "add-react-shape"; shapeType: string; data: any }
  | { type: "add-line"; line: { tool: 'brush' | 'eraser', points: number[] } }
  | {
      type: "update";
      id: string;
      prevAttrs: Konva.NodeConfig;
      newAttrs: Konva.NodeConfig;
    }
  | { type: "delete"; node: Konva.Shape | Konva.Group }
  | { type: "delete-react-shape"; data: any }
  | { type: "delete-line"; lineIndex: number };

type Tool =
  | "select"
  | "stickyNote"
  | "text"
  | "rect"
  | "pen"
  | "connect"
  | "sort"
  | "ellipse"
  | "shapes"
  | "triangle"
  | "arrow"
  | "circle"
  | "eraser";

type ReactShape = {
  id: string;
  type: string;
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fill?: string;
};

if (typeof window !== 'undefined') {
  (Konva as any)._fixTextRendering = true;
}

const toolIcons: Record<Tool, string> = {
  select: "/image/navigation-fill.svg",
  stickyNote: "/image/stickynotes.svg",
  text: "/image/text-icon.svg",
  rect: "/image/square.svg",
  shapes: "/image/shapes.svg",
  pen: "/image/edit-pen.svg",
  connect: "/image/connect-nodes2.svg",
  eraser: "/image/eraser.svg",
  sort: "/image/sort-grid.svg",
  circle: "/image/circle.svg",
  triangle: "/image/triangle.svg",
  arrow: "/image/arrow-icon.svg",
  ellipse: "/image/ellipse.svg",
};

// ---------- Main Board Page ----------
const BoardPage = () => {
  // SIMPLIFIED CONNECTION STATE - No shape dependency!
  const [connectionStart, setConnectionStart] = useState<{ x: number; y: number } | null>(null);
  const [tempConnection, setTempConnection] = useState<Konva.Line | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const stageRef = useRef<Konva.Stage | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const [actions, setActions] = useState<Action[]>([]);
  const [undoneActions, setUndoneActions] = useState<Action[]>([]);
  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [reactShapes, setReactShapes] = useState<ReactShape[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [drawingMode, setDrawingMode] = useState<'brush' | 'eraser'>('brush');
  const [lines, setLines] = useState<Array<{tool: 'brush' | 'eraser', points: number[]}>>([]);
  const isDrawing = useRef(false);
  const [showResources, setShowResources] = useState(false);

  // ---------- Helpers ----------
  const addAction = (action: Action) => {
    setActions((prev) => [...prev, action]);
    setUndoneActions([]);
  };

  // Add cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      if (trRef.current) {
        trRef.current.nodes([]);
        trRef.current.destroy();
      }
    };
  }, []);

 const updateTransformer = useCallback(() => {
  if (!trRef.current || !stageRef.current || !selectedNodeId) {
    if (trRef.current) {
      trRef.current.nodes([]);
    }
    return;
  }

  const drawLayer = stageRef.current.findOne(".draw-layer") as Konva.Layer;
  if (!drawLayer) return;

  const node = drawLayer.findOne(`#${selectedNodeId}`);
  
  if (node && node instanceof Konva.Shape && node.isVisible()) {
    try {
      trRef.current.nodes([node]);
      trRef.current.moveToTop();
      drawLayer.batchDraw();
    } catch (error) {
      console.warn('Transformer error:', error);
      trRef.current.nodes([]);
    }
  } else {
    trRef.current.nodes([]);
  }
}, [selectedNodeId]);

  useEffect(() => {
    if (activeTool !== "select" && trRef.current) {
      trRef.current.nodes([]);
      setSelectedNodeId(null);
    }
  }, [activeTool]);

  // ---------- SIMPLIFIED CONNECTION TOOL LOGIC ----------
  const getStagePointerPosition = () => {
    if (!stageRef.current) return null;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return null;
    
    return {
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale
    };
  };

  // Start connection from current mouse position
  const handleConnectionStart = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect") return;
    
    e.evt.preventDefault();
    const stagePos = getStagePointerPosition();
    if (!stagePos) return;

    setConnectionStart({ x: stagePos.x, y: stagePos.y });
    setIsConnecting(true);
    
    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    if (drawLayer) {
      const line = new Konva.Line({
        points: [stagePos.x, stagePos.y, stagePos.x, stagePos.y],
        stroke: '#007bff',
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        dash: [5, 5],
        listening: false,
      });
      drawLayer.add(line);
      setTempConnection(line);
      drawLayer.batchDraw();
    }
  };

  // Update connection line as mouse moves
  const handleConnectionMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect" || !isConnecting || !tempConnection || !connectionStart) return;
    
    const stagePos = getStagePointerPosition();
    if (!stagePos) return;

    // Update line to follow mouse
    tempConnection.points([connectionStart.x, connectionStart.y, stagePos.x, stagePos.y]);
    tempConnection.getLayer()?.batchDraw();
  };

  // Finalize connection
  const handleConnectionEnd = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect" || !isConnecting || !tempConnection || !connectionStart) return;
    
    const stagePos = getStagePointerPosition();
    if (!stagePos) return;

    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    
    // Create permanent connection line
    const connectionLine = new Konva.Arrow({
      points: [connectionStart.x, connectionStart.y, stagePos.x, stagePos.y],
      stroke: '#6c757d',
      strokeWidth: 3,
      fill: '#6c757d',
      pointerLength: 12,
      pointerWidth: 12,
      // Connection lines should also only be draggable in select mode
      draggable: (activeTool as string) === "select",
      lineCap: 'round',
      lineJoin: 'round',
    });
    
    if (drawLayer) {
      drawLayer.add(connectionLine);
      connectionLine.on("click", handleShapeClick);
      addAction({ type: "add", node: connectionLine });
    }
    
    // Clean up temporary line
    if (drawLayer && tempConnection) {
      tempConnection.destroy();
      drawLayer.batchDraw();
    }
    
    setTempConnection(null);
    setConnectionStart(null);
    setIsConnecting(false);
  };

  // Visual feedback for connection tool
  const handleConnectionHover = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "connect" || isConnecting) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    container.style.cursor = 'crosshair';
  };

  // ---------- PEN TOOL LOGIC (KONVA LINE APPROACH) ----------
  const handleDrawingMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'pen') return;

    e.cancelBubble = true;
    isDrawing.current = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Start a new line
    setLines(prev => [...prev, { 
      tool: drawingMode, 
      points: [pos.x, pos.y] 
    }]);
  };

  const handleDrawingMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== 'pen' || !isDrawing.current) return;

    e.cancelBubble = true;
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const point = stage.getPointerPosition();
    if (!point) return;

    // Add point to the current line
    setLines(prev => {
      if (prev.length === 0) return prev;
      
      const lastLine = prev[prev.length - 1];
      const updatedLine = {
        ...lastLine,
        points: lastLine.points.concat([point.x, point.y])
      };
      
      return [...prev.slice(0, -1), updatedLine];
    });
  };

  const handleDrawingMouseUp = () => {
    if (activeTool !== 'pen') return;
    
    if (isDrawing.current) {
      // Add to undo history when finishing a line
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        addAction({ type: "add-line", line: lastLine });
      }
    }
    
    isDrawing.current = false;
  };

  const handleDrawingTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool !== 'pen') return;
    handleDrawingMouseDown(e as any);
  };

  const handleDrawingTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool !== 'pen') return;
    handleDrawingMouseMove(e as any);
  };

  const handleDrawingTouchEnd = () => {
    if (activeTool !== 'pen') return;
    handleDrawingMouseUp();
  };

  // Centralized mouse handlers
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingMouseDown(e);
    } else if (activeTool === 'connect') {
      handleConnectionStart(e);
    } else if (activeTool === 'select') {
      if(!(e.target instanceof Konva.Transformer) && e.target !== e.target.getStage()) {
        handleShapeClick(e);
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingMouseMove(e);
    } else if (activeTool === 'connect') {
      handleConnectionMove(e);
      handleConnectionHover(e);
    }
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingMouseUp();
    } else if (activeTool === 'connect') {
      handleConnectionEnd(e);
    }
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingTouchStart(e);
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingTouchEnd();
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (activeTool === 'pen') {
      handleDrawingTouchMove(e);
    }
  };

  // Tool change handler
  const handleToolChange = (tool: Tool | null) => {
    // Clean up drawing state when switching away from pen
    if (activeTool === 'pen' && tool !== 'pen') {
      isDrawing.current = false;
    }
    
    setActiveTool(tool);
    
    if (!stageRef.current) return;
    
    const drawLayer = stageRef.current.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    // Update draggable state for all shapes
    const shapes = drawLayer.find((node: Konva.Node) => 
      node instanceof Konva.Shape && 
      !(node instanceof Konva.Transformer) &&
      node.name() === 'selectable-shape'
    ) as unknown as Konva.Shape[];
    
    shapes.forEach((shape: Konva.Shape) => {
      shape.draggable(tool === "select");
    });
    
    // Clear transformer when switching away from select tool
    if (tool !== "select" && trRef.current) {
      trRef.current.nodes([]);
      setSelectedNodeId(null);
    }
    
    // Update cursor
    const container = stageRef.current.container();
    container.style.cursor = tool === "connect" ? 'crosshair' : 
                            tool === "select" ? 'move' : 
                            tool === "pen" ? 'crosshair' : 'default';
    
    drawLayer.batchDraw();
  };

  // Update transformer when selection changes
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    
    // Clear transformer if no selection
    if (!selectedNodeId) {
      trRef.current.nodes([]);
      return;
    }

    const drawLayer = stageRef.current.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    const node = drawLayer.findOne(`#${selectedNodeId}`);
    
    if (node && node instanceof Konva.Shape && node.isVisible()) {
      try {
        // Small delay to prevent recursion
        setTimeout(() => {
          if (trRef.current) {
            trRef.current.nodes([node]);
            drawLayer.batchDraw();
          }
        }, 0);
      } catch (error) {
        console.warn('Transformer setup error:', error);
        if (trRef.current) {
          trRef.current.nodes([]);
        }
      }
    } else {
      if (trRef.current) {
        trRef.current.nodes([]);
      }
    }
  }, [selectedNodeId]);

  // Undo
  const undo = () => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    setActions((prev) => prev.slice(0, -1));
    setUndoneActions((prev) => [...prev, lastAction]);

    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    switch (lastAction.type) {
      case "add":
        const target = drawLayer.findOne(`#${lastAction.node.id()}`);
        if (target) {
          target.destroy();
          drawLayer.batchDraw();
        }
        break;
      case "add-react-shape":
        setReactShapes((prev) => prev.filter(shape => shape.id !== lastAction.data.id));
        break;
      case "add-line":
        setLines(prev => prev.slice(0, -1));
        break;
      case "update":
        const updateTarget = drawLayer.findOne(`#${lastAction.id}`);
        if (updateTarget) {
          updateTarget.setAttrs(lastAction.prevAttrs);
          drawLayer.batchDraw();
        }
        break;
      case "delete":
        drawLayer.add(lastAction.node);
        drawLayer.batchDraw();
        break;
      case "delete-react-shape":
        setReactShapes((prev) => [...prev, lastAction.data]);
        break;
      case "delete-line":
        // Restore the deleted line using its index from undoneActions
        if (lastAction.lineIndex !== undefined) {
          const deletedLine = undoneActions[undoneActions.length - 1] as any;
          if (lines[lastAction.lineIndex]) {
            setLines(prev => {
              const restoredLine = prev[lastAction.lineIndex];
              return [...prev, restoredLine];
            });
          }
        }
        break;
    }
  };

  // Redo
  const redo = () => {
    if (undoneActions.length === 0) return;
    const lastAction = undoneActions[undoneActions.length - 1];
    setUndoneActions((prev) => prev.slice(0, -1));
    setActions((prev) => [...prev, lastAction]);

    const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    switch (lastAction.type) {
      case "add":
        drawLayer.add(lastAction.node);
        drawLayer.batchDraw();
        break;
      case "add-react-shape":
        setReactShapes((prev) => [...prev, lastAction.data]);
        break;
      case "add-line":
        setLines(prev => [...prev, lastAction.line]);
        break;
      case "update":
        const updateTarget = drawLayer.findOne(`#${lastAction.id}`);
        if (updateTarget) {
          updateTarget.setAttrs(lastAction.newAttrs);
          drawLayer.batchDraw();
        }
        break;
      case "delete":
        const deleteTarget = drawLayer.findOne(`#${lastAction.node.id()}`);
        if (deleteTarget) {
          deleteTarget.destroy();
          drawLayer.batchDraw();
        }
        break;
      case "delete-react-shape":
        setReactShapes((prev) => prev.filter(shape => shape.id !== lastAction.data.id));
        break;
      case "delete-line":
        setLines(prev => prev.filter((_, index) => index !== lastAction.lineIndex));
        break;
    }
  };

  // Shape Handling
 const handleShapeClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
  // Don't select if we're not in select mode
  if (activeTool !== 'select') {
    setSelectedNodeId(null);
    if (trRef.current) {
      trRef.current.nodes([]);
    }
    return;
  }

  const node = e.target;
  
  // If clicking on transformer itself, do nothing
  if (node instanceof Konva.Transformer) {
    return;
  }

  // Clicked on stage or non-shape object - deselect
  if (node instanceof Konva.Stage || !(node instanceof Konva.Shape)) {
    setSelectedNodeId(null);
    if (trRef.current) {
      trRef.current.nodes([]);
    }
    return;
  }

  // Prevent event from bubbling to stage
  e.cancelBubble = true;

  // Only update if selection actually changed
  if (selectedNodeId !== node.id()) {
    setSelectedNodeId(node.id());
    
    // Force immediate transformer update
    setTimeout(() => {
      updateTransformer();
    }, 0);
  }
};

  const addShape = (type: Tool) => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    const center = {
      x: stage.width() / 2 / scale - position.x / scale,
      y: stage.height() / 2 / scale - position.y / scale,
    };

    let shape: Konva.Shape | null = null;
    const shapeId = `shape-${Date.now()}`;

    switch (type) {
      case "rect":
        shape = new Konva.Rect({
          id: shapeId,
          x: center.x - 50,
          y: center.y - 50,
          width: 100,
          height: 100,
          fill: "#aae3ff",
          draggable: activeTool === "select",
          name: 'selectable-shape',
        });
        break;

      case "arrow":
        shape = new Konva.Arrow({
          id: shapeId,
          points: [center.x, center.y, center.x + 100, center.y],
          pointerLength: 10,
          pointerWidth: 10,
          fill: "black",
          stroke: "black",
          strokeWidth: 2,
          draggable: activeTool === "select",
          name: 'selectable-shape'
        });
        break;

      case "circle":
        shape = new Konva.Circle({
          id: shapeId,
          x: center.x,
          y: center.y,
          radius: 50,
          fill: "#aae3ff",
          draggable: activeTool === "select",
          name: 'selectable-shape'
        });
        break;

      case "ellipse":
        shape = new Konva.Ellipse({
          id: `shape-${Date.now()}`,
          x: center.x,
          y: center.y,
          radiusX: 80,
          radiusY: 50,
          fill: "pink",
          draggable: true,
        });
        break;

      case "pen":
        setActiveTool("pen");
        return;

      case "text":
        const newTextId = `text-${Date.now()}`;
        const newTextShape: ReactShape = {
          id: newTextId,
          type: 'text',
          x: center.x,
          y: center.y,
          text: "Double click to edit",
          fontSize: 20,
          fill: "black",
        };
        setReactShapes(prev => [...prev, newTextShape]);
        addAction({ type: "add-react-shape", shapeType: 'text', data: newTextShape });
        return;

      default:
        return;
    }

    if (shape) {
      shape.on("click", handleShapeClick);
      drawLayer.add(shape);
      drawLayer.batchDraw();
      addAction({ type: "add", node: shape });

      // Auto-select the new shape if in select mode
      if (activeTool === "select") {
        setSelectedNodeId(shapeId);
      }
    }
  };

  // Zoom & Pan
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? 1 : -1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage.scale({ x: newScale, y: newScale });
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();

    setScale(newScale);
    setPosition(newPos);
  };

  return (
    <div className="relative w-screen h-screen bg-gray-50">
      {showResources && (
        <div className="absolute top-20 right-0 z-10 w-80 p-5 mr-4 mb-4 h-auto rounded-md bg-white shadow-[0_0_30px_rgba(0,0,0,0.10)] border-l">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Related Resources</h2>
            <button className="bg-grey-300 p-2 rounded-full" onClick={() => setShowResources(false)}>✕</button>
          </div>
          <div className="bg-gray-200 rounded-md p-3">
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-bold">📚 Books</h3>
                <ul className="list-disc list-inside">
                  <li><a href="#">Book 1</a></li>
                  <li><a href="#">Book 2</a></li>
                </ul>
              </section>
              <section>
                <h3 className="font-bold">🌐 Websites</h3>
                <ul className="list-disc list-inside">
                  <li><a href="#">Resource 1</a></li>
                </ul>
              </section>
              <section>
                <h3 className="font-bold">🎥 Videos</h3>
                <ul className="list-disc list-inside">
                  <li><a href="#">Vector Tutorial</a></li>
                </ul>
              </section>
              <section>
                <h3 className="font-bold">📝 Public Boards</h3>
                <ul className="list-disc list-inside">
                  <li>Board 1</li>
                  <li>Board 2</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      <section className="flex items-center justify-between gap-4">
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-white px-6 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <button>
              <img src="/image/three-dots-vertical.svg" alt="Menu" />
            </button>
            <Link href={"/"}>Orb</Link>
            <p>- Vector(physics)-Study</p>
          </div>
          <div className="flex items-center gap-3">
            <button>
              <img src="/image/mic.svg" alt="microphone" />
            </button>
            {/* recommendations functionality */}
            <Sheet>

            <SheetTrigger asChild>
              <button>
                <img src="/image/review-bubble.svg" alt="recommendations" />
              </button>
            </SheetTrigger>
            <SheetContent className="">
              <SheetHeader>
                 <SheetTitle>
                   <p className="font-bold text-lg mb-4">AI Recommendations</p>
                 </SheetTitle>
              </SheetHeader>

              <ResourceList />
              </SheetContent>

            </Sheet>

            <Button>Invite</Button>
            <Button>Solo</Button>
          </div>
        </div>
      </section>

      <div className="absolute left-0 top-20 flex flex-col items-center">
        <div className="z-10 flex flex-col items-center space-y-4 bg-white p-3 m-5 rounded-md shadow-md">
          <button
            onClick={() => handleToolChange("select")}
            className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
              activeTool === "select" ? "bg-blue-300" : "hover:bg-gray-300"
            }`}
          >
            <img src={toolIcons["select"]} alt="select" className="w-6 h-6" />
          </button>

          <button
            onClick={() => addShape("text")}
            className="flex items-center justify-center my-1 w-10 h-10 rounded hover:bg-gray-300"
          >
            <img src={toolIcons["text"]} alt="text" className="w-6 h-6" />
          </button>

          <button
            onClick={() => addShape("stickyNote")}
            className="flex items-center justify-center my-1 w-10 h-10 rounded hover:bg-gray-300"
          >
            <img src={toolIcons["stickyNote"]} alt="sticky-note" className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              handleToolChange("pen");
              setDrawingMode("brush");
            }}
            className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
              activeTool === "pen" && drawingMode === "brush" ? "bg-blue-300" : "hover:bg-gray-300"
            }`}
          >
            <img src="/image/edit-pen.svg" alt="pen" className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              handleToolChange("pen");
              setDrawingMode("eraser");
            }}
            className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
              activeTool === "pen" && drawingMode === "eraser" ? "bg-blue-300" : "hover:bg-gray-300"
            }`}
          >
            <img src="/image/eraser.svg" alt="eraser" className="w-6 h-6" />
          </button>

          <button
            onClick={() => addShape("sort")}
            className="flex items-center justify-center my-1 w-10 h-10 rounded hover:bg-gray-300"
          >
            <img src={toolIcons["sort"]} alt="sort" className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleToolChange("connect")}
            className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
              activeTool === "connect" ? "bg-blue-300" : "hover:bg-gray-300"
            }`}
          >
            <img src={toolIcons["connect"]} alt="connect" className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowShapesMenu((prev) => !prev)}
            className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
              showShapesMenu ? "bg-blue-300" : "hover:bg-gray-300"
            }`}
          >
            <img src={toolIcons["shapes"]} alt="shapes" className="w-6 h-6" />
          </button>

          {showShapesMenu && (
            <ShapesMenu
              onSelectShape={(shapeType: Tool) => {
                addShape(shapeType);
                setShowShapesMenu(false);
              }}
            />
          )}
        </div>

        <div className="z-10 flex flex-col items-center space-y-4 bg-white p-3 m-5 rounded-md shadow-md">
          <button
            onClick={undo}
            className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-300"
          >
            <img src="/image/undo.svg" alt="undo" />
          </button>
          <button
            onClick={redo}
            className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-300"
          >
            <img src="/image/redo.svg" alt="redo" />
          </button>
        </div>
      </div>

      <div className="absolute z-10 bottom-0 right-0 flex items-center bg-white rounded-md m-4 p-3 shadow-md">
        <img src="/image/connect-nodes2.svg" alt="zoom-out" />
        <p>{Math.round(scale * 100)}%</p>
        <img src="/image/add-icon.svg" alt="zoom-in" />
      </div>

      <div className="absolute inset-0 z-0">
        <Stage
          width={typeof window !== "undefined" ? window.innerWidth : 800}
          height={typeof window !== "undefined" ? window.innerHeight : 600}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onClick={handleShapeClick}
          onTap={handleShapeClick}
          
          ref={(node) => {
            if (node) {
              stageRef.current = node;
              setStageInstance(node);
            }
          }}
          className="bg-white cursor-move"
          onMouseDown={
            (e) =>{
              if(activeTool === "select" && e.target === e.target.getStage()){
                setSelectedNodeId(null);
                if(trRef.current){
                  trRef.current.nodes([]);
                }
              }
              handleMouseDown(e)
            }
            }
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
          draggable={activeTool === "select"}
        >
          <GridLayer stage={stageInstance} baseSize={30} color="#d6d4d4ff" />
          <Layer name="draw-layer">

            {/* Render all the drawn lines */}
                  {lines.map((line, i) => (
                    <Line
                      key={i}
                      points={line.points}
                      stroke={line.tool === 'brush' ? '#000000' : '#ffffff'}
                      strokeWidth={5}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={
                        line.tool === 'eraser' ? 'destination-out' : 'source-over'
                      }
                      listening={false} // Don't interfere with other tools
                    />
                  ))}

            {reactShapes.map((shapeData) => {
              if (shapeData.type === 'text') {
                return (
                  <EditableTextComponent
                    key={shapeData.id}
                    id={shapeData.id}
                    x={shapeData.x}
                    y={shapeData.y}
                    text={shapeData.text || "Double click to edit"}
                    fontSize={shapeData.fontSize || 20}
                    fill={shapeData.fill || "black"}
                    isSelected={selectedNodeId === shapeData.id}
                    activeTool={activeTool}
                    onSelect={() => {
                      if(activeTool === "select"){
                        setSelectedNodeId(shapeData.id)
                      }
                    }}
                    onUpdate={(newAttrs) => {
                      setReactShapes(prev => 
                        prev.map(shape => 
                          shape.id === shapeData.id 
                            ? { ...shape, ...newAttrs }
                            : shape
                        )
                      );
                    }}
                  />
                );
              }
              return null;
            })}

            <Transformer
              ref={trRef}
              enabledAnchors={[
                "top-left", "top-right", 
                "bottom-left", "bottom-right",
                "middle-top", "middle-bottom", 
                "middle-left", "middle-right"
              ]}
              boundBoxFunc={(oldBox, newBox) => ({
                ...newBox,
                width: Math.max(20, newBox.width),
                height: Math.max(20, newBox.height),
              })}
              keepRatio={false}
              rotateEnabled={true}
              resizeEnabled={true}
              anchorSize={10}
              anchorStrokeWidth={1}
              borderStroke="#0099e5"
              borderStrokeWidth={1}
              anchorCornerRadius={4}
              anchorStroke="#0099e5"
              anchorFill="#ffffff"
              name="no-select"
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default BoardPage;