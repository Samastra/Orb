"use server";

import { createSupabaseClient } from "../supabase";
import { ReactShape, ImageShape } from "@/types/board-types";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection } from "@/hooks/useBoardState";
import { createUserIfNotExists } from "./user-actions";

export const saveBoardElements = async (
  boardId: string, 
  elements: {
    reactShapes: ReactShape[];
    konvaShapes: KonvaShape[];
    stageFrames: KonvaShape[];
    images: ImageShape[];
    connections: Connection[];
  },
  stageState?: {
    scale: number;
    position: { x: number; y: number };
  },
  clerkUserId?: string
) => {
  // PROVIDE DEFAULT STAGE STATE
  const safeStageState = stageState || { scale: 1, position: { x: 0, y: 0 } };
  
  console.log("💾 Saving board elements + stage state:", {
    scale: safeStageState.scale,
    position: safeStageState.position,
    reactShapes: elements.reactShapes.length,
    konvaShapes: elements.konvaShapes.length,
    stageFrames: elements.stageFrames.length,
    images: elements.images.length,
    connections: elements.connections.length
  });

  const supabase = createSupabaseClient();

  try {
    // Convert Clerk ID to Supabase ID
    let supabaseUserId = null;
    if (clerkUserId) {
      const user = await createUserIfNotExists(clerkUserId);
      supabaseUserId = user.id;
      console.log("🔄 Converted Clerk ID to Supabase ID:", { clerkUserId, supabaseUserId });
    }

    // Delete existing elements
    const { error: deleteError } = await supabase
      .from("board_elements")
      .delete()
      .eq("board_id", boardId);

    if (deleteError) throw deleteError;

    // Prepare all elements for insertion
    const allElements: any[] = [];

    // ADD STAGE STATE AS FIRST ELEMENT
    allElements.push({
      board_id: boardId,
      type: 'stage-state',
      properties: safeStageState,
      created_by: supabaseUserId
    });

    // Process React Shapes
    elements.reactShapes.forEach(shape => {
      allElements.push({
        board_id: boardId,
        type: shape.type,
        properties: shape,
        created_by: supabaseUserId
      });
    });

    // Process Konva Shapes
    elements.konvaShapes.forEach(shape => {
      allElements.push({
        board_id: boardId,
        type: shape.type,
        properties: shape,
        created_by: supabaseUserId
      });
    });

    // Process Stage Frames
    elements.stageFrames.forEach(frame => {
      allElements.push({
        board_id: boardId,
        type: 'stage-frame',
        properties: frame,
        created_by: supabaseUserId
      });
    });

    // Process Images
    elements.images.forEach(image => {
      allElements.push({
        board_id: boardId,
        type: 'image',
        properties: image,
        created_by: supabaseUserId
      });
    });

    // Process Connections
    elements.connections.forEach(connection => {
      allElements.push({
        board_id: boardId,
        type: 'connection',
        properties: connection,
        created_by: supabaseUserId
      });
    });

    console.log(`📦 Inserting ${allElements.length} elements`);

    // Insert all elements
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

    // Transform back to application state
    const reactShapes: ReactShape[] = [];
    const konvaShapes: KonvaShape[] = [];
    const stageFrames: KonvaShape[] = [];
    const images: ImageShape[] = [];
    const connections: Connection[] = [];
    let stageState = { scale: 1, position: { x: 0, y: 0 } };

    data?.forEach(element => {
      const shapeData = element.properties;

      if (element.type === 'stage-state') {
        stageState = shapeData;
        console.log("🎯 Loaded stage state:", stageState);
      } else {
        switch (element.type) {
          case 'text':
          case 'stickyNote':
            reactShapes.push(shapeData as ReactShape);
            break;
          case 'rect':
          case 'circle':
          case 'ellipse':
          case 'triangle':
          case 'arrow':
            konvaShapes.push(shapeData as KonvaShape);
            break;
          case 'stage-frame':
            stageFrames.push(shapeData as KonvaShape);
            break;
          case 'image':
            images.push(shapeData as ImageShape);
            break;
          case 'connection':
            connections.push(shapeData as Connection);
            break;
        }
      }
    });

    return { 
      reactShapes, 
      konvaShapes, 
      stageFrames, 
      images, 
      connections,
      stageState 
    };

  } catch (error) {
    console.error("❌ Error loading board elements:", error);
    throw error;
  }
};