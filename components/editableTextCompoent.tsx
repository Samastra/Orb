"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Text, Transformer } from "react-konva";
import TextEditor from "@/components/TextEditor";
import Konva from "konva";

interface TextAttributes {
  x?: number;
  y?: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  width?: number;
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

  const [isEditing, setIsEditing] = useState(text === "");
  const [textWidth, setTextWidth] = useState(200);

  // cursor logic
  useEffect(() => {
    if (textRef.current) {
      const stage = textRef.current.getStage();
      if (stage && stage.container()) {
        const container = stage.container();
        if (activeTool === "text") {
          container.style.cursor = "text";
        } else {
          container.style.cursor = "default";
        }
      }
    }
  }, [activeTool]);

  // transformer selection logic
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

  const handleTextChange = useCallback(
    (newText: string) => {
      onUpdate({ text: newText });
    },
    [onUpdate]
  );

  const handleTransformEnd = useCallback(() => {
  const node = textRef.current;
  if (!node) return;

  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  let newWidth = textWidth;
  let newFontSize = fontSize;

  const activeAnchor = trRef.current?.getActiveAnchor();

  // Corner anchors → adjust font size
  if (
    activeAnchor?.includes("top") ||
    activeAnchor?.includes("bottom") ||
    activeAnchor?.includes("left") ||
    activeAnchor?.includes("right")
  ) {
    newFontSize = Math.max(5, node.fontSize() * scaleY);
  }

  // Side anchors → change width only
  if (activeAnchor === "middle-left" || activeAnchor === "middle-right") {
    newWidth = Math.max(30, node.width() * scaleX);
    setTextWidth(newWidth);
  }

  // Reset transform to avoid compounding
  node.scaleX(1);
  node.scaleY(1);

  onUpdate({
    width: newWidth,
    fontSize: newFontSize,
    x: node.x(),
    y: node.y(),
  });
}, [onUpdate, textWidth, fontSize]);


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
        width={textWidth}
        onDblClick={handleTextDblClick}
        onDblTap={handleTextDblClick}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onUpdate({
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransform={handleTransformEnd}
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
          enabledAnchors={[
            "middle-left",
            "middle-right",
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
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
