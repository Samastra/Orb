import React, { useRef, forwardRef, useImperativeHandle, useState } from "react";
import { Group, Rect } from "react-konva";
import Konva from "konva";
import TextComponent from "./TextComponent"; // Updated import

interface StickyNoteProps {
  shapeData: {
    id: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    textColor?: string;
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    align?: string;
    letterSpacing?: number;
    lineHeight?: number;
    textTransform?: string;
  };
  isSelected: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (newAttrs: Record<string, unknown>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
}

const EditableStickyNoteComponent = forwardRef<Konva.Group, StickyNoteProps>(
  ({ shapeData, isSelected, activeTool, onSelect, onUpdate, onDragStart, onDragMove, onDragEnd, onTransformEnd }, ref) => {
    const groupRef = useRef<Konva.Group>(null);
    const [isTextEditing, setIsTextEditing] = useState(false);
    
    useImperativeHandle(ref, () => groupRef.current as Konva.Group);
    
    const {
      id,
      x,
      y,
      width = 200,
      height = 150,
      backgroundColor = "#ffeb3b",
      textColor = "#000000",
      text = "Double click to edit...",
      fontSize = 14,
      fontFamily = "Arial",
      fontWeight = "normal",
      fontStyle = "normal",
      textDecoration = "none",
      align = "left",
      letterSpacing = 0,
      lineHeight = 1.4,
      textTransform = "none"
    } = shapeData;

    const handleTextUpdate = (textAttrs: Record<string, unknown>) => {
      onUpdate({
        ...shapeData,
        ...textAttrs
      });
    };

    const handlePositionUpdate = (positionAttrs: { x?: number; y?: number }) => {
      onUpdate({
        ...shapeData,
        x: positionAttrs.x !== undefined ? positionAttrs.x : x,
        y: positionAttrs.y !== undefined ? positionAttrs.y : y
      });
    };

    const handleGroupDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
      onUpdate({
        ...shapeData,
        x: e.target.x(),
        y: e.target.y()
      });
      // Call external onDragEnd if provided
      if (onDragEnd) {
        onDragEnd(e);
      }
    };

    const handleGroupTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
      // Call external onTransformEnd if provided
      if (onTransformEnd) {
        onTransformEnd(e);
      }
    };

    const handleStartEditing = () => {
      setIsTextEditing(true);
    };

    const handleFinishEditing = () => {
      setIsTextEditing(false);
    };

    return (
      <Group
        ref={groupRef}
        x={x}
        y={y}
        draggable={activeTool === "select" && !isTextEditing}
        onClick={onSelect}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={handleGroupDragEnd}
        onTransformEnd={handleGroupTransformEnd}
        onTap={onSelect}       
        transformsEnabled={"all"}
      >
        <Rect
          width={width}
          height={height}
          fill={backgroundColor}
          stroke="#d4b500"
          strokeWidth={1}
          shadowBlur={isSelected ? 10 : 5}
          shadowColor="rgba(0,0,0,0.2)"
          shadowOffsetX={2}
          shadowOffsetY={2}
          cornerRadius={8}
          transformsEnabled={"all"}
        />
        
        <TextComponent
          id={id}
          x={10}
          y={10}
          text={text}
          fontSize={fontSize}
          fill={textColor}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontStyle={fontStyle}
          align={align as "left" | "center" | "right"}
          width={width - 20}
          rotation={0}
          isSelected={isSelected}
          isEditing={isTextEditing}
          activeTool={activeTool}
          onSelect={onSelect}
          onUpdate={(attrs) => {
            if (attrs.x !== undefined || attrs.y !== undefined) {
              handlePositionUpdate(attrs);
            } else {
              handleTextUpdate(attrs);
            }
          }}
          onStartEditing={handleStartEditing}
          onFinishEditing={handleFinishEditing}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
      </Group>
    );
  }
);

EditableStickyNoteComponent.displayName = "EditableStickyNoteComponent";
export default EditableStickyNoteComponent;