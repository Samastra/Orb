"use client";

import { useCallback } from "react";
import { saveBoardElements } from "@/lib/actions/board-elements-actions";
import { ReactShape, ImageShape } from "@/types/board-types";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection } from "@/hooks/useBoardState";

type Line = { tool: "brush" | "eraser"; points: number[] };

export const useAutoSave = (boardId: string, isTemporary: boolean, userId?: string) => {
  const triggerSave = useCallback(
    async (data: {
      reactShapes: ReactShape[];
      konvaShapes: KonvaShape[];
      stageFrames: KonvaShape[];
      images: ImageShape[];
      connections: Connection[];
      lines: Line[];
      scale?: number; // Add scale
      position?: { x: number; y: number }; // Add position
    }) => {
      if (!boardId || isTemporary || !userId) {
        console.log("🚫 Auto-save skipped: missing boardId, temporary board, or userId", {
          boardId,
          isTemporary,
          userId,
        });
        return;
      }

      try {
        console.log("💾 Triggering auto-save for board:", boardId, {
          reactShapes: data.reactShapes.length,
          konvaShapes: data.konvaShapes.length,
          stageFrames: data.stageFrames.length,
          images: data.images.length,
          connections: data.connections.length,
          lines: data.lines.length,
          scale: data.scale,
          position: data.position,
        });

        await saveBoardElements(
          boardId,
          {
            reactShapes: data.reactShapes,
            konvaShapes: data.konvaShapes,
            stageFrames: data.stageFrames,
            images: data.images,
            connections: data.connections,
            lines: data.lines,
          },
          {
            scale: data.scale || 1,
            position: data.position || { x: 0, y: 0 },
          },
          userId
        );

        console.log("✅ Auto-save completed for board:", boardId);
      } catch (error) {
        console.error("❌ Error during auto-save:", error);
      }
    },
    [boardId, isTemporary, userId]
  );

  return { triggerSave };
};