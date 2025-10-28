import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { Group, Rect } from "react-konva";
import Konva from "konva";
import EditableTextComponent, { type TextAttributes } from "./editableTextCompoent";


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
}

const EditableStickyNoteComponent = forwardRef<Konva.Group, StickyNoteProps>(
  ({ shapeData, isSelected, activeTool, onSelect, onUpdate }, ref) => {
    const groupRef = useRef<Konva.Group>(null);
    
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
    };

    return (
      <Group
        ref={groupRef}
        x={x}
        y={y}
        draggable={activeTool === "select"}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleGroupDragEnd}
        transformsEnabled={"position"}
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
          transformsEnabled={"position"}
        />
        
        <EditableTextComponent
          id={id}
          x={10}
          y={10}
          text={text}
          fontSize={fontSize}
          fill={textColor}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontStyle={fontStyle}
          textDecoration={textDecoration}
          align={align as "left" | "center" | "right" | "justify"}
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
          textTransform={textTransform}
          isSelected={isSelected}
          activeTool={activeTool}
          onSelect={onSelect}
          onUpdate={(attrs: TextAttributes) => {
            if (attrs.x !== undefined || attrs.y !== undefined) {
              handlePositionUpdate(attrs);
            } else {
             handleTextUpdate(attrs as Record<string, unknown>);
            }
          }}
          width={width - 20}
        />
      </Group>
    );
  }
);

EditableStickyNoteComponent.displayName = "EditableStickyNoteComponent";

export default EditableStickyNoteComponent;