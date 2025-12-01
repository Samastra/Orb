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

    // --- DYNAMIC STYLES (Connected to Toolbar) ---
    // We check the specific props first, then fall back to defaults
    const backgroundColor = shapeData.backgroundColor || shapeData.fill || "#ffeb3b";
    const textColor = shapeData.textColor || shapeData.fill || "#1f1f1f";
    const fontSize = shapeData.fontSize || 20;
    const fontFamily = shapeData.fontFamily || "Inter, sans-serif";
    const fontWeight = shapeData.fontWeight || "normal";
    const fontStyle = shapeData.fontStyle || "normal";
    const align = shapeData.align || "left"; // Sticky notes usually look best left or center

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
          fontSize: `${fontSize * absScale.y}px`, // Dynamic Font Size
          border: "none",
          padding: "0px",
          margin: "0px",
          overflow: "hidden",
          background: "none",
          outline: "none",
          resize: "none",
          lineHeight: "1.5",
          fontFamily: fontFamily, // Dynamic Font Family
          fontWeight: fontWeight, // Dynamic Weight
          fontStyle: fontStyle,   // Dynamic Style
          color: textColor,       // Dynamic Color
          textAlign: align,       // Dynamic Align
          zIndex: "10000",
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
    }, [isEditing, width, height, shapeData.text, onUpdate, fontSize, fontFamily, fontWeight, fontStyle, textColor, align]);

    return (
      <Group
        id={id}
        ref={groupRef}
        x={shapeData.x}
        y={shapeData.y}
        rotation={shapeData.rotation || 0}
        draggable={!isEditing && (draggable ?? true)}
        name={name}
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
          fill={backgroundColor} // Connected to dynamic background
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.1}
          shadowOffsetX={5}
          shadowOffsetY={5}
          cornerRadius={2}
        />

        {/* 2. Sticky Note Text */}
        <Text
          ref={textRef}
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          text={isEditing ? "" : (shapeData.text || "Drop a thought...")} // Hide text while editing
          fontSize={fontSize}         // Connected
          fontFamily={fontFamily}     // Connected
          fontStyle={`${fontWeight} ${fontStyle}`} // Connected
          fill={textColor}            // Connected
          align={align}               // Connected
          verticalAlign="top"
          lineHeight={1.5}
          wrap="word"
          ellipsis={true}
          opacity={isEditing ? 0 : 1}
          listening={false}
        />
      </Group>
    );
  }
);

EditableStickyNoteComponent.displayName = "EditableStickyNoteComponent";
export default EditableStickyNoteComponent;