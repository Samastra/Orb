import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { Group, Rect } from "react-konva";
import Konva from "konva";
import EditableTextComponent from "./editableTextCompoent";
import EditableTextComponentProps from "./editableTextCompoent";

interface StickyNoteProps {
  shapeData: any;
  isSelected: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (newAttrs: any) => void;
}

const EditableStickyNoteComponent = forwardRef<Konva.Group, StickyNoteProps>(
  ({ shapeData, isSelected, activeTool, onSelect, onUpdate }, ref) => {
    const groupRef = useRef<Konva.Group>(null);
    
    // Use imperative handle to expose the group ref
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

    // Handle text updates
    const handleTextUpdate = (textAttrs: any) => {
      onUpdate({
        ...shapeData,
        ...textAttrs
      });
    };

    // Handle position updates (when text is dragged)
    const handlePositionUpdate = (positionAttrs: { x?: number; y?: number }) => {
      // Update the entire sticky note position
      onUpdate({
        ...shapeData,
        x: positionAttrs.x !== undefined ? positionAttrs.x : x,
        y: positionAttrs.y !== undefined ? positionAttrs.y : y
      });
    };

    // Handle group drag (move entire sticky note)
    const handleGroupDragEnd = (e: any) => {
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
        // Prevent transformation of the entire group
        transformsEnabled={"position"}
      >
        {/* Sticky Note Background */}
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
          // Prevent background transformation
          transformsEnabled={"position"}
        />
        
        {/* Editable Text Component */}
        <EditableTextComponent
          id={id}
          x={10} // Padding from left
          y={10} // Padding from top
          text={text}
          fontSize={fontSize}
          fill={textColor}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          fontStyle={fontStyle}
          textDecoration={textDecoration}
          align={align}
          letterSpacing={letterSpacing}
          lineHeight={lineHeight}
          textTransform={textTransform}
          isSelected={isSelected}
          activeTool={activeTool}
          onSelect={onSelect}
          onUpdate={(attrs) => {
            // If position changed, update the entire sticky note
            if (attrs.x !== undefined || attrs.y !== undefined) {
              handlePositionUpdate(attrs);
            } else {
              // Otherwise just update text properties
              handleTextUpdate(attrs);
            }
          }}
          // Text should be constrained to sticky note boundaries
          width={width - 20} // Account for padding
        />
      </Group>
    );
  }
);

EditableStickyNoteComponent.displayName = "EditableStickyNoteComponent";

export default EditableStickyNoteComponent;