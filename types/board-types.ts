import Konva from "konva";
import { KonvaShape } from '@/hooks/useShapes';
import { Connection } from '@/hooks/useBoardState'; // ADD THIS IMPORT
// IN types/board-types.ts - ADD THIS EXPORT
export type { Connection } from '@/hooks/useBoardState';
// ---------- Action Types ----------
export type Action =
  | { type: "add"; node: Konva.Shape | Konva.Group }
  | { type: "add-react-shape"; shapeType: string; data: ReactShape }
  | { type: "add-line"; line: { tool: 'brush' | 'eraser', points: number[] } }
  | { type: "add-konva-shape"; shapeType: Tool; data: KonvaShape }
  | { type: "delete-konva-shape"; data: KonvaShape }
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
  | { type: "update-react-shape"; id: string; prevData: ReactShape; newData: ReactShape }
  | { type: "update-konva-shape"; id: string; prevData: KonvaShape; newData: KonvaShape }
  | { type: "add-stage-frame"; data: KonvaShape }
  | { type: "delete-stage-frame"; data: KonvaShape }
  | { type: "add-image"; data: ImageShape }
  | { type: "delete-image"; data: ImageShape }
  | { type: "add-connection"; data: Connection } // ADD THIS
  | { type: "delete-connection"; connectionId: string } // ADD THIS
  | { type: "update-connection"; id: string; prevData: Connection; newData: Connection }; // ADD THIS
   

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
  | "eraser"
  | "image";

// ---------- Shape Types ----------
export interface ImageShape extends BaseShape {
  type: 'image';
  width: number;
  height: number;
  src: string;
  rotation: number;
  draggable: boolean;
  originalWidth?: number;
  originalHeight?: number;
  aspectRatio?: number;
}

// In board-types.ts, update the ReactShape interface to fix type compatibility:


// Add to board-types.ts
export interface BaseShape {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  draggable?: boolean;
}

export type ReactShape = BaseShape & {
  type: 'text' | 'stickyNote';
  text?: string;
  fontSize?: number;
  fill?: string;
  stageGroupId?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: string;
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
  stageFrames: KonvaShape[];
  setStageFrames: React.Dispatch<React.SetStateAction<KonvaShape[]>>;
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
  images: ImageShape[];
  setImages: React.Dispatch<React.SetStateAction<ImageShape[]>>;
  connections: Connection[]; // ADD THIS
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>; // ADD THIS
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