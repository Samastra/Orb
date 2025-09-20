// components/EditableTextComponent.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Text, Transformer } from 'react-konva';
import TextEditor from './TextEditor';
import Konva from 'konva';

interface TextAttributes {
  x?: number;
  y?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  width?: number;
  height?: number;
}

interface EditableTextComponentProps {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  isSelected: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (attrs: TextAttributes) => void;
}

const EditableTextComponent: React.FC<EditableTextComponentProps> = ({
  id,
  x,
  y,
  text,
  fontSize,
  fill,
  isSelected,
  activeTool,
  onSelect,
  onUpdate,
}) => {
  const textRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Update cursor based on tool and hover state
  useEffect(() => {
    if (textRef.current) {
      const stage = textRef.current.getStage();
      if (stage && stage.container()) {
        const container = stage.container();
        if (activeTool === 'text' && isHovered) {
          container.style.cursor = 'text';
        } else if (isHovered) {
          container.style.cursor = 'pointer';
        } else {
          container.style.cursor = 'default';
        }
      }
    }
  }, [activeTool, isHovered]);

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && trRef.current && textRef.current && !isEditing) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    } else if (trRef.current) {
      trRef.current.nodes([]);
    }
  }, [isSelected, isEditing]);

  const handleTextDblClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleTextChange = useCallback((newText: string) => {
    onUpdate({ text: newText });
  }, [onUpdate]);

  const handleTransform = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const newWidth = Math.max(30, node.width() * scaleX);
    
    node.setAttrs({
      width: newWidth,
      scaleX: 1,
    });

    onUpdate({
      width: newWidth,
      fontSize: node.fontSize(),
    });
  }, [onUpdate]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <>
      <Text
        ref={textRef}
        id={id}
        x={x}
        y={y}
        text={text}
        fontSize={fontSize}
        fill={fill}
        draggable
        width={200}
        onDblClick={handleTextDblClick}
        onDblTap={handleTextDblClick}
        onClick={onSelect}
        onTap={onSelect}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDragEnd={(e) => {
          onUpdate({
            x: e.target.x(),
            y: e.target.y()
          });
        }}
        onTransform={handleTransform}
        visible={!isEditing}
      />
      
      {isEditing && textRef.current && (
        <TextEditor
          textNode={textRef.current}
          onChange={handleTextChange}
          onClose={() => setIsEditing(false)}
        />
      )}
      
      {isSelected && !isEditing && (
        <Transformer
          ref={trRef}
          enabledAnchors={['middle-left', 'middle-right',"top-right","top-left","bottom-left", "bottom-right"]}
          boundBoxFunc={(oldBox, newBox) => ({
            ...newBox,
            width: Math.max(30, newBox.width),
          })}
        />
      )}
    </>
  );
};

export default EditableTextComponent;