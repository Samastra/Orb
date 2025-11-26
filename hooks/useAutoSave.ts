"use client";

import { useCallback, useRef } from "react";
import { saveBoardElements } from "@/lib/actions/board-elements-actions";
import { ReactShape, ImageShape } from "@/types/board-types";
import { KonvaShape } from "@/hooks/useShapes";
import { Connection } from "@/hooks/useBoardState";

type Line = { tool: "brush" | "eraser"; points: number[] };

// Utility for deep equality comparison
const areEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
      if (obj1[key].length !== obj2[key].length) return false;
      for (let i = 0; i < obj1[key].length; i++) {
        if (!areEqual(obj1[key][i], obj2[key][i])) return false;
      }
    } else if (!areEqual(obj1[key], obj2[key])) {
      return false;
    }
  }
  return true;
};

export const useAutoSave = (boardId: string, isTemporary: boolean, userId?: string) => {
  // Store last saved data to prevent unnecessary saves
  const lastSavedDataRef = useRef<any>(null);

  const triggerSave = useCallback(
    async (data: {
      reactShapes: ReactShape[];
      konvaShapes: KonvaShape[];
      stageFrames: KonvaShape[];
      images: ImageShape[];
      connections: Connection[];
      lines: Line[];
      scale?: number;
      position?: { x: number; y: number };
    }, immediate: boolean = false) => {
      if (!boardId || isTemporary || !userId) {
        console.log("🚫 Auto-save skipped: missing boardId, temporary board, or userId", {
          boardId,
          isTemporary,
          userId,
        });
        return;
      }

      // Normalize data for comparison
      const normalizedData = {
        reactShapes: data.reactShapes || [],
        konvaShapes: data.konvaShapes || [],
        stageFrames: data.stageFrames || [],
        images: data.images || [],
        connections: data.connections || [],
        lines: data.lines || [],
        scale: data.scale || 1,
        position: data.position || { x: 0, y: 0 },
      };

      // Skip change detection for immediate saves (e.g., new elements)
      if (!immediate && lastSavedDataRef.current && areEqual(normalizedData, lastSavedDataRef.current)) {
        console.log("🚫 No changes detected, skipping auto-save for board:", boardId);
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
          immediate,
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
        lastSavedDataRef.current = normalizedData; // Update last saved data
      } catch (error) {
        console.error("❌ Error during auto-save:", error);
      }
    },
    [boardId, isTemporary, userId]
  );

  return { triggerSave };
};