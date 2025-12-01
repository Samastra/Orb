"use client";
import React, { useRef, useEffect, useState, useImperativeHandle } from "react";
import { Group, Rect, Text } from "react-konva";
import Konva from "konva";

interface StickyNoteProps {
  id: string;
  shapeData: any;
  isSelected: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (attrs: any) => void;
  draggable?: boolean;
  // FIX: Allow 'any' event type to handle both MouseEvent and TouchEvent without conflict
  onClick?: (e: Konva.KonvaEventObject<any>) => void;
  onTap?: (e: Konva.KonvaEventObject<any>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  name?: string;
}

const EditableStickyNoteComponent = React.forwardRef<Konva.Group, StickyNoteProps>(
  (
    {
      id,
      shapeData,
      isSelected,
      activeTool,
      onSelect,
      onUpdate,
      draggable,
      onClick,
      onTap,
      onDragStart,
      onDragMove,
      onDragEnd,
      name,
    },
    ref
  ) => {
    const groupRef = useRef<Konva.Group>(null);
    const textRef = useRef<Konva.Text>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Expose ref to parent
    useImperativeHandle(ref, () => groupRef.current!);

    // --- COLORS ---
    // Critical Fix: Use 'fill' from shapeData, fallback to yellow if missing
    const backgroundColor = shapeData.fill || "#ffeb3b";
    
    // Calculate text color (always dark for better contrast on pastel sticky notes)
    const textColor = "#1f1f1f"; 

    // --- DIMENSIONS ---
    const width = shapeData.width || 200;
    const height = shapeData.height || 200;
    const padding = 20;

    // --- EDITING LOGIC ---
    useEffect(() => {
      if (!isEditing) return;

      const group = groupRef.current;
      const stage = group?.getStage();
      if (!group || !stage) return;

      // Create textarea for editing
      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);

      const textNode = textRef.current;
      const tr = stage.findOne("Transformer");
      if (tr) tr.hide(); // Hide transformer while editing

      // Position textarea over the canvas
      const updateTextareaPos = () => {
        const textPos = group.getAbsolutePosition();
        const stageBox = stage.container().getBoundingClientRect();
        const areaPosition = {
          x: stageBox.left + textPos.x + padding,
          y: stageBox.top + textPos.y + padding,
        };
        const absScale = group.getAbsoluteScale();

        textarea.value = shapeData.text || "";
        
        Object.assign(textarea.style, {
          position: "fixed",
          top: `${areaPosition.y}px`,
          left: `${areaPosition.x}px`,
          width: `${(width - padding * 2) * absScale.x}px`,
          height: `${(height - padding * 2) * absScale.y}px`,
          fontSize: `${20 * absScale.y}px`,
          border: "none",
          padding: "0px",
          margin: "0px",
          overflow: "hidden",
          background: "none",
          outline: "none",
          resize: "none",
          lineHeight: "1.5",
          fontFamily: "Inter, sans-serif", // Match your app font
          color: textColor,
          textAlign: "left",
          zIndex: "10000", // Ensure it's on top
        });
      };

      updateTextareaPos();
      textarea.focus();

      // Handle Save
      const handleFinish = () => {
        onUpdate({ text: textarea.value });
        setIsEditing(false);
        if (textarea.parentNode) {
          document.body.removeChild(textarea);
        }
        if (tr) tr.show();
      };

      // Event Listeners
      const handleKeydown = (e: KeyboardEvent) => {
        // Stop event from bubbling to Konva
        e.stopPropagation();
        if (e.key === "Escape") {
          handleFinish();
        }
      };

      const handleBlur = () => {
        handleFinish();
      };

      textarea.addEventListener("keydown", handleKeydown);
      textarea.addEventListener("blur", handleBlur);

      return () => {
        if (textarea.parentNode) {
          document.body.removeChild(textarea);
        }
        textarea.removeEventListener("keydown", handleKeydown);
        textarea.removeEventListener("blur", handleBlur);
      };
    }, [isEditing, width, height, shapeData.text, onUpdate]);

    return (
      <Group
        id={id}
        ref={groupRef}
        x={shapeData.x}
        y={shapeData.y}
        rotation={shapeData.rotation || 0}
        draggable={!isEditing && (draggable ?? true)}
        name={name} // Important for 'selectable-shape' logic
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          if (onClick) onClick(e);
        }}
        onTap={(e) => {
          if (onTap) onTap(e);
        }}
        onDblClick={() => setIsEditing(true)}
        onDblTap={() => setIsEditing(true)}
      >
        {/* 1. Sticky Note Body (The Box) */}
        <Rect
          width={width}
          height={height}
          fill={backgroundColor}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.1}
          shadowOffsetX={5}
          shadowOffsetY={5}
          cornerRadius={2} // Slight rounded corner for realism
        />

        {/* 2. Sticky Note Text */}
        <Text
          ref={textRef}
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          text={isEditing ? "" : (shapeData.text || "Double click to edit")}
          fontSize={20}
          fontFamily="Inter, sans-serif"
          fill={textColor}
          align="left"
          verticalAlign="top"
          lineHeight={1.5}
          wrap="word"
          ellipsis={true}
          opacity={isEditing ? 0 : 1} // Hide Konva text when HTML textarea is active
          listening={false} // Let clicks pass through to the Group/Rect
        />
      </Group>
    );
  }
);

EditableStickyNoteComponent.displayName = "EditableStickyNoteComponent";
export default EditableStickyNoteComponent;