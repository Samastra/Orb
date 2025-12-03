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

// Helper: Snap to nearest pixel to avoid float precision errors
const snap = (n: number) => Math.round(n);

export const getAnchorPoint = (rect: Rect, side: Side): Point => {
  switch (side) {
    case "top":
      return { x: snap(rect.x + rect.width / 2), y: snap(rect.y) };
    case "right":
      return { x: snap(rect.x + rect.width), y: snap(rect.y + rect.height / 2) };
    case "bottom":
      return { x: snap(rect.x + rect.width / 2), y: snap(rect.y + rect.height) };
    case "left":
      return { x: snap(rect.x), y: snap(rect.y + rect.height / 2) };
  }
};

// New helper to create rounded corner path data
const createRoundedPath = (points: number[], radius: number): string => {
  if (points.length < 4) return "";

  let path = `M ${points[0]} ${points[1]}`;
  
  for (let i = 2; i < points.length - 2; i += 2) {
    const prevX = points[i - 2];
    const prevY = points[i - 1];
    const currX = points[i];
    const currY = points[i + 1];
    const nextX = points[i + 2];
    const nextY = points[i + 3];

    // Direction vectors
    const dir1X = currX - prevX;
    const dir1Y = currY - prevY;
    const dir2X = nextX - currX;
    const dir2Y = nextY - currY;

    // Normalize
    const len1 = Math.sqrt(dir1X * dir1X + dir1Y * dir1Y);
    const len2 = Math.sqrt(dir2X * dir2X + dir2Y * dir2Y);
    const nd1X = dir1X / len1;
    const nd1Y = dir1Y / len1;
    const nd2X = dir2X / len2;
    const nd2Y = dir2Y / len2;

    // Determine actual corner radius based on segment lengths
    const r = Math.min(radius, len1 / 2, len2 / 2);

    // Start and end of the curve
    const startX = currX - nd1X * r;
    const startY = currY - nd1Y * r;
    const endX = currX + nd2X * r;
    const endY = currY + nd2Y * r;

    // Line to the start of the curve
    path += ` L ${startX} ${startY}`;
    // Quadratic Bezier curve to the end of the curve, using corner as control point
    path += ` Q ${currX} ${currY} ${endX} ${endY}`;
  }

  // Line to the last point
  path += ` L ${points[points.length - 2]} ${points[points.length - 1]}`;

  return path;
};


export const getOrthogonalPath = (
  start: Point,
  end: Point,
  startSide: Side,
  endSide: Side,
  padding: number = 40,
  cornerRadius: number = 20
): string => {
  const points: number[] = [];

  // Snap Inputs
  const sx = snap(start.x);
  const sy = snap(start.y);
  const ex = snap(end.x);
  const ey = snap(end.y);

  // 1. Start
  points.push(sx, sy);

  // 2. Padding Start (Stub)
  let p1x = sx, p1y = sy;
  switch (startSide) {
    case "top":    p1y -= padding; break;
    case "bottom": p1y += padding; break;
    case "right":  p1x += padding; break;
    case "left":   p1x -= padding; break;
  }
  points.push(snap(p1x), snap(p1y));

  // 3. Padding End (Target approach)
  let p2x = ex, p2y = ey;
  switch (endSide) {
    case "top":    p2y -= padding; break;
    case "bottom": p2y += padding; break;
    case "right":  p2x += padding; break;
    case "left":   p2x -= padding; break;
  }
  
  // Snap intermediates
  p2x = snap(p2x);
  p2y = snap(p2y);

  // 4. Calculate Midpoints (Manhattan Routing)
  const isStartVertical = startSide === "top" || startSide === "bottom";
  const isEndVertical = endSide === "top" || endSide === "bottom";

  if (isStartVertical === isEndVertical) {
      if (isStartVertical) {
          const midY = snap((p1y + p2y) / 2);
          points.push(p1x, midY);
          points.push(p2x, midY);
      } else {
          const midX = snap((p1x + p2x) / 2);
          points.push(midX, p1y);
          points.push(midX, p2y);
      }
  } else {
      if (isStartVertical) {
          points.push(p1x, p2y); 
      } else {
          points.push(p2x, p1y);
      }
  }

  points.push(p2x, p2y);
  points.push(ex, ey);

  return createRoundedPath(points, cornerRadius);
};