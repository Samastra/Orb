// components/TextComponent.tsx
"use client";

import React, { useRef, useEffect, useCallback, forwardRef } from "react";
import { Text as KonvaText, Transformer } from "react-konva";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";

interface TextComponentProps {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  align?: "left" | "center" | "right";
  width?: number;
  rotation?: number;
  isSelected: boolean;
  isEditing: boolean;
  activeTool: string | null;
  onSelect: () => void;
  onUpdate: (attrs: { 
    x?: number; 
    y?: number; 
    width?: number; 
    fontSize?: number; 
    rotation?: number; 
    text?: string;
    fontWeight?: string; // ← ADD THIS
    fontFamily?: string; // ← ADD THIS
    fontStyle?: string; // ← ADD THIS
    fill?: string; // ← ADD THIS
    align?: "left" | "center" | "right"; // ← ADD THIS
  }) => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
}

const TextComponent = forwardRef<Konva.Text, TextComponentProps>(
  (
    {
      id,
      x,
      y,
      text: initialText,
      fontSize,
      fill,
      fontFamily = "Inter, Arial, sans-serif",
      fontWeight = "400",
      fontStyle = "normal",
      align = "left",
      width = 200,
      rotation = 0,
      isSelected,
      isEditing,
      activeTool,
      onSelect,
      onUpdate,
      onStartEditing,
      onFinishEditing,
    },
    ref
  ) => {
    const textRef = useRef<Konva.Text>(null);
    const trRef = useRef<Konva.Transformer>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const isNew = useRef(true);

    // **AUTO-EDIT ON CREATE**
    useEffect(() => {
      if (isNew.current && !isEditing) {
        isNew.current = false;
        onStartEditing();
      }
    }, [isEditing, onStartEditing]);

    // **TRANSFORMER**
    useEffect(() => {
      if (isSelected && textRef.current && trRef.current && !isEditing) {
        trRef.current.nodes([textRef.current]);
        trRef.current.getLayer()?.batchDraw();
      } else if (trRef.current) {
        trRef.current.nodes([]);
      }
    }, [isSelected, isEditing]);

    // **LIVE WIDTH UPDATE ON TRANSFORM (NO STRETCH!)**
    const handleTransform = useCallback(() => {
      const node = textRef.current;
      const transformer = trRef.current;
      if (!node || !transformer) return;

      // Get current scale from the transform
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();

      // Detect if user is scaling diagonally (corner anchors)
      const activeAnchor = transformer.getActiveAnchor();
      const isCornerAnchor =
        activeAnchor &&
        (activeAnchor.includes("top") || activeAnchor.includes("bottom")) &&
        (activeAnchor.includes("left") || activeAnchor.includes("right"));

      if (isCornerAnchor) {
        // --- CORNER ANCHOR: SCALE FONT SIZE + WIDTH ---
        const oldFontSize = node.fontSize();
        const oldWidth = node.width();

        // Update font size and width proportionally
        const newFontSize = Math.max(6, Math.round(oldFontSize * scaleY)); // prevent collapse
        const newWidth = Math.max(50, oldWidth * scaleX);

        node.fontSize(newFontSize);
        node.width(newWidth);

        // Reset scale so further transforms build correctly
        node.scaleX(1);
        node.scaleY(1);
      } else {
        // --- SIDE ANCHORS: ONLY ADJUST WIDTH (KEEP WRAPPING) ---
        const newWidth = Math.max(50, node.width() * scaleX);
        node.width(newWidth);
        node.scaleX(1);
        node.scaleY(1);
      }

      node.getLayer()?.batchDraw();
    }, []);

    // **TRANSFORM END — UPDATE STATE**
    const handleTransformEnd = useCallback(() => {
      const node = textRef.current;
      if (!node) return;

      onUpdate({
        x: node.x(),
        y: node.y(),
        width: node.width(),
        fontSize: node.fontSize(),
        rotation: node.rotation(),
      });
    }, [onUpdate]);

    // **DRAG END**
    const handleDragEnd = useCallback(
      (e: KonvaEventObject<DragEvent>) => {
        const node = e.target;
        onUpdate({ x: node.x(), y: node.y() });
      },
      [onUpdate]
    );

    // **CLICK → SELECT**
    const handleClick = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (activeTool === "select" && !isEditing) onSelect();
      },
      [activeTool, isEditing, onSelect]
    );

    // **DOUBLE-CLICK → EDIT**
    const handleDblClick = useCallback(
      (e: KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        if (!isEditing) onStartEditing();
      },
      [isEditing, onStartEditing]
    );

    // **INLINE EDITOR**
    useEffect(() => {
      if (!isEditing || !textRef.current) return;

      const node = textRef.current;
      const stage = node.getStage();
      if (!stage) return;

      const editor = document.createElement("div");
      editorRef.current = editor;
      document.body.appendChild(editor);

      const { x: absX, y: absY } = node.getAbsolutePosition();
      const stageBox = stage.container().getBoundingClientRect();

      Object.assign(editor.style, {
        position: "fixed",
        left: `${stageBox.left + absX}px`,
        top: `${stageBox.top + absY}px`,
        width: `${node.width()}px`,
        minHeight: `${fontSize * 1.4}px`,
        fontSize: `${fontSize}px`,
        fontFamily,
        fontWeight:fontWeight,
        fontStyle,
        color: fill,
        textAlign: align,
        lineHeight: "1.4",
        padding: "0",
        margin: "0",
        border: "none",
        outline: "none",
        background: "transparent",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        cursor: "text",
        zIndex: "10000",
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "top left",
      });

      editor.contentEditable = "true";
      editor.innerHTML = initialText || "";

      const resize = () => {
        editor.style.height = "auto";
        editor.style.height = `${editor.scrollHeight}px`;
      };

      const handleInput = () => resize();
      const handleBlur = () => {
        const newText = editor.innerHTML;
        
        // Update text AND preserve all other text properties including fontWeight
        onUpdate({ 
          text: newText,
          // Preserve the current fontWeight and other properties
          fontWeight: fontWeight, // ← ADD THIS LINE
          fontFamily: fontFamily,
          fontSize: fontSize,
          fontStyle: fontStyle,
          fill: fill,
          align: align
        });
        
        // Auto-resize text node width to fit new content
        const tempText = new Konva.Text({ text: newText, fontSize, fontFamily });
        const minWidth = tempText.width() + 20;
        onUpdate({ width: Math.max(node.width(), minWidth) });
        onFinishEditing();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          editor.blur();
        }
        if (e.key === "Escape") editor.blur();
      };

      editor.addEventListener("input", handleInput);
      editor.addEventListener("blur", handleBlur);
      editor.addEventListener("keydown", handleKeyDown);
      resize();
      setTimeout(() => editor.focus(), 0);

      return () => {
        editor.removeEventListener("input", handleInput);
        editor.removeEventListener("blur", handleBlur);
        editor.removeEventListener("keydown", handleKeyDown);
        if (document.body.contains(editor)) {
          document.body.removeChild(editor);
        }
      };
    }, [
      isEditing,
      initialText,
      fontSize,
      fill,
      fontFamily,
      fontWeight,
      fontStyle,
      align,
      rotation,
      onUpdate,
      onFinishEditing,
    ]);

      const getKonvaFontWeight = (weight: string): string => {
      const numericWeight = parseInt(weight, 10);
      if (numericWeight >= 600) return "bold";
      return "normal";
    };


    // Add this useEffect to debug what's being received
      useEffect(() => {
        console.log('🎯 TextComponent received fontWeight:', {
          fontWeight,
          type: typeof fontWeight,
          fontFamily
        });
      }, [fontWeight, fontFamily]);

      // Also add this right before the return to see what Konva is getting
      console.log('🎨 Rendering KonvaText with:', {
        fontWeight,
        fontFamily,
        fontSize
      });


    useEffect(() => {
    console.log('🔧 TextComponent props:', {
      id,
      fontWeight,
      fontFamily,
      isEditing,
      isSelected
    });
  }, [id, fontWeight, fontFamily, isEditing, isSelected]);

    return (
      <>
        <KonvaText
          ref={textRef}
          id={id}
          x={x}
          y={y}
          text={initialText || "Click to edit"}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight={getKonvaFontWeight(fontWeight)}
          fontStyle={fontStyle}
          fill={fill}
          align={align}
          width={width}
          wrap="word"
          lineHeight={1.4}
          rotation={rotation}
          draggable={!isEditing}
          onDragEnd={handleDragEnd}
          onTransform={handleTransform}
          onTransformEnd={handleTransformEnd}
          onClick={handleClick}
          onTap={handleClick}
          onDblClick={handleDblClick}
          onDblTap={handleDblClick}
          visible={!isEditing}
        />

        {isSelected && !isEditing && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              newBox.width = Math.max(50, newBox.width);
              return newBox;
            }}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
            ]}
            rotateEnabled={true}
            keepRatio={false}
          />
        )}
      </>
    );
  }
);

TextComponent.displayName = "TextComponent";
export default TextComponent;