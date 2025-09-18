"use client";

// dependencies import
import dynamic from "next/dynamic";
import Link from "next/link";
import Konva from "konva";
import { useRef, useState, useEffect } from "react";

// components imports
import ShapesMenu from "@/components/ShapesMenu";
import { Button } from "@/components/ui/button";
import GridLayer from "@/components/gridLayer";

// --- Dynamic imports for Konva ---
const Stage = dynamic(() => import("react-konva").then((mod) => mod.Stage), { ssr: false });
import { Layer } from "react-konva"; // we only use react-konva Layer in JSX
import { relative } from "path";


type Action =
  | { type: "add"; node: Konva.Group | Konva.Shape }
  | { type: "update"; id: string; prevAttrs: Konva.NodeConfig; newAttrs: Konva.NodeConfig }
  | { type: "delete"; node: Konva.Group | Konva.Shape };


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

// Main Board Page Component
const BoardPage = () => {
  // direct reference to the konva stage allowing you to manipulate it
  const stageRef = useRef<Konva.Stage | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastLine, setLastLine] = useState<Konva.Line | null>(null);


  const [actions, setActions] = useState<Action[]>([]);
  const [undoneActions, setUndoneActions] = useState<Action[]>([]);



        // changing cursors functionality

                useEffect(() => {
          if (!stageRef.current) return;

          const container = stageRef.current.container();

          if (activeTool && toolIcons[activeTool]) {
            // Apply custom cursor using the tool icon
            container.style.cursor = `url(${toolIcons[activeTool]}) 12 12, auto`;
          } else {
            // fallback to default cursor
            container.style.cursor = "default";
          }
        }, [activeTool]);



      // delete key functionality

      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Delete" || e.key === "Backspace") {
            const stage = stageRef.current;
            if (!stage) return;

            const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
            if (!drawLayer) return;

            // find the active transformer
            const tr = drawLayer.findOne("Transformer") as Konva.Transformer;
            if (tr) {
              const nodes = tr.nodes();
              nodes.forEach((node) => {
                if (node instanceof Konva.Group || node instanceof Konva.Shape) {
                  setActions((prev) => [
                    ...prev,
                    { type: "delete", node: node as Konva.Group | Konva.Shape }
                  ]);
                  setUndoneActions([]);
                  node.destroy();
                }
              });
              tr.destroy();
              drawLayer.batchDraw();
            }
          }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }, [stageRef]);

  //  history and redo functionality can be implemented here

      const addAction = (action: Action) => {
      setActions((prev) => [...prev, action]);
      setUndoneActions([]); // clear redo stack on new action
    };


      // undo funtionality
      const undo = () => {
          if (actions.length === 0) return;

          const last = actions[actions.length - 1];
          setActions((prev) => prev.slice(0, -1));
          setUndoneActions((prev) => [...prev, last]);

          if (last.type === "add") {
            last.node.destroy();
          } else if (last.type === "update") {
            const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
            if (!drawLayer) return;
            const target = drawLayer.findOne(`#${last.id}`);
            if (target) {
              target.setAttrs(last.prevAttrs);
              drawLayer.batchDraw();
            }
          }

          if (last.type === "delete") {
              const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
              if (drawLayer) {
                drawLayer.add(last.node);
                drawLayer.batchDraw();
              }
            }
        };


        // redo functionality
                  
       const redo = () => {
          if (undoneActions.length === 0) return;

          const last = undoneActions[undoneActions.length - 1];
          setUndoneActions((prev) => prev.slice(0, -1));
          setActions((prev) => [...prev, last]);

          if (last.type === "add") {
            const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
            if (drawLayer) {
              drawLayer.add(last.node);
              drawLayer.batchDraw();
            }
          } else if (last.type === "update") {
            const drawLayer = stageRef.current?.findOne(".draw-layer") as Konva.Layer;
            if (!drawLayer) return;
            const target = drawLayer.findOne(`#${last.id}`);
            if (target) {
              target.setAttrs(last.newAttrs);
              drawLayer.batchDraw();
            }
          }
          if (last.type === "delete") {
            last.node.destroy();
          }

        };
  // toggle draggable on all nodes in draw-layer when tool changes
  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const drawLayer = stage.findOne(".draw-layer") as Konva.Layer | null;
    if (!drawLayer) return;

    drawLayer.getChildren().forEach((node) => {
      // @ts-ignore - Konva.Node has draggable setter at runtime
      node.draggable(activeTool === "select");
    });

    drawLayer.batchDraw();
  }, [activeTool]);

  const getRelativePointerPosition = (stage: Konva.Stage) => {
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return transform.point(pos);
  };


      const handleShapeClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
          const node = e.target;

          if (node instanceof Konva.Shape || node instanceof Konva.Group) {
            const stage = stageRef.current;
            if (!stage) return;

            const layer = stage.findOne(".draw-layer") as Konva.Layer;
            if (!layer) return;

            // remove old transformers
            layer.find("Transformer").forEach(tr => tr.destroy());

            // add new transformer
            const tr = new Konva.Transformer({
              nodes: [node],
              enabledAnchors: [
                "top-left", "top-right", "bottom-left", "bottom-right"
              ],
              boundBoxFunc: (oldBox, newBox) => ({
                ...newBox,
                width: Math.max(30, newBox.width),
                height: Math.max(30, newBox.height),
              }),
            });

            layer.add(tr);
            layer.batchDraw();
          }
        };



    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {

          if (document.querySelector("textarea")) {
            return; // ignore clicks while typing
          }


          if (!stageRef.current) return;
          const stage = stageRef.current;

          const pos = getRelativePointerPosition(stage);
          if (!pos) return;

          const isSelectMode: boolean = activeTool === "select";
          const drawLayer = stage.findOne(".draw-layer") as Konva.Layer | null;
          if (!drawLayer) return;

          switch (activeTool) {
            case "rect": {
              const rect = new Konva.Rect({
                id: `shape-${Date.now()}`,
                x: pos.x,
                y: pos.y,
                width: 100,
                height: 100,
                fill: "#aae3ff",
                draggable: isSelectMode,
              });

              rect.on("click", handleShapeClick);
              rect.on("transformend dragend", (e) => {
              const node = e.target;
              const prevAttrs = { ...node.getAttrs() }; // snapshot before change
              setActions((prev) => [
                ...prev,
                { type: "update", id: node.id(), prevAttrs, newAttrs: { ...node.getAttrs() } },
              ]);
              setUndoneActions([]);
            });
              drawLayer.add(rect);
              drawLayer.batchDraw();


              addAction({ type: "add", node: rect });
              setActions((prev) => [...prev, { type: "add", node: rect }]);
              setUndoneActions([]); // clear redo stack
              break;
            }

            case "circle": {
              const circle = new Konva.Circle({
                id: `shape-${Date.now()}`,
                x: pos.x,
                y: pos.y,
                radius: 50,
                fill: "blue",
                draggable: isSelectMode,
              });

              circle.on("click", handleShapeClick);
              circle.on("transformend", () => addAction({ type: "add", node: circle }));
              circle.on("dragend", () => addAction({ type: "add", node: circle }));
              drawLayer.add(circle);
              drawLayer.batchDraw();
              addAction({ type: "add", node: circle });
              break;
            }

            case "ellipse": {
              const ellipse = new Konva.Ellipse({
                id: `shape-${Date.now()}`,
                x: pos.x,
                y: pos.y,
                radiusX: 80,
                radiusY: 50,
                fill: "pink",
                draggable: isSelectMode,
              });

              ellipse.on("click", handleShapeClick);
              ellipse.on("transformend", () => addAction({ type: "add", node: ellipse }));
              ellipse.on("dragend", () => addAction({ type: "add", node: ellipse }));
              drawLayer.add(ellipse);
              drawLayer.batchDraw();
              addAction({ type: "add", node: ellipse });
              break;
            }

            case "triangle": {
              const triangle = new Konva.Line({
                id: `shape-${Date.now()}`,
                x: pos.x,
                y: pos.y,
                points: [0, 0, 50, 100, 100, 0],
                closed: true,
                fill: "blue",
                draggable: isSelectMode,
              });

              triangle.on("click", handleShapeClick);
              triangle.on("transformend", () => addAction({ type: "add", node: triangle }));
              triangle.on("dragend", () => addAction({ type: "add", node: triangle }));
              drawLayer.add(triangle);
              drawLayer.batchDraw();
              addAction({ type: "add", node: triangle });
              break;
            }

           case "text": {
                  if (isDrawing) return; // prevent multiple boxes while typing
                  setIsDrawing(true);

                  const textNode = new Konva.Text({
                    id: `shape-${Date.now()}`,
                    x: pos.x,
                    y: pos.y,
                    text: "Add text here...",
                    fontSize: 20,
                    fill: "black",
                    draggable: false,
                  });

                  // allow selection/transform if select tool is active
                  textNode.on("click", handleShapeClick);

                  // track updates for undo/redo
                  textNode.on("transformend dragend", (e) => {
                    const node = e.target as Konva.Text;
                    const prevAttrs = { ...node.getAttrs() };
                    addAction({
                      type: "update",
                      id: node.id(),
                      prevAttrs,
                      newAttrs: { ...node.getAttrs() },
                    });
                  });

                  drawLayer.add(textNode);
                  drawLayer.batchDraw();
                  addAction({ type: "add", node: textNode });

                  // ✅ helper function to open a textarea over textNode
                 const createTextarea = () => {
                        const stageBox = stage.container().getBoundingClientRect();
                        const rect = textNode.getClientRect();

                        const area = document.createElement("textarea");
                        document.body.appendChild(area);

                        const fill = textNode.fill();
                        if (typeof fill === "string") {
                          area.style.color = fill;
                        }

                        area.value = textNode.text();

                        // style to match Konva text
                        area.style.position = "absolute";
                        area.style.top = stageBox.top + rect.y + "px";
                        area.style.left = stageBox.left + rect.x + "px";
                        area.style.width = `${rect.width || textNode.width()}px`;
                        area.style.height = `${rect.height || textNode.fontSize()}px`;

                        area.style.fontSize = textNode.fontSize() + "px";
                        area.style.fontFamily = textNode.fontFamily();
                        area.style.lineHeight = textNode.lineHeight().toString();
                        area.style.border = "1px solid #ccc";
                        area.style.padding = "2px";
                        area.style.margin = "0px";
                        area.style.outline = "none";
                        area.style.resize = "none";
                        area.style.background = "transparent";
                        area.style.overflow = "hidden";
                        area.style.whiteSpace = "pre";
                       

                        area.focus();

                        // live update while typing
                        area.addEventListener("input", () => {
                          textNode.text(area.value);
                          drawLayer.batchDraw();
                        });

                        const commitText = () => {
                          const val = area.value.trim();
                          textNode.text(val.length > 0 ? val : "Add text here...");
                          document.body.removeChild(area);
                          setIsDrawing(false);
                          drawLayer.batchDraw();
                        };

                        area.addEventListener("keydown", (e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            commitText();
                          }
                        });

                        area.addEventListener("blur", commitText);
                      };


                  // ✅ open textarea immediately on creation
                  createTextarea();

                  // ✅ allow re-edit on double click
                  textNode.on("dblclick dbltap", () => {
                    createTextarea();
                  });

                  break;
                }



    case "pen": {
      setIsDrawing(true);
      const newLine = new Konva.Line({
        id: `shape-${Date.now()}`,
        stroke: "black",
        strokeWidth: 2,
        globalCompositeOperation: "source-over",
        points: [pos.x, pos.y],
        draggable: false,
      });

      drawLayer.add(newLine);
      drawLayer.batchDraw();
      setLastLine(newLine);
      addAction({ type: "add", node: newLine });
      break;
    }

    default:
      break;
  }
};

  // handling mouse move
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !lastLine || !stageRef.current) return;
    const stage = stageRef.current;

    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    const newPoints = lastLine.points().concat([pos.x, pos.y]);
    lastLine.points(newPoints);

    const node = stage.findOne(".draw-layer");
    if (node && node instanceof Konva.Layer) {
      node.batchDraw();
    }
  };

  const handleMouseUp = () => {
    if (activeTool !== "pen") return;
    setIsDrawing(false);
    setLastLine(null);
  };

  // zooming and panning logic
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

  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);

  return (
    <div className="relative w-screen h-screen bg-gray-50">
      <section className="  flex items-center justify-between gap-4 ">
        {/* navbar -div */}
        <div className=" fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-white px-6 py-3 shadow-[0_0_30px_rgba(0,0,0,0.15)]">
          {/* left part */}
          <div className="flex items-center justify-between gap-3">
            <button>
              {" "}
              <img src="/image/three-dots-vertical.svg" alt="Menu" />{" "}
            </button>
            <Link href={"/"}> Orb</Link>
            <p>- Vector(physics)-Study</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button>
              {" "}
              <img src="/image/mic.svg" alt="microphone" />{" "}
            </button>
            <button>
              {" "}
              <img src="/image/review-bubble.svg" alt="recommendations" />{" "}
            </button>

            <Button>Invite</Button>
            <Button> Solo</Button>
          </div>
        </div>
      </section>

      {/* tool bar */}
      <div className="absolute left-0 top-20 flex flex-col items-center">
        <div className="z-10 flex flex-col items-center space-y-4 bg-white p-3 m-5 rounded-md shadow-[0_0_30px_rgba(0,0,0,0.15)] w-15 ">
          <div>
            {(
              ["select", "shapes", "text", "pen", "stickyNote", "connect"] as Tool[]
            ).map((tool) =>
              tool === "shapes" ? (
                <ShapesMenu key="shapes" activeTool={activeTool} setActiveTool={setActiveTool} toolIcons={toolIcons} />
              ) : (
                <button
                  key={tool}
                  onClick={() => setActiveTool(tool)}
                  className={`flex items-center justify-center my-1 w-10 h-10 rounded ${
                    activeTool === tool ? "bg-blue-300" : "hover:bg-gray-300"
                  }`}
                >
                  <img src={toolIcons[tool]} alt={tool} className="w-6 h-6" />
                </button>
              )
            )}
          </div>
        </div>

        <div className="z-10 flex flex-col items-center space-y-4 bg-white p-3 m-5 rounded-md shadow-[0_0_30px_rgba(0,0,0,0.15)] w-15 ">
          <button onClick={undo} className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-300">
            <img src="/image/undo.svg" alt="undo" />
          </button>
          <button onClick={redo} className="flex items-center justify-center w-10 h-10 rounded hover:bg-gray-300">
            <img src="/image/redo.svg" alt="redo" />
          </button>
        </div>
      </div>

      {/* zoom */}
      <div className="absolute z-10 bottom-0 right-0 flex items-center justify-between bg-white rounded-md m-4 p-3 shadow-[0_0_30px_rgba(0,0,0,0.15)]">
        <img src="/image/connect-nodes2.svg" alt="zoom-out" />
        <p>{scale * 100}%</p>
        <img src="/image/add-icon.svg" alt="zoom-in" />
      </div>

      {/* Fullscreen Canvas */}
      <div className="absolute inset-0 z-0">
        <Stage
          width={typeof window !== "undefined" ? window.innerWidth : 800}
          height={typeof window !== "undefined" ? window.innerHeight : 600}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          onWheel={handleWheel}
          draggable={activeTool === "select"}
          ref={(node) => {
            if (node) {
              stageRef.current = node;
              setStageInstance(node); // 🔑 update state when stage is mounted
            }
          }}
          className="bg-white cursor-move"
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <GridLayer stage={stageInstance} baseSize={30} color="#d6d4d4ff" />

          {/* important: draw-layer name must match queries above */}
          <Layer name="draw-layer" />
        </Stage>
      </div>
    </div>
  );
};

export default BoardPage;
