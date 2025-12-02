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

// 1. ROBUST SIMPLIFICATION
const simplifyPoints = (points: number[]): number[] => {
  if (points.length < 4) return points;

  const result: number[] = [];
  
  // A. First pass: Copy points but strictly remove identical or "very close" points
  // We treat anything within 1 pixel as the same point.
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    
    // If it's the first point, just add it
    if (result.length === 0) {
      result.push(x, y);
      continue;
    }

    // Compare with last added point
    const lastX = result[result.length - 2];
    const lastY = result[result.length - 1];

    // If distance is less than 2px, skip this new point (it's trash geometry)
    if (Math.abs(x - lastX) < 2 && Math.abs(y - lastY) < 2) {
        continue;
    }
    
    result.push(x, y);
  }

  // B. Second pass: Remove Collinear Points (Straight lines broken into pieces)
  // If A -> B -> C is a straight line, we remove B.
  if (result.length < 6) return result; // Need at least 3 points to optimize

  const finalPoints: number[] = [result[0], result[1]];

  for (let i = 2; i < result.length - 2; i += 2) {
    const prevX = finalPoints[finalPoints.length - 2];
    const prevY = finalPoints[finalPoints.length - 1];
    
    const currX = result[i];
    const currY = result[i + 1];
    
    const nextX = result[i + 2];
    const nextY = result[i + 3];

    // Check perfectly horizontal or vertical alignment
    // (We use a tiny threshold of 1px to be safe against sub-pixel rendering)
    const isHorizontal = Math.abs(prevY - currY) < 1 && Math.abs(currY - nextY) < 1;
    const isVertical = Math.abs(prevX - currX) < 1 && Math.abs(currX - nextX) < 1;

    if (!isHorizontal && !isVertical) {
      finalPoints.push(currX, currY);
    }
  }

  // Always add the very last point
  finalPoints.push(result[result.length - 2], result[result.length - 1]);

  return finalPoints;
};


export const getOrthogonalPoints = (
  start: Point,
  end: Point,
  startSide: Side,
  endSide: Side,
  padding: number = 40,
  arrowLength: number = 0
): number[] => {
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
  
  // Adjust actual target tip for arrow length
  let tx = ex, ty = ey;
  if (arrowLength > 0) {
      switch (endSide) {
          case "top": ty -= arrowLength; break;
          case "right": tx += arrowLength; break;
          case "bottom": ty += arrowLength; break;
          case "left": tx -= arrowLength; break;
      }
  }

  switch (endSide) {
    case "top":    p2y -= padding; break;
    case "bottom": p2y += padding; break;
    case "right":  p2x += padding; break;
    case "left":   p2x -= padding; break;
  }
  
  // Snap intermediates
  p2x = snap(p2x);
  p2y = snap(p2y);
  tx = snap(tx);
  ty = snap(ty);

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
  points.push(tx, ty);

  return simplifyPoints(points);
};