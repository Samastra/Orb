"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Konva from "konva";
import { useRef, useState, useEffect } from "react";

import ShapesMenu from "@/components/ShapesMenu";
import { Button } from "@/components/ui/button";
import GridLayer from "@/components/gridLayer";
import EditableTextComponent from "@/components/editableTextCompoent";

// --- Dynamic imports for Konva ---
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), {
  ssr: false,
});
import { Layer, Transformer } from "react-konva";

// ---------- Types ----------
type Action =
  | { type: "add"; node: Konva.Shape | Konva.Group }
  | { type: "add-react-shape"; shapeType: string; data: any }
  | {
      type: "update";
      id: string;
      prevAttrs: Konva.NodeConfig;
      newAttrs: Konva.NodeConfig;
    }
  | { type: "delete"; node: Konva.Shape | Konva.Group }
  | { type: "delete-react-shape"; data: any };

type Tool =
  | "select"
  | "stickyNote"
  | "text"
  | "rect"
  | "pen"
  | "connect"
  | "sort"
  | "join"
  | "ellipse"
  | "shapes"
  | "triangle"
  | "arrow"
  | "circle";

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
  sort: "/image/sort-icon.svg",
  join: "/image/join-icon.svg",
  circle: "/image/circle.svg",
  triangle: "/image/triangle.svg",
  arrow: "/image/arrow-icon.svg",
  ellipse: "/image/ellipse.svg",
};

// ---------- Main Board Page ----------
const BoardPage = () => {
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

  // ---------- Helpers ----------
  const addAction = (action: Action) => {
    setActions((prev) => [...prev, action]);
    setUndoneActions([]);
  };

  // Update transformer when selection changes
  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;
    
    const drawLayer = stageRef.current.findOne(".draw-layer") as Konva.Layer;
    if (!drawLayer) return;

    if (selectedNodeId) {
      // Check if selected node is a React shape or Konva shape
      const isReactShape = reactShapes.some(shape => shape.id === selectedNodeId);
      
      if (!isReactShape) {
        const node = drawLayer.findOne(`#${selectedNodeId}`);
        if (node) {
          trRef.current.nodes([node]);
          drawLayer.batchDraw();
        }
      } else {
        // For React shapes, we handle selection visually within the component
        trRef.current.nodes([]);
        drawLayer.batchDraw();
      }
    } else {
      trRef.current.nodes([]);
      drawLayer.batchDraw();
    }
  }, [selectedNodeId, reactShapes]);

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
    }
  };

  // ---------- Shape Handling ----------
  const handleShapeClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const node = e.target;
    if (!(node instanceof Konva.Shape || node instanceof Konva.Group)) return;
    
    setSelectedNodeId(node.id());
    e.cancelBubble = true; // Prevent event from propagating to stage
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedNodeId(null);
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

    switch (type) {
      case "rect":
        shape = new Konva.Rect({
          id: `shape-${Date.now()}`,
          x: center.x - 50,
          y: center.y - 50,
          width: 100,
          height: 100,
          fill: "#aae3ff",
          draggable: true,
        });
        break;

      case "circle":
        shape = new Konva.Circle({
          id: `shape-${Date.now()}`,
          x: center.x,
          y: center.y,
          radius: 50,
          fill: "blue",
          draggable: true,
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

      case "triangle":
        shape = new Konva.Line({
          id: `shape-${Date.now()}`,
          x: center.x,
          y: center.y,
          points: [0, 0, 50, 100, 100, 0],
          closed: true,
          fill: "blue",
          draggable: true,
        });
        break;

      case "arrow":
        shape = new Konva.Arrow({
          id: `shape-${Date.now()}`,
          points: [center.x, center.y, center.x + 100, center.y],
          pointerLength: 10,
          pointerWidth: 10,
          fill: "black",
          stroke: "black",
          strokeWidth: 2,
          draggable: true,
        });
        break;

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
        return; // Return early to avoid adding to Konva layer

      default:
        return;
    }

    if (shape) {
      shape.on("click", handleShapeClick);
      drawLayer.add(shape);
      drawLayer.batchDraw();
      addAction({ type: "add", node: shape });
    }
  };

  // ---------- Zoom & Pan ----------
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

  // ---------- JSX ----------
  return (
    <div className="relative w-screen h-screen bg-gray-50">
      {/* Top navbar */}
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
            <button>
              <img src="/image/review-bubble.svg" alt="recommendations" />
            </button>
            <Button>Invite</Button>
            <Button>Solo</Button>
          </div>
        </div>
      </section>

      {/* Tool bar */}
      <div className="absolute left-0 top-20 flex flex-col items-center">
        <div className="z-10 flex flex-col items-center space-y-4 bg-white p-3 m-5 rounded-md shadow-md">
          {/* Select */}
          <button
            onClick={() => setActiveTool("select")}
            className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
              activeTool === "select" ? "bg-blue-300" : "hover:bg-gray-300"
            }`}
          >
            <img src={toolIcons["select"]} alt="select" className="w-6 h-6" />
          </button>

          {/* Text */}
          <button
            onClick={() => addShape("text")}
            className="flex items-center justify-center my-1 w-10 h-10 rounded hover:bg-gray-300"
          >
            <img src={toolIcons["text"]} alt="text" className="w-6 h-6" />
          </button>

          {/* Shapes menu */}
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

        {/* Undo/redo */}
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

      {/* Zoom */}
      <div className="absolute z-10 bottom-0 right-0 flex items-center bg-white rounded-md m-4 p-3 shadow-md">
        <img src="/image/connect-nodes2.svg" alt="zoom-out" />
        <p>{Math.round(scale * 100)}%</p>
        <img src="/image/add-icon.svg" alt="zoom-in" />
      </div>

      {/* Stage */}
      <div className="absolute inset-0 z-0">
        <Stage
          width={typeof window !== "undefined" ? window.innerWidth : 800}
          height={typeof window !== "undefined" ? window.innerHeight : 600}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onTap={handleStageClick}
          draggable={activeTool === "select"}
          ref={(node) => {
            if (node) {
              stageRef.current = node;
              setStageInstance(node);
            }
          }}
          className="bg-white cursor-move"
        >
          <GridLayer stage={stageInstance} baseSize={30} color="#d6d4d4ff" />
          <Layer name="draw-layer">
            {/* Transformer for Konva shapes */}
            <Transformer
              ref={trRef}
              enabledAnchors={["top-left", "middle-top", "top-right", "middle-right","middle-left","middle-bottom", "bottom-right", "bottom-left"]}
              boundBoxFunc={(oldBox, newBox) => ({
                ...newBox,
                width: Math.max(30, newBox.width),
                height: Math.max(30, newBox.height),
              })}
            />
            {/* Render React-powered shapes (like editable text) */}
          
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
                          activeTool={activeTool} // Make sure this is passed
                          onSelect={() => setSelectedNodeId(shapeData.id)}
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
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default BoardPage;