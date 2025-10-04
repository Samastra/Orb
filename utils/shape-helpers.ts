import Konva from "konva";
import { Tool, ReactShape, Action } from "../types/board-types";

export const createShape = (
  type: Tool,
  center: { x: number; y: number },
  activeTool: Tool | null
): { shape: Konva.Shape | null; shapeId: string } | { textShape: ReactShape; shapeId: string } | null => {
  const shapeId = `shape-${Date.now()}`;

  switch (type) {
    case "rect":
      return {
        shape: new Konva.Rect({
          id: shapeId,
          x: center.x - 50,
          y: center.y - 50,
          width: 100,
          height: 100,
          fill: "#aae3ff",
          draggable: activeTool === "select",
          name: 'selectable-shape',
        }),
        shapeId
      };

    case "arrow":
      return {
        shape: new Konva.Arrow({
          id: shapeId,
          points: [center.x, center.y, center.x + 100, center.y],
          pointerLength: 10,
          pointerWidth: 10,
          fill: "black",
          stroke: "black",
          strokeWidth: 2,
          draggable: activeTool === "select",
          name: 'selectable-shape'
        }),
        shapeId
      };

    case "circle":
      return {
        shape: new Konva.Circle({
          id: shapeId,
          x: center.x,
          y: center.y,
          radius: 50,
          fill: "#aae3ff",
          draggable: activeTool === "select",
          name: 'selectable-shape'
        }),
        shapeId
      };

    case "ellipse":
      return {
        shape: new Konva.Ellipse({
          id: shapeId,
          x: center.x,
          y: center.y,
          radiusX: 80,
          radiusY: 50,
          fill: "pink",
          draggable: activeTool === "select",
          name: 'selectable-shape'
        }),
        shapeId
      };

    case "text":
      const newTextShape: ReactShape = {
        id: shapeId,
        type: 'text',
        x: center.x,
        y: center.y,
        text: "Double click to edit",
        fontSize: 20,
        fill: "black",
      };
      return { textShape: newTextShape, shapeId };

    default:
      return null;
  }
};

export const addStageWithDimensions = (
  width: number,
  height: number,
  stageRef: React.RefObject<Konva.Stage | null>,
  scale: number,
  position: { x: number; y: number },
  activeTool: Tool | null,
  addAction: (action: Action) => void,
  setSelectedNodeId: (id: string | null) => void
) => {
  if (!stageRef.current) return;
  const stage = stageRef.current;
  const drawLayer = stage.findOne(".draw-layer") as Konva.Layer;
  if (!drawLayer) return;

  const center = {
    x: stage.width() / 2 / scale - position.x / scale,
    y: stage.height() / 2 / scale - position.y / scale,
  };

  const shapeId = `shape-${Date.now()}`;

  const shape = new Konva.Rect({
    id: shapeId,
    x: 0,
    y: 0,
    width: width,
    height: height,
    fill: "#ffffffff",
    name: 'stage-rect',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 0.6,
  });

  const stageGroup = new Konva.Group({
    id: shapeId,
    x: center.x - width / 2,
    y: center.y - height / 2,
    draggable: activeTool === "select",
    name: 'selectable-shape',
  });

  stageGroup.add(shape);
  drawLayer.add(stageGroup);
  drawLayer.batchDraw();

  addAction({ type: "add", node: stageGroup });

  if (activeTool === "select") {
    setSelectedNodeId(shapeId);
  }
};