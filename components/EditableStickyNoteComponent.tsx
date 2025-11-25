import React, { useRef, forwardRef, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import Konva from "konva";

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
  };
  isSelected: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (newAttrs: Record<string, unknown>) => void;
  onDragStart?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

const StickyNoteComponent = forwardRef<Konva.Group, StickyNoteProps>(
  ({ shapeData, isSelected, activeTool, onSelect, onUpdate, onDragStart, onDragMove, onDragEnd }, ref) => {
    const groupRef = useRef<Konva.Group>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const {
      x,
      y,
      width = 200,
      height = 150,
      backgroundColor = "#ffeb3b",
      textColor = "#000000",
      text = "Double click to edit...",
      fontSize = 14,
      fontFamily = "Arial",
    } = shapeData;

    const handleDoubleClick = () => {
      if (activeTool === "select") {
        setIsEditing(true);
        
        // Create a textarea for editing
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.fontSize = `${fontSize}px`;
        textarea.style.fontFamily = fontFamily;
        textarea.style.color = textColor;
        textarea.style.background = 'transparent';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.zIndex = '9999';
        textarea.style.width = `${width - 20}px`;
        textarea.style.height = `${height - 20}px`;
        textarea.style.padding = '10px';
        textarea.style.background = backgroundColor;
        
        document.body.appendChild(textarea);
        
        // Position the textarea over the sticky note
        const stage = groupRef.current?.getStage();
        if (stage) {
          const absPos = groupRef.current?.getAbsolutePosition();
          if (absPos) {
            textarea.style.left = `${absPos.x + 10}px`;
            textarea.style.top = `${absPos.y + 10}px`;
          }
        }
        
        textarea.focus();
        textarea.select();
        
        const handleBlur = () => {
          // Update the text
          onUpdate({
            ...shapeData,
            text: textarea.value
          });
          
          // Clean up
          document.body.removeChild(textarea);
          setIsEditing(false);
          textarea.removeEventListener('blur', handleBlur);
        };
        
        textarea.addEventListener('blur', handleBlur);
        
        // Also handle Enter key to finish editing
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' && e.ctrlKey) {
            handleBlur();
          }
        };
        
        textarea.addEventListener('keydown', handleKeyDown);
      }
    };

    return (
      <Group
        ref={(node) => {
          groupRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        x={x}
        y={y}
        draggable={activeTool === "select" && !isEditing}
        onClick={onSelect}
        onDblClick={handleDoubleClick}
        onDblTap={handleDoubleClick}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
      >
        <Rect
          width={width}
          height={height}
          fill={backgroundColor}
          stroke={isSelected ? "#007AFF" : "#d4b500"}
          strokeWidth={isSelected ? 3 : 1}
          shadowBlur={5}
          shadowColor="rgba(0,0,0,0.2)"
          shadowOffsetX={2}
          shadowOffsetY={2}
          cornerRadius={8}
        />
        
        <Text
          x={10}
          y={10}
          text={text}
          fontSize={fontSize}
          fill={textColor}
          fontFamily={fontFamily}
          width={width - 20}
          height={height - 20}
          wrap="word"
          listening={false} // Text doesn't intercept clicks
        />
      </Group>
    );
  }
);

StickyNoteComponent.displayName = "StickyNoteComponent";
export default StickyNoteComponent;