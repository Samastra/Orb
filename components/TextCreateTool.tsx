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

    // Prevent creating text on existing shapes
    if (e.target !== stage) return;

    isCreating.current = true;

    // Get click position in stage coordinates
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    const stagePos = transform.point(pointerPos);

    console.log('📝 Creating text at:', stagePos);
    onTextCreate(stagePos);

    // Reset after a short delay to prevent multiple creations
    setTimeout(() => {
      isCreating.current = false;
    }, 100);
  }, [activeTool, stageRef, onTextCreate]);

  // Setup event listeners
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.on('click', handleStageClick);

    return () => {
      stage.off('click', handleStageClick);
    };
  }, [stageRef, handleStageClick]);

  return null; // This component doesn't render anything
};

export default TextCreateTool;