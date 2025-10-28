"use server";

import { createSupabaseClient } from "../supabase";
import { ReactShape, ImageShape } from "@/types/board-types";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection } from "@/hooks/useBoardState";
import { createUserIfNotExists } from "./user-actions";

interface BoardElement {
  board_id: string;
  type: string;
  properties: unknown;
  created_by: string | null;
}

type Line = { tool: "brush" | "eraser"; points: number[] };

const normalizeKonvaShape = (shape: KonvaShape): KonvaShape => {
  const baseShape: KonvaShape = {
    id: shape.id,
    type: shape.type,
    x: shape.x ?? 0,
    y: shape.y ?? 0,
    fill: shape.fill ?? "#ffffff",
    stroke: shape.stroke ?? "#000000",
    strokeWidth: shape.strokeWidth ?? 0,
    draggable: shape.draggable ?? true,
    rotation: shape.rotation ?? 0,
    cornerRadius: shape.cornerRadius ?? 0,
  };

  switch (shape.type) {
    case "rect":
      return {
        ...baseShape,
        width: shape.width ?? 100,
        height: shape.height ?? 100,
      };
    case "circle":
      return {
        ...baseShape,
        radius: shape.radius ?? 50,
      };
    case "ellipse":
      return {
        ...baseShape,
        radiusX: shape.radiusX ?? 80,
        radiusY: shape.radiusY ?? 50,
      };
    case "triangle":
      return {
        ...baseShape,
        points: shape.points ?? [0, 0, 100, 0, 50, 86.6],
      };
    case "arrow":
      return {
        ...baseShape,
        points: shape.points ?? [0, 0, 100, 0],
      };
    default:
      return baseShape;
  }
};

export const saveBoardElements = async (
  boardId: string,
  elements: {
    reactShapes: ReactShape[];
    konvaShapes: KonvaShape[];
    stageFrames: KonvaShape[];
    images: ImageShape[];
    connections: Connection[];
    lines?: Line[];
  },
  stageState?: {
    scale: number;
    position: { x: number; y: number };
  },
  clerkUserId?: string
) => {
  const safeStageState = stageState || { scale: 1, position: { x: 0, y: 0 } };
  const safeLines = elements.lines || [];

  console.log("💾 Saving board elements + stage state:", {
    scale: safeStageState.scale,
    position: safeStageState.position,
    reactShapes: elements.reactShapes.length,
    konvaShapes: elements.konvaShapes.length,
    stageFrames: elements.stageFrames.length,
    images: elements.images.length,
    connections: elements.connections.length,
    lines: safeLines.length,
  });

  const supabase = createSupabaseClient();

  try {
    let supabaseUserId = null;
    if (clerkUserId) {
      const user = await createUserIfNotExists(clerkUserId);
      supabaseUserId = user.id;
      console.log("🔄 Converted Clerk ID to Supabase ID:", { clerkUserId, supabaseUserId });
    }

    const { error: deleteError } = await supabase
      .from("board_elements")
      .delete()
      .eq("board_id", boardId);

    if (deleteError) throw deleteError;

    const allElements: BoardElement[] = [];

    allElements.push({
      board_id: boardId,
      type: "stage-state",
      properties: safeStageState,
      created_by: supabaseUserId,
    });

    elements.reactShapes.forEach(shape => {
      allElements.push({
        board_id: boardId,
        type: shape.type,
        properties: shape,
        created_by: supabaseUserId,
      });
    });

    elements.konvaShapes.forEach(shape => {
      const normalizedShape = normalizeKonvaShape(shape);
      allElements.push({
        board_id: boardId,
        type: shape.type,
        properties: normalizedShape,
        created_by: supabaseUserId,
      });
    });

    elements.stageFrames.forEach(frame => {
      allElements.push({
        board_id: boardId,
        type: "stage-frame",
        properties: frame,
        created_by: supabaseUserId,
      });
    });

    elements.images.forEach(image => {
      allElements.push({
        board_id: boardId,
        type: "image",
        properties: image,
        created_by: supabaseUserId,
      });
    });

    elements.connections.forEach(connection => {
      allElements.push({
        board_id: boardId,
        type: "connection",
        properties: connection,
        created_by: supabaseUserId,
      });
    });

    safeLines.forEach((line, index) => {
      allElements.push({
        board_id: boardId,
        type: "line",
        properties: { ...line, id: `line-${index}-${Date.now()}` },
        created_by: supabaseUserId,
      });
    });

    console.log(`📦 Inserting ${allElements.length} elements`);

    const { data, error } = await supabase
      .from("board_elements")
      .insert(allElements)
      .select();

    if (error) throw error;

    console.log("✅ Successfully saved board elements");
    return data;
  } catch (error) {
    console.error("❌ Error saving board elements:", error);
    throw error;
  }
};

export const loadBoardElements = async (boardId: string) => {
  console.log("📥 Loading board elements for board:", boardId);

  const supabase = createSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("board_elements")
      .select("*")
      .eq("board_id", boardId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    console.log("✅ Loaded board elements:", data?.length);

    const reactShapes: ReactShape[] = [];
    const konvaShapes: KonvaShape[] = [];
    const stageFrames: KonvaShape[] = [];
    const images: ImageShape[] = [];
    const connections: Connection[] = [];
    const lines: Line[] = [];
    let stageState = { scale: 1, position: { x: 0, y: 0 } };

    data?.forEach(element => {
      const shapeData = element.properties;

      if (element.type === "stage-state") {
        stageState = shapeData;
        console.log("🎯 Loaded stage state:", stageState);
      } else {
        switch (element.type) {
          case "text":
          case "stickyNote":
            reactShapes.push(shapeData as ReactShape);
            break;
          case "rect":
          case "circle":
          case "ellipse":
          case "triangle":
          case "arrow":
            konvaShapes.push(normalizeKonvaShape(shapeData as KonvaShape));
            break;
          case "stage-frame":
            stageFrames.push(shapeData as KonvaShape);
            break;
          case "image":
            images.push(shapeData as ImageShape);
            break;
          case "connection":
            connections.push(shapeData as Connection);
            break;
          case "line":
            lines.push({
              tool: shapeData.tool,
              points: shapeData.points,
            } as Line);
            break;
        }
      }
    });

    console.log("✅ Processed board elements:", {
      reactShapes: reactShapes.length,
      konvaShapes: konvaShapes.length,
      stageFrames: stageFrames.length,
      images: images.length,
      connections: connections.length,
      lines: lines.length,
    });

    return {
      reactShapes,
      konvaShapes,
      stageFrames,
      images,
      connections,
      lines,
      stageState,
    };
  } catch (error) {
    console.error("❌ Error loading board elements:", error);
    throw error;
  }
};