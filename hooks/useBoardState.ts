// hooks/useBoardState.ts
import { useState, useEffect, useCallback } from "react";
import Konva from "konva";
import { useParams } from "next/navigation";
import { BoardState, Tool, Action, ReactShape } from "../types/board-types";
import { defaultStageDimensions, defaultBoardInfo } from "../constants/tool-constants";

export const useBoardState = () => {
  const params = useParams();

  const [stageDimensions, setStageDimensions] = useState(defaultStageDimensions);
  const [tempDimensions, setTempDimensions] = useState(defaultStageDimensions);
  const [connectionStart, setConnectionStart] = useState<{ x: number; y: number } | null>(null);
  const [tempConnection, setTempConnection] = useState<Konva.Line | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [undoneActions, setUndoneActions] = useState<Action[]>([]);
  const [stageInstance, setStageInstance] = useState<Konva.Stage | null>(null);
  const [reactShapes, setReactShapes] = useState<ReactShape[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<"brush" | "eraser">("brush");
  const [lines, setLines] = useState<Array<{ tool: "brush" | "eraser"; points: number[] }>>([]);
  const [showResources, setShowResources] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isTemporaryBoard, setIsTemporaryBoard] = useState(false);
  const [currentBoardId, setCurrentBoardId] = useState<string>("");
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [boardInfo, setBoardInfo] = useState(defaultBoardInfo);

  // ---------------------------------------------------------------------------
  // ✅ FIXED + STABLE LAYER ORDER FUNCTIONS
  // ---------------------------------------------------------------------------

  /** Normalize zIndex values so they are sequential (0..n-1) */
  const normalizeZIndices = (shapesArr: ReactShape[]) => {
    const shapesCopy = shapesArr.map((s) => ({ ...s }));
    const sorted = [...shapesCopy].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    sorted.forEach((s, idx) => {
      s.zIndex = idx;
    });
    return sorted;
  };

  const bringForward = useCallback(() => {
    if (!selectedNodeId) return;
    setReactShapes((prev) => {
      const sorted = normalizeZIndices(prev);
      const idx = sorted.findIndex((s) => s.id === selectedNodeId);
      if (idx === -1 || idx === sorted.length - 1) return prev;

      const newArr = [...sorted];
      [newArr[idx], newArr[idx + 1]] = [newArr[idx + 1], newArr[idx]];

      const normalized = newArr.map((s, i) => ({ ...s, zIndex: i }));
      console.log("✅ bringForward:", normalized.map((s) => ({ id: s.id, z: s.zIndex })));
      return normalized;
    });
  }, [selectedNodeId]);

  const sendBackward = useCallback(() => {
    if (!selectedNodeId) return;
    setReactShapes((prev) => {
      const sorted = normalizeZIndices(prev);
      const idx = sorted.findIndex((s) => s.id === selectedNodeId);
      if (idx === -1 || idx === 0) return prev;

      const newArr = [...sorted];
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];

      const normalized = newArr.map((s, i) => ({ ...s, zIndex: i }));
      console.log("✅ sendBackward:", normalized.map((s) => ({ id: s.id, z: s.zIndex })));
      return normalized;
    });
  }, [selectedNodeId]);

  const bringToFront = useCallback(() => {
    if (!selectedNodeId) return;
    setReactShapes((prev) => {
      const sorted = normalizeZIndices(prev);
      const idx = sorted.findIndex((s) => s.id === selectedNodeId);
      if (idx === -1 || idx === sorted.length - 1) return prev;

      const selected = { ...sorted[idx] };
      const rest = sorted.filter((_, i) => i !== idx);
      rest.push(selected);

      const normalized = rest.map((s, i) => ({ ...s, zIndex: i }));
      console.log("🚀 bringToFront:", normalized.map((s) => ({ id: s.id, z: s.zIndex })));
      return normalized;
    });
  }, [selectedNodeId]);

  const sendToBack = useCallback(() => {
    if (!selectedNodeId) return;
    setReactShapes((prev) => {
      const sorted = normalizeZIndices(prev);
      const idx = sorted.findIndex((s) => s.id === selectedNodeId);
      if (idx === -1 || idx === 0) return prev;

      const selected = { ...sorted[idx] };
      const rest = sorted.filter((_, i) => i !== idx);
      rest.unshift(selected);

      const normalized = rest.map((s, i) => ({ ...s, zIndex: i }));
      console.log("📥 sendToBack:", normalized.map((s) => ({ id: s.id, z: s.zIndex })));
      return normalized;
    });
  }, [selectedNodeId]);

  // ---------------------------------------------------------------------------
  // Board ID management
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (params.boardId) {
      setCurrentBoardId(params.boardId as string);
    }
  }, [params.boardId]);

  // ---------------------------------------------------------------------------
  // Board status check
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const checkBoardStatus = async () => {
      try {
        const response = await fetch(`/api/boards/${currentBoardId}`);
        const board = await response.json();
        setIsTemporaryBoard(board.is_temporary || false);
      } catch (error) {
        console.error("Failed to fetch board status:", error);
      }
    };

    if (currentBoardId) {
      checkBoardStatus();
    }
  }, [currentBoardId]);

  // ---------------------------------------------------------------------------
  // RETURN HOOK STATE + ACTIONS
  // ---------------------------------------------------------------------------

  return {
    // State
    stageDimensions,
    tempDimensions,
    connectionStart,
    tempConnection,
    isConnecting,
    scale,
    position,
    activeTool,
    actions,
    undoneActions,
    stageInstance,
    reactShapes,
    selectedNodeId,
    drawingMode,
    lines,
    showResources,
    showSaveModal,
    isTemporaryBoard,
    currentBoardId,
    showSetupDialog,
    boardInfo,

    // Setters
    setStageDimensions,
    setTempDimensions,
    setConnectionStart,
    setTempConnection,
    setIsConnecting,
    setScale,
    setPosition,
    setActiveTool,
    setActions,
    setUndoneActions,
    setStageInstance,
    setReactShapes,
    setSelectedNodeId,
    setDrawingMode,
    setLines,
    setShowResources,
    setShowSaveModal,
    setIsTemporaryBoard,
    setCurrentBoardId,
    setShowSetupDialog,
    setBoardInfo,

    // Layer actions
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
  };
};
