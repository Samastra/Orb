import { Tool } from "../types/board-types";

export const toolIcons: Record<Tool, string> = {
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
  stage: "/image/rectangle.svg",
};

export const shapeOptions = [
  { value: "rect", label: "Rectangle", icon: "/image/square.svg" },
  { value: "circle", label: "Circle", icon: "/image/circle.svg" },
  { value: "triangle", label: "Triangle", icon: "/image/triangle.svg" },
  { value: "arrow", label: "Arrow", icon: "/image/line.svg" },
];

export const defaultStageDimensions = { width: 100, height: 25 };
export const defaultBoardInfo = { title: "Untitled Board", category: "" };