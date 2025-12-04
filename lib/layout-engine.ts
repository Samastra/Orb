// lib/layout-engine.ts
import { ReactShape } from "@/types/board-types";
import { KonvaShape } from "@/hooks/useShapes";

// CONSTANTS
const STICKY_SIZE = 200;
const GAP = 20;
const PADDING = 60; 

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 1. COLLISION DETECTOR
const isColliding = (candidate: Box, existingShapes: any[]): boolean => {
  const BUFFER = 50; 

  return existingShapes.some(shape => {
    let sx = shape.x;
    let sy = shape.y;
    let sw = shape.width || 100;
    let sh = shape.height || 100;

    if (shape.type === 'circle') {
       const r = shape.radius || 50;
       sx -= r; sy -= r; sw = r * 2; sh = r * 2;
    }

    return (
      candidate.x < sx + sw + BUFFER &&
      candidate.x + candidate.width > sx - BUFFER &&
      candidate.y < sy + sh + BUFFER &&
      candidate.y + candidate.height > sy - BUFFER
    );
  });
};

// 2. ADAPTIVE SPACE FINDER
export const findSafePosition = (
  startPos: { x: number, y: number },
  width: number,
  height: number,
  allShapes: any[]
): { x: number, y: number } => {
  
  if (allShapes.length === 0) return startPos;

  let x = startPos.x;
  let y = startPos.y;
  let angle = 0;
  let radius = 0;
  
  // FIX: Jump size is relative to the object size. 
  // If placing a huge frame, jump by 200px at a time, not 50px.
  const step = Math.max(50, Math.min(width, height) / 2); 
  
  let maxChecks = 150; // Increased retry limit

  while (maxChecks > 0) {
    const candidateBox = { x, y, width, height };
    
    if (!isColliding(candidateBox, allShapes)) {
      return { x, y }; 
    }

    // Spiral Logic
    angle += 0.5; // Wider turns
    radius += step; // Bigger jumps
    x = startPos.x + radius * Math.cos(angle);
    y = startPos.y + radius * Math.sin(angle);
    
    maxChecks--;
  }

  // Fallback: If still crowded, force a massive offset to the right
  return { x: startPos.x + width + 50, y: startPos.y };
};

// 3. AI LAYOUT GENERATOR
interface ParsedLayout {
  stageFrame: KonvaShape;
  stickyNotes: ReactShape[];
}

export const generateLayoutFromText = (
  text: string, 
  centerPos: { x: number, y: number },
  existingShapes: any[] = [] 
): ParsedLayout | null => {
  
  const titleMatch = text.match(/\*\*(.*?)\*\*/);
  const title = titleMatch ? titleMatch[1] : "Brainstorming Session";

  const lines = text.split('\n');
  const points = lines
    .filter(line => line.trim().match(/^[-*1-9]\.?\s+/))
    .map(line => line.replace(/^[-*1-9]\.?\s+/, '').trim())
    .filter(line => line.length > 0);

  if (points.length === 0) return null;

  const count = points.length;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);

  const gridWidth = columns * STICKY_SIZE + (columns - 1) * GAP;
  const gridHeight = rows * (STICKY_SIZE * 0.75) + (rows - 1) * GAP;

  const frameWidth = gridWidth + (PADDING * 2);
  const frameHeight = gridHeight + (PADDING * 2) + 40; 

  // Use the new Adaptive Search
  const safePos = findSafePosition(
    { x: centerPos.x - (frameWidth/2), y: centerPos.y - (frameHeight/2) }, 
    frameWidth, 
    frameHeight, 
    existingShapes
  );

  const frameX = safePos.x;
  const frameY = safePos.y;

  const stageFrameId = `stage-${crypto.randomUUID()}`;

  const stageFrame: KonvaShape = {
    id: stageFrameId,
    type: 'stage',
    x: frameX,
    y: frameY,
    width: frameWidth,
    height: frameHeight,
    name: title,
    fill: "#ffffff",
    stroke: "#E2E8F0",
    strokeWidth: 2,
    draggable: true,
  };

  const stickyNotes: ReactShape[] = points.map((point, index) => {
    const colIndex = index % columns;
    const rowIndex = Math.floor(index / columns);

    const relativeX = PADDING + (colIndex * (STICKY_SIZE + GAP));
    const relativeY = PADDING + 40 + (rowIndex * ((STICKY_SIZE * 0.75) + GAP));

    return {
      id: `sticky-${crypto.randomUUID()}`,
      type: 'stickyNote',
      x: frameX + relativeX, 
      y: frameY + relativeY,
      width: STICKY_SIZE,
      height: STICKY_SIZE * 0.75,
      text: point,
      fill: "#FEF3C7",
      fontSize: 14,
      fontFamily: "Inter, sans-serif",
      align: "center",
      draggable: true,
      stageGroupId: stageFrameId 
    };
  });

  return { stageFrame, stickyNotes };
};