// lib/connection-utils.ts

export type Side = "top" | "right" | "bottom" | "left";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Get the specific anchor point coordinate on a shape
export const getAnchorPoint = (rect: Rect, side: Side): Point => {
  switch (side) {
    case "top":
      return { x: rect.x + rect.width / 2, y: rect.y };
    case "right":
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
    case "bottom":
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
    case "left":
      return { x: rect.x, y: rect.y + rect.height / 2 };
  }
};

// Calculate the elbow path (Orthogonal Routing)
export const getOrthogonalPath = (
  start: Point,
  end: Point,
  startSide: Side,
  endSide: Side,
  padding: number = 20
): string => {
  const p1 = { ...start };
  const p2 = { ...end };

  // Move the start/end points outward by the padding amount
  // to create that little "stub" coming out of the shape
  switch (startSide) {
    case "top": p1.y -= padding; break;
    case "right": p1.x += padding; break;
    case "bottom": p1.y += padding; break;
    case "left": p1.x -= padding; break;
  }

  switch (endSide) {
    case "top": p2.y -= padding; break;
    case "right": p2.x += padding; break;
    case "bottom": p2.y += padding; break;
    case "left": p2.x -= padding; break;
  }

  // Calculate midpoints for the elbow turns
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  let path = `M ${start.x} ${start.y} L ${p1.x} ${p1.y}`;

  // Logic to determine the best route (Horizontal or Vertical first)
  // This is a simplified Manhattan routing.
  const isHorizontalStart = startSide === "left" || startSide === "right";
  const isHorizontalEnd = endSide === "left" || endSide === "right";

  if (isHorizontalStart && isHorizontalEnd) {
    // Both horizontal sides
    path += ` L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
  } else if (!isHorizontalStart && !isHorizontalEnd) {
    // Both vertical sides
    path += ` L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
  } else if (isHorizontalStart) {
    // Start Horizontal, End Vertical
    path += ` L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`;
  } else {
    // Start Vertical, End Horizontal
    path += ` L ${p1.x} ${p2.y} L ${p2.x} ${p2.y}`;
  }

  // Finish at the specific end point
  path += ` L ${end.x} ${end.y}`;

  return path;
};