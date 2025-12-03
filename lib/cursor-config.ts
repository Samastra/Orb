// lib/cursor-config.ts
import { Tool } from "@/types/board-types";

// 1. ROBUST ENCODING: Use encodeURIComponent to satisfy all browsers
const encodeSvg = (svg: string) => {
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
};

// --- SVG DEFINITIONS ---

const SELECT_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z" fill="black" stroke="white" stroke-width="1"/>
</svg>`;

const PEN_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13.5 4.5L19.5 10.5L8.5 21.5L2.5 21.5L2.5 15.5L13.5 4.5Z" fill="black" stroke="white" stroke-width="1"/>
  <path d="M10.5 7.5L16.5 13.5" stroke="white" stroke-width="1"/>
</svg>`;

const CROSSHAIR_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4V20M4 12H20" stroke="black" stroke-width="1.5" stroke-linecap="square"/>
  <circle cx="12" cy="12" r="10" stroke="white" stroke-width="1" opacity="0.5"/>
</svg>`;

// IMPROVED GRAB HAND
const GRAB_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="white" d="M19.95 24H10.236C8.257 24 6.632 22.25 6.914 20.306L7.769 14.417L4.773 15.659C4.249 15.876 3.642 15.753 3.236 15.347L2.529 14.64L9.088 8.082C9.463 7.707 9.972 7.5 10.5 7.5H11V3.5C11 2.671 11.671 2 12.5 2C13.329 2 14 2.671 14 3.5V10.5H15V5.5C15 4.671 15.671 4 16.5 4C17.329 4 18 4.671 18 5.5V10.5H19V7.5C19 6.671 19.671 6 20.5 6C21.329 6 22 6.671 22 7.5V16C22 20.418 21.082 24 19.95 24Z" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;

// IMPROVED GRABBING HAND
const GRABBING_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill="#e2e8f0" d="M19.95 24H10.236C8.257 24 6.632 22.25 6.914 20.306L7.769 14.417L4.773 15.659C4.249 15.876 3.642 15.753 3.236 15.347L2.529 14.64L9.088 8.082C9.463 7.707 9.972 7.5 10.5 7.5H11V3.5C11 2.671 11.671 2 12.5 2C13.329 2 14 2.671 14 3.5V10.5H15V5.5C15 4.671 15.671 4 16.5 4C17.329 4 18 4.671 18 5.5V10.5H19V7.5C19 6.671 19.671 6 20.5 6C21.329 6 22 6.671 22 7.5V16C22 20.418 21.082 24 19.95 24Z" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;

const ERASER_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="20" height="20" rx="10" stroke="black" stroke-width="1.5" fill="rgba(255,255,255,0.3)"/>
  <rect x="7" y="7" width="10" height="10" rx="2" fill="black"/>
</svg>`;

const CONNECT_SVG = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 12L19 5M12 12L5 19M12 12C12 12 13 15 10 18C7 21 4 21 4 21M12 12C12 12 9 11 6 14C3 17 3 20 3 20" stroke="black" stroke-width="1.5"/>
  <circle cx="19" cy="5" r="3" stroke="black" stroke-width="1.5" fill="white"/>
</svg>`;

// --- EXPORTED FUNCTION ---

export const getRichCursor = (
  tool: Tool | null, 
  mode: "brush" | "eraser", 
  isPanning: boolean, 
  isDragging: boolean
): string => {
  // 1. Panning overrides everything (Spacebar)
  if (isPanning) {
    return isDragging 
      ? `${encodeSvg(GRABBING_SVG)} 12 12, grabbing` 
      : `${encodeSvg(GRAB_SVG)} 12 12, grab`; 
  }

  // 2. Tool based cursors
  switch (tool) {
    case "select":
    case null:
      return `${encodeSvg(SELECT_SVG)} 2 2, default`; 

    case "pen":
      if (mode === "eraser") {
        return `${encodeSvg(ERASER_SVG)} 12 12, cell`; 
      }
      return `${encodeSvg(PEN_SVG)} 2 22, crosshair`; 

    case "rect":
    case "circle":
    case "ellipse":
    case "triangle":
    case "arrow":
    case "text":
      return `${encodeSvg(CROSSHAIR_SVG)} 12 12, crosshair`;

    case "connect":
      return "crosshair"; // REVERTED TO STANDARD CSS CURSOR
      
    case "stickyNote":
      return `${encodeSvg(CROSSHAIR_SVG)} 12 12, crosshair`;

    default:
      return "default";
  }
};