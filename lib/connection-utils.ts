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

// 1. FUZZY MATH HELPER (The Curve Fix)
const isClose = (a: number, b: number) => Math.abs(a - b) < 0.5;

// HELPER: Remove redundant collinear points & duplicates
const simplifyPoints = (points: number[]): number[] => {
  // Need at least 2 points (x,y) + (x,y)
  if (points.length < 4) return points;

  // A. Filter out duplicate points (stacked on top of each other)
  const deduped: number[] = [points[0], points[1]];
  for (let i = 2; i < points.length; i += 2) {
    const curX = points[i];
    const curY = points[i + 1];
    const prevX = deduped[deduped.length - 2];
    const prevY = deduped[deduped.length - 1];

    // Only add if distance is significant (> 1px)
    if (Math.abs(curX - prevX) > 1 || Math.abs(curY - prevY) > 1) {
      deduped.push(curX, curY);
    }
  }

  if (deduped.length < 6) return deduped; // Need 3 points to simplify corners

  // B. Simplify Collinear lines using Fuzzy Math
  const simplified = [deduped[0], deduped[1]];

  for (let i = 2; i < deduped.length; i += 2) {
    const curX = deduped[i];
    const curY = deduped[i + 1];
    
    const prevX = simplified[simplified.length - 2];
    const prevY = simplified[simplified.length - 1];
    
    // Look back one more step
    const prevPrevX = simplified[simplified.length - 4];
    const prevPrevY = simplified[simplified.length - 3];

    if (prevPrevX === undefined) {
      simplified.push(curX, curY);
      continue;
    }

    // Check for collinearity using fuzzy logic
    // Vertical Line Check: All X's are close
    const isVertical = isClose(prevPrevX, prevX) && isClose(prevX, curX);
    
    // Horizontal Line Check: All Y's are close
    const isHorizontal = isClose(prevPrevY, prevY) && isClose(prevY, curY);

    if (isHorizontal || isVertical) {
      // Extend the line: Update the middle point to be current
      simplified[simplified.length - 2] = curX;
      simplified[simplified.length - 1] = curY;
    } else {
      // Turn detected: Add new point
      simplified.push(curX, curY);
    }
  }

  return simplified;
};

export const getOrthogonalPoints = (
  start: Point,
  end: Point,
  startSide: Side,
  endSide: Side,
  padding: number = 40,
  arrowLength: number = 0 // Default to 0 ensures tip touches edge
): number[] => {
  
  // 2. Calculate Target
  // We remove the retraction logic so the arrow tip touches the edge exactly.
  // If you want a gap, pass arrowLength > 0.
  const target = { ...end };
  if (arrowLength > 0) {
      switch (endSide) {
          case "top": target.y -= arrowLength; break;
          case "right": target.x += arrowLength; break;
          case "bottom": target.y += arrowLength; break;
          case "left": target.x -= arrowLength; break;
      }
  }

  const p1 = { ...start };
  const p2 = { ...target };

  // 3. Add Padding (The "Stub" coming out of the shape)
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

  // 4. Raw Points Calculation
  const rawPoints: number[] = [start.x, start.y, p1.x, p1.y];

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  const isHorizontalStart = startSide === "left" || startSide === "right";
  const isHorizontalEnd = endSide === "left" || endSide === "right";

  if (isHorizontalStart === isHorizontalEnd) {
      if (isHorizontalStart) {
          rawPoints.push(midX, p1.y);
          rawPoints.push(midX, p2.y);
      } else {
          rawPoints.push(p1.x, midY);
          rawPoints.push(p2.x, midY);
      }
  } else {
      rawPoints.push(p2.x, p1.y);
  }

  rawPoints.push(p2.x, p2.y);
  rawPoints.push(target.x, target.y);

  // 5. CLEAN THE POINTS (Fuzzy Math Applied)
  return simplifyPoints(rawPoints);
};