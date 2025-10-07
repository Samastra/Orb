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
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: string;
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
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  align?: string;
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
  fontFamily = "Arial",
  fontWeight = "normal",
  fontStyle = "normal",
  textDecoration = "none",
  align = "left",
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

  // Apply formatting properties when they change
  useEffect(() => {
    if (textRef.current) {
      textRef.current.getLayer()?.batchDraw();
    }
  }, [fontFamily, fontWeight, fontStyle, textDecoration, align]);

  const handleTextDblClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleTextChange = useCallback(
    (newText: string) => {
      onUpdate({ text: newText });
    },
    [onUpdate]
  );

  // FIXED: Uniform scaling like Figma/Illustrator
  const handleTransformEnd = useCallback(() => {
    const node = textRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const activeAnchor = trRef.current?.getActiveAnchor();

    let newWidth = textWidth;
    let newFontSize = fontSize;

    // For corner anchors → scale uniformly (both font size and width)
    if (
      activeAnchor?.includes("top-left") ||
      activeAnchor?.includes("top-right") ||
      activeAnchor?.includes("bottom-left") ||
      activeAnchor?.includes("bottom-right")
    ) {
      // Use the average of scaleX and scaleY for uniform scaling, or just scaleY for font
      const uniformScale = (scaleX + scaleY) / 2;
      newFontSize = Math.max(5, Math.round(fontSize * uniformScale));
      newWidth = Math.max(30, Math.round(textWidth * uniformScale));
      setTextWidth(newWidth);
    }
    // For middle-left and middle-right anchors → change width only (text wrapping)
    else if (activeAnchor === "middle-left" || activeAnchor === "middle-right") {
      newWidth = Math.max(30, Math.round(textWidth * scaleX));
      setTextWidth(newWidth);
    }
    // For middle-top and middle-bottom anchors → change font size only
    else if (activeAnchor === "middle-top" || activeAnchor === "middle-bottom") {
      newFontSize = Math.max(5, Math.round(fontSize * scaleY));
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
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fontVariant="normal"
        fontWeight={fontWeight}
        textDecoration={textDecoration}
        align={align}
        verticalAlign="middle"
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
            "middle-top",    // Added for vertical scaling
            "middle-bottom", // Added for vertical scaling
          ]}
          boundBoxFunc={(oldBox, newBox) => ({
            ...newBox,
            width: Math.max(30, newBox.width),
            height: Math.max(20, newBox.height),
          })}
          keepRatio={false} // We handle ratio manually for better text control
        />
      )}
    </>
  );
};

export default EditableTextComponent;