import Konva from "konva";
// In board-types.ts, add this import at the top:
import { KonvaShape } from '@/hooks/useShapes'; // Adjust the path as needed

// The rest of your board-types.ts code remains the same
// ---------- Action Types ----------
// Add these to your Action type
export type Action =
  | { type: "add"; node: Konva.Shape | Konva.Group }
  | { type: "add-react-shape"; shapeType: string; data: ReactShape }
  | { type: "add-line"; line: { tool: 'brush' | 'eraser', points: number[] } }
  | { type: "add-konva-shape"; shapeType: Tool; data: KonvaShape } // NEW
  | { type: "delete-konva-shape"; data: KonvaShape } // NEW
  | {
      type: "update";
      id: string;
      prevAttrs: Konva.NodeConfig;
      newAttrs: Konva.NodeConfig;
    }
  | { type: "delete"; node: Konva.Shape | Konva.Group }
  | { type: "delete-react-shape"; data: any }
  | { type: "delete-line"; lineIndex: number }
  | { type: "add-stage-with-text"; stageGroup: Konva.Group; textShape: ReactShape }
  | { type: "update-react-shape"; id: string; prevData: ReactShape; newData: ReactShape } // NEW
  | { type: "update-konva-shape"; id: string; prevData: KonvaShape; newData: KonvaShape }; // NEW
// ---------- Tool Types ----------
export type Tool =
  | "select"
  | "stickyNote"
  | "stage"
  | "text"
  | "rect"
  | "pen"
  | "connect"
  | "sort"
  | "ellipse"
  | "shapes"
  | "triangle"
  | "arrow"
  | "circle"
  | "eraser";

// ---------- Shape Types ----------


export type ReactShape = {
  id: string;
  type: string;
  x: number;
  y: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  stageGroupId?: string;
  // Add formatting properties for text shapes
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: string;
  draggable?: boolean;

  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;

  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  // ADD Z-INDEX FOR LAYERING
  zIndex?: number;
};

// ---------- Board State Types ----------
export type BoardState = {
  scale: number;
  position: { x: number; y: number };
  activeTool: Tool | null;
  actions: Action[];
  undoneActions: Action[];
  reactShapes: ReactShape[];
  selectedNodeId: string | null;
  drawingMode: 'brush' | 'eraser';
  lines: Array<{tool: 'brush' | 'eraser', points: number[]}>;
  stageDimensions: { width: number; height: number };
  tempDimensions: { width: number; height: number };
  connectionStart: { x: number; y: number } | null;
  tempConnection: Konva.Line | null;
  isConnecting: boolean;
  showResources: boolean;
  showSaveModal: boolean;
  isTemporaryBoard: boolean;
  currentBoardId: string;
  showSetupDialog: boolean;
  boardInfo: { title: string; category: string };
};

// ---------- Tool Handlers Types ----------
export type ToolHandlers = {
  handleToolChange: (tool: Tool | null) => void;
  addShape: (type: Tool) => void;
  handleMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  handleTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleShapeClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
};