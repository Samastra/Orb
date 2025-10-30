// components/TextCreateTool.tsx
"use client";

import React, { useCallback, useEffect, useRef } from "react";
import Konva from "konva";

interface TextCreateToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  activeTool: string | null;
  onTextCreate: (position: { x: number; y: number }) => void;
}

const TextCreateTool: React.FC<TextCreateToolProps> = ({
  stageRef,
  activeTool,
  onTextCreate,
}) => {
  const isCreating = useRef(false);

  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (activeTool !== "text" || isCreating.current) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    // Prevent creating text when clicking on existing elements
    if (e.target !== stage) return;

    // Get click position in stage coordinates
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePos = transform.point(pointerPos);

    console.log('📝 Creating text at:', stagePos);
    onTextCreate(stagePos);

    isCreating.current = true;
    setTimeout(() => {
      isCreating.current = false;
    }, 100);
  }, [activeTool, stageRef, onTextCreate]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.on('click', handleStageClick);
    return () => {
      stage.off('click', handleStageClick);
    };
  }, [stageRef, handleStageClick]);

  return null;
};

export default TextCreateTool;